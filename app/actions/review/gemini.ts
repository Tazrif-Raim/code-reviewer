"use server";

import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

export interface GitHubInlineComment {
  path: string;
  body: string;
  line: number;
  side?: "RIGHT" | "LEFT";
  start_line?: number;
  start_side?: "RIGHT" | "LEFT";
}

export interface GitHubReviewPayload {
  body?: string;
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  comments?: GitHubInlineComment[];
}

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
        line: z
          .number()
          .describe("Line number in the new version of the file"),
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

export async function callGeminiApi(
  apiKey: string,
  prompt: string
): Promise<GitHubReviewPayload> {
  const google = createGoogleGenerativeAI({
    apiKey,
  });

  const model = google("gemini-2.5-flash");

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
