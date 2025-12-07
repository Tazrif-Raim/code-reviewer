import { createClient } from "npm:@supabase/supabase-js@2";
import { Octokit } from "npm:octokit";
import { generateObject } from "npm:ai";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google";
import { z } from "npm:zod";

const EReviewStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED_TO_COMMENT: "failed_to_comment",
  FAILED: "failed",
} as const;

const reviewSchema = z.object({
  body: z
    .string()
    .optional()
    .describe("Overall review summary with key findings (markdown supported)"),
  event: z
    .enum(["COMMENT"])
    .describe("Review verdict"),
  comments: z
    .array(
      z.object({
        path: z.string().describe("File path relative to repository root"),
        line: z
          .number()
          .describe("Line number in the new version of the file to comment on"),
        side: z
          .enum(["RIGHT", "LEFT"])
          .optional()
          .describe("Which side of the diff: RIGHT for new code, LEFT for old code. Defaults to RIGHT."),
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
  event: "COMMENT";
  comments?: Array<{
    path: string;
    line: number;
    side?: "RIGHT" | "LEFT";
    body: string;
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

  await octokit.request(
    "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
    {
      owner: prDetails.owner,
      repo: prDetails.repoName,
      pull_number: prDetails.prNumber,
      commit_id: review.commit_hash,
      body: aiComments.body || "AI Code Review",
      event: aiComments.event,
      comments: aiComments.comments?.map((comment) => ({
        path: comment.path,
        line: comment.line,
        side: comment.side || "RIGHT",
        body: comment.body,
        start_line: comment.start_line,
        start_side: comment.start_side,
      })),
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

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

  const {
    reviewId,
    llmApiKey,
    githubToken,
    prompt,
    shouldComment,
    prDetails,
    aiModel,
  } = await req.json();

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

      if (shouldComment) {
        try {
          await commentOnPr(
            reviewId,
            aiComments,
            supabase,
            githubToken,
            prDetails
          );
        } catch (error) {
          console.error(
            `Failed to comment on PR for review ${reviewId}:`,
            error
          );
          await supabase
            .from("reviews")
            .update({
              status: EReviewStatus.FAILED_TO_COMMENT,
              comments: aiComments,
              updated_at: new Date().toISOString(),
            })
            .eq("id", reviewId);
        }
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
