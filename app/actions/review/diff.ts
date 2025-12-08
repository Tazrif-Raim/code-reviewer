"use server";

import { Octokit } from "octokit";
import { createTwoFilesPatch } from "diff";
import { getPrDetails, getPrFiles, getFileContent, PrDetails } from "./github";

export interface FileDiff {
  filename: string;
  status: string;
  diff: string;
}

export async function generatePrDiff(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<{
  prDetails: PrDetails;
  diffs: FileDiff[];
  fullDiffContent: string;
}> {
  const prDetails = await getPrDetails(octokit, owner, repo, prNumber);

  const files = await getPrFiles(octokit, owner, repo, prNumber);

  const diffs: FileDiff[] = [];

  for (const file of files) {
    let oldContent = "";
    let newContent = "";

    const promises: Promise<void>[] = [];

    if (file.status !== "added") {
      promises.push(
        getFileContent(
          octokit,
          owner,
          repo,
          file.filename,
          prDetails.baseSha
        ).then((lines) => {
          oldContent = lines.join("\n");
        })
      );
    }

    if (file.status !== "removed") {
      promises.push(
        getFileContent(
          octokit,
          owner,
          repo,
          file.filename,
          prDetails.headSha
        ).then((lines) => {
          newContent = lines.join("\n");
        })
      );
    }

    await Promise.all(promises);

    const patch = createTwoFilesPatch(
      `a/${file.filename}`,
      `b/${file.filename}`,
      oldContent,
      newContent,
      "",
      "",
      { context: 99999 }
    );

    diffs.push({
      filename: file.filename,
      status: file.status,
      diff: patch,
    });
  }

  const fullDiffContent = buildFullDiffContent(owner, repo, prNumber, diffs);

  return { prDetails, diffs, fullDiffContent };
}

function buildFullDiffContent(
  owner: string,
  repo: string,
  prNumber: number,
  diffs: FileDiff[]
): string {
  const lines: string[] = [];

  lines.push(`PR CONTEXT REVIEW: ${owner}/${repo} #${prNumber}`);
  lines.push("Note: This contains FULL file content with diff markers.");
  lines.push("The [P:n] prefix shows the POSITION value to use for inline comments.");
  lines.push("=".repeat(50));
  lines.push("");

  for (const fileDiff of diffs) {
    lines.push(`FILE: ${fileDiff.filename}`);
    lines.push(`STATUS: ${fileDiff.status.toUpperCase()}`);
    lines.push("-".repeat(20));

    if (!fileDiff.diff || fileDiff.diff.trim() === "") {
      lines.push("(No text changes detected or binary file)");
    } else {
      lines.push(addPositionsToDiff(fileDiff.diff));
    }

    lines.push("");
    lines.push("=".repeat(50));
    lines.push("");
  }

  return lines.join("\n");
}

function addPositionsToDiff(patch: string): string {
  const lines = patch.split("\n");
  const result: string[] = [];
  let position = 0;
  let inHunk = false;

  for (const line of lines) {
    // Check if this is a hunk header
    if (line.startsWith("@@")) {
      inHunk = true;
      position = 0; // Reset position for each hunk
      result.push(line);
      continue;
    }

    // Before first hunk (file headers like --- and +++)
    if (!inHunk) {
      result.push(line);
      continue;
    }

    // Inside a hunk - add position prefix
    position++;
    // Format: [P:position] original_line
    result.push(`[P:${position}] ${line}`);
  }

  return result.join("\n");
}


