"use server";

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
