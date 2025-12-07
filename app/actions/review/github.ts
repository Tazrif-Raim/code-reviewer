"use server";

import { Database } from "@/shared/typedef/supabase.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Octokit } from "octokit";

const IGNORE_EXTENSIONS = [".png", ".jpg", ".svg", ".pdf", ".zip", ".lock"];
const IGNORE_FILES = [
  "package-lock.json",
  "pnpm-lock.yaml",
  "go.sum",
  "go.mod",
];

export interface PrDetails {
  baseSha: string;
  headSha: string;
  title: string;
  number: number;
  githubPrNodeId: string;
}

export interface PrFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface LatestCommit {
  sha: string;
  message: string;
}

function shouldSkip(filename: string): boolean {
  if (IGNORE_FILES.includes(filename)) return true;
  if (IGNORE_EXTENSIONS.some((ext) => filename.endsWith(ext))) return true;
  return false;
}

export async function getPrDetails(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PrDetails> {
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return {
    baseSha: data.base.sha,
    headSha: data.head.sha,
    title: data.title,
    number: data.number,
    githubPrNodeId: data.node_id,
  };
}

export async function getPrFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PrFile[]> {
  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });

  return data
    .filter((file) => !shouldSkip(file.filename))
    .map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
    }));
}

export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  filepath: string,
  sha: string
): Promise<string[]> {
  try {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path: filepath,
        ref: sha,
        headers: {
          Accept: "application/vnd.github.v3.raw",
        },
      }
    );

    const data = response.data as unknown as string;
    if (typeof data === "string") {
      return data.split("\n");
    }

    return [];
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return [];
    }
    throw error;
  }
}

export async function getLatestCommit(
  octokit: Octokit,
  owner: string,
  repo: string,
  headSha: string
): Promise<LatestCommit> {
  const { data: commitData } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: headSha,
  });

  return {
    sha: headSha,
    message: commitData.commit.message,
  };
}

export async function commentOnPr(
  reviewId: string,
  aiComments: {
    body?: string;
    event: "COMMENT";
    comments?: Array<{
      path: string;
      body: string;
      line: number;
      side?: "RIGHT" | "LEFT";
      start_line?: number;
      start_side?: "RIGHT" | "LEFT";
    }>;
  },
  supabase: SupabaseClient<Database>,
  githubToken: string
): Promise<void> {
  const { data: review } = await supabase
    .from("reviews")
    .select(
      `
      id,
      commit_hash,
      reviewed_pr:reviewed_prs (
        pr_number,
        repo:repos (
          owner_name,
          repo_name
        )
      )
    `
    )
    .eq("id", reviewId)
    .single();

  if (!review?.reviewed_pr) {
    throw new Error("Review or PR not found");
  }

  const reviewedPr = review.reviewed_pr as {
    pr_number: number;
    repo: { owner_name: string; repo_name: string } | null;
  };

  if (!reviewedPr.repo) {
    throw new Error("Repository not found");
  }

  const octokit = new Octokit({ auth: githubToken });

  await octokit.rest.pulls.createReview({
    owner: reviewedPr.repo.owner_name,
    repo: reviewedPr.repo.repo_name,
    pull_number: reviewedPr.pr_number,
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
      should_comment: true,
    })
    .eq("id", reviewId);
}
