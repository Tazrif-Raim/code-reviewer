import { createClient } from "npm:@supabase/supabase-js@2";
import { generateObject } from "npm:ai";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google";
import { z } from "npm:zod";

const EReviewStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

const reviewSchema = z.object({
  body: z
    .string()
    .optional()
    .describe("Overall review summary with key findings (markdown supported)"),
  event: z.enum(["COMMENT"]).describe("Review verdict"),
  comments: z
    .array(
      z.object({
        path: z.string().describe("File path relative to repository root"),
        position: z
          .number()
          .describe("Position in the diff from the [P:n] prefix"),
        body: z.string().describe("Comment message (markdown supported)"),
      })
    )
    .optional()
    .describe("Array of inline comments"),
});

interface GitHubReviewPayload {
  body?: string;
  event: "COMMENT";
  comments?: Array<{
    path: string;
    position: number;
    body: string;
  }>;
}

interface ExtendedGlobal {
  EdgeRuntime?: {
    waitUntil: (promise: Promise<unknown>) => void;
  };
}

async function callGeminiApi(
  apiKey: string,
  prompt: string,
  aiModel: string
): Promise<GitHubReviewPayload> {
  const google = createGoogleGenerativeAI({
    apiKey,
  });

  const model = google(aiModel);

  const { object } = await generateObject({
    model,
    schema: reviewSchema,
    prompt,
    temperature: 0.3,
    maxRetries: 0,
  });

  return {
    body: object.body,
    event: object.event,
    comments: object.comments,
  };
}

Deno.serve(async (req) => {
  if (
    req.headers.get("x-internal-secret") !== Deno.env.get("INTERNAL_API_SECRET")
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { reviewId, llmApiKey, prompt, aiModel } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const longRunningTask = async () => {
    try {
      const aiComments = await callGeminiApi(llmApiKey, prompt, aiModel);

      await supabase
        .from("reviews")
        .update({
          status: EReviewStatus.COMPLETED,
          comments: aiComments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId);
    } catch (error) {
      console.error(`Review ${reviewId} failed:`, error);
      await supabase
        .from("reviews")
        .update({
          status: EReviewStatus.FAILED,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId);
    }
  };

  const globalScope = globalThis as unknown as ExtendedGlobal;

  if (globalScope.EdgeRuntime) {
    globalScope.EdgeRuntime.waitUntil(longRunningTask());
  } else {
    longRunningTask();
  }

  return new Response(
    JSON.stringify({ message: "Review processing started" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
