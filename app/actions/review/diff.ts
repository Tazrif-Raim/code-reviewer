"use server";

import { Octokit } from "octokit";
import { getPrDetails, getFileContent, PrDetails } from "./github";

export interface FileDiff {
  filename: string;
  diff: string;
}

interface HunkInfo {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  positionStart: number;
  lines: { position: number; content: string; type: "add" | "delete" | "context" }[];
}

interface FileDiffInfo {
  filename: string;
  hunks: HunkInfo[];
  isNewFile: boolean;
  isDeleted: boolean;
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

  const { data: rawDiff } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: "diff",
    },
  });

  const diffString = rawDiff as unknown as string;

  const fileDiffInfos = parseGitHubDiff(diffString);

  const diffs: FileDiff[] = [];
  const fileOutputs: string[] = [];

  for (const fileInfo of fileDiffInfos) {
    const fileContent = fileInfo.isDeleted
      ? []
      : await getFileContent(octokit, owner, repo, fileInfo.filename, prDetails.headSha);

    const mergedContent = mergeFileWithDiff(fileContent, fileInfo);

    diffs.push({
      filename: fileInfo.filename,
      diff: mergedContent,
    });

    fileOutputs.push(`FILE: ${fileInfo.filename}`);
    if (fileInfo.isNewFile) fileOutputs.push("STATUS: NEW FILE");
    if (fileInfo.isDeleted) fileOutputs.push("STATUS: DELETED");
    fileOutputs.push("-".repeat(20));
    fileOutputs.push(mergedContent);
    fileOutputs.push("");
    fileOutputs.push("=".repeat(50));
    fileOutputs.push("");
  }

  const outputLines: string[] = [];
  outputLines.push(`PR CONTEXT REVIEW: ${owner}/${repo} #${prNumber}`);
  outputLines.push("");
  outputLines.push("## How to read this diff:");
  outputLines.push("- Lines with [P:n] prefix are from the diff and have POSITION values for inline comments");
  outputLines.push("- Lines with [P:n] + are ADDED lines - you CAN comment on these");
  outputLines.push("- Lines with [P:n] - are DELETED lines - you CAN comment on these");
  outputLines.push("- Lines with [P:n] (no +/-) are CONTEXT lines - DO NOT comment on these");
  outputLines.push("- Lines without [P:n] prefix are unchanged file content for reference only");
  outputLines.push("- Use the EXACT position value from [P:n] when creating inline comments");
  outputLines.push("");
  outputLines.push("=".repeat(50));
  outputLines.push("");
  outputLines.push(...fileOutputs);

  return { prDetails, diffs, fullDiffContent: outputLines.join("\n") };
}

function parseGitHubDiff(diffString: string): FileDiffInfo[] {
  const lines = diffString.split("\n");
  const files: FileDiffInfo[] = [];

  let currentFile: FileDiffInfo | null = null;
  let currentHunk: HunkInfo | null = null;
  let position = 0;

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      if (currentFile) {
        if (currentHunk) currentFile.hunks.push(currentHunk);
        files.push(currentFile);
      }
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      currentFile = {
        filename: match ? match[2] : "unknown",
        hunks: [],
        isNewFile: false,
        isDeleted: false,
      };
      currentHunk = null;
      position = 0;
      continue;
    }

    if (!currentFile) continue;

    if (line.startsWith("new file mode")) {
      currentFile.isNewFile = true;
      continue;
    }
    if (line.startsWith("deleted file mode")) {
      currentFile.isDeleted = true;
      continue;
    }

    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch) {
      if (currentHunk) currentFile.hunks.push(currentHunk);
      currentHunk = {
        oldStart: parseInt(hunkMatch[1], 10),
        oldCount: parseInt(hunkMatch[2] || "1", 10),
        newStart: parseInt(hunkMatch[3], 10),
        newCount: parseInt(hunkMatch[4] || "1", 10),
        positionStart: position + 1,
        lines: [],
      };
      continue;
    }

    if (currentHunk) {
      position++;
      if (line.startsWith("+")) {
        currentHunk.lines.push({ position, content: line.substring(1), type: "add" });
      } else if (line.startsWith("-")) {
        currentHunk.lines.push({ position, content: line.substring(1), type: "delete" });
      } else if (line.startsWith(" ") || line === "") {
        currentHunk.lines.push({ position, content: line.startsWith(" ") ? line.substring(1) : line, type: "context" });
      }
    }
  }

  if (currentFile) {
    if (currentHunk) currentFile.hunks.push(currentHunk);
    files.push(currentFile);
  }

  return files;
}

function mergeFileWithDiff(fileLines: string[], fileInfo: FileDiffInfo): string {
  if (fileInfo.isNewFile || fileInfo.isDeleted) {
    return formatDiffOnly(fileInfo);
  }

  interface LineInfo {
    position: number;
    type: "add" | "delete" | "context";
    content: string;
  }

  const lineMap = new Map<number, LineInfo[]>();
  const deletionsBeforeLine = new Map<number, LineInfo[]>();

  for (const hunk of fileInfo.hunks) {
    let newLineNum = hunk.newStart;

    for (const line of hunk.lines) {
      if (line.type === "delete") {
        if (!deletionsBeforeLine.has(newLineNum)) {
          deletionsBeforeLine.set(newLineNum, []);
        }
        deletionsBeforeLine.get(newLineNum)!.push({
          position: line.position,
          type: "delete",
          content: line.content,
        });
      } else {
        if (!lineMap.has(newLineNum)) {
          lineMap.set(newLineNum, []);
        }
        lineMap.get(newLineNum)!.push({
          position: line.position,
          type: line.type,
          content: line.content,
        });
        newLineNum++;
      }
    }
  }

  const output: string[] = [];
  
  for (let i = 0; i < fileLines.length; i++) {
    const lineNum = i + 1;
    const fileLine = fileLines[i];

    const deletions = deletionsBeforeLine.get(lineNum);
    if (deletions) {
      for (const del of deletions) {
        output.push(`[P:${del.position}] -${del.content}`);
      }
    }

    const diffLines = lineMap.get(lineNum);
    if (diffLines && diffLines.length > 0) {
      const diffLine = diffLines[0];
      if (diffLine.type === "add") {
        output.push(`[P:${diffLine.position}] +${fileLine}`);
      } else {
        output.push(`[P:${diffLine.position}]  ${fileLine}`);
      }
    } else {
      output.push(`     ${fileLine}`);
    }
  }

  const maxLine = fileLines.length + 1;
  const trailingDeletions = deletionsBeforeLine.get(maxLine);
  if (trailingDeletions) {
    for (const del of trailingDeletions) {
      output.push(`[P:${del.position}] -${del.content}`);
    }
  }

  return output.join("\n");
}

function formatDiffOnly(fileInfo: FileDiffInfo): string {
  const output: string[] = [];

  for (const hunk of fileInfo.hunks) {
    for (const line of hunk.lines) {
      const prefix = line.type === "add" ? "+" : line.type === "delete" ? "-" : " ";
      output.push(`[P:${line.position}] ${prefix}${line.content}`);
    }
  }

  return output.join("\n");
}


