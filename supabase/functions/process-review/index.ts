import { createClient } from "npm:@supabase/supabase-js@2";
import { Octokit } from "npm:octokit";
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
  event: z
    .enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"])
    .describe("Review verdict"),
  comments: z
    .array(
      z.object({
        path: z.string().describe("File path relative to repository root"),
        line: z.number().describe("Line number in the new version of the file"),
        side: z
          .enum(["RIGHT", "LEFT"])
          .optional()
          .describe("Which side of the diff to comment on"),
        body: z.string().describe("Comment message (markdown supported)"),
        start_line: z
          .number()
          .optional()
          .describe("Start line for multi-line comments"),
        start_side: z
          .enum(["RIGHT", "LEFT"])
          .optional()
          .describe("Start side for multi-line comments"),
      })
    )
    .optional()
    .describe("Array of inline comments"),
});

interface GitHubReviewPayload {
  body?: string;
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  comments?: Array<{
    path: string;
    body: string;
    line: number;
    side?: "RIGHT" | "LEFT";
    start_line?: number;
    start_side?: "RIGHT" | "LEFT";
  }>;
}

interface ExtendedGlobal {
  EdgeRuntime?: {
    waitUntil: (promise: Promise<unknown>) => void;
  };
}

async function callGeminiApi(
  apiKey: string,
  prompt: string
): Promise<GitHubReviewPayload> {
  const google = createGoogleGenerativeAI({
    apiKey,
  });

  const model = google("gemini-2.5-pro");

  const { object } = await generateObject({
    model,
    schema: reviewSchema,
    prompt,
    temperature: 0.3,
    maxRetries: 0,
  });

  const comments = object.comments?.map((comment) => ({
    ...comment,
    side: comment.side || "RIGHT",
  }));

  return {
    body: object.body,
    event: object.event,
    comments,
  };
}

interface PrDetails {
  owner: string;
  repoName: string;
  prNumber: number;
}

async function commentOnPr(
  reviewId: string,
  aiComments: GitHubReviewPayload,
  supabase: ReturnType<typeof createClient>,
  githubToken: string,
  prDetails: PrDetails
): Promise<void> {
  const { data: review } = await supabase
    .from("reviews")
    .select("commit_hash")
    .eq("id", reviewId)
    .single();

  if (!review) {
    throw new Error("Review not found");
  }

  const octokit = new Octokit({ auth: githubToken });

  await octokit.rest.pulls.createReview({
    owner: prDetails.owner,
    repo: prDetails.repoName,
    pull_number: prDetails.prNumber,
    commit_id: review.commit_hash,
    body: aiComments.body || "AI Code Review",
    event: aiComments.event,
    comments: aiComments.comments?.map((comment) => ({
      path: comment.path,
      body: comment.body,
      line: comment.line,
      side: comment.side || "RIGHT",
      start_line: comment.start_line,
      start_side: comment.start_side,
    })),
  });

  await supabase
    .from("reviews")
    .update({
      commented_at: new Date().toISOString(),
    })
    .eq("id", reviewId);
}

Deno.serve(async (req) => {
  if (
    req.headers.get("x-internal-secret") !== Deno.env.get("INTERNAL_API_SECRET")
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { reviewId, llmApiKey, githubToken, prompt, shouldComment, prDetails } =
    await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const longRunningTask = async () => {
    try {
      const aiComments = await callGeminiApi(llmApiKey, prompt);

      await supabase
        .from("reviews")
        .update({
          status: EReviewStatus.COMPLETED,
          comments: aiComments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (shouldComment) {
        await commentOnPr(
          reviewId,
          aiComments,
          supabase,
          githubToken,
          prDetails
        );
      }
    } catch (error) {
      console.error(`Review ${reviewId} failed:`, error);
      await supabase
        .from("reviews")
        .update({
          status: EReviewStatus.FAILED,
          comments: null,
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
