"use server";

export interface ReviewRule {
  id: string;
  title: string;
  body: string;
}

const BASE_PROMPT = `You are an expert code reviewer. Your task is to review the following Pull Request changes and provide detailed, actionable feedback.

## Instructions:
1. Analyze the code changes carefully
2. Focus on code quality, potential bugs, security issues, performance problems, and best practices
3. Be constructive and specific in your feedback
4. Provide a verdict: COMMENT for feedback
5. For each issue found, provide inline comments using the POSITION value shown in the diff

## IMPORTANT - Response Format:
You MUST respond with a valid JSON object that can be directly used to create a GitHub Pull Request Review.

## CRITICAL - UNDERSTANDING POSITION:
Each line in the diff is prefixed with [P:n] where n is the POSITION value.
- The position is the relative line number within each file's diff hunk
- Use this EXACT position value in your comments
- Position 1 is the first line after the @@ hunk header
- Example: [P:5] + const x = 1; means position 5 for this line

## CRITICAL - SCOPE OF REVIEW:
- You may ONLY comment on lines that appear in the diff
- Focus on added (+) or modified lines
- If you find an issue in code not shown in the diff, mention it in the main "body" summary instead
- If you specify an invalid position, the review will fail

### JSON Structure:
{
  "body": "Your overall review summary here with key findings.",
  "event": "COMMENT",
  "comments": [
    // Array of inline comments (optional, can be empty)
  ]
}

### Fields:
- "body" (required): A markdown-formatted summary of the review.
- "event" (required): Always "COMMENT"
- "comments" (optional): Array of inline comments for specific code locations

### Inline Comment Structure:
{
  "path": "src/api/client.ts",
  "position": 5,
  "body": "**Warning**: This function lacks error handling."
}

### Inline Comment Fields:
- "path" (required): File path relative to repository root (exactly as shown in FILE: header)
- "position" (required): The position value from [P:n] prefix in the diff
- "body" (required): The comment message. Supports Markdown.

### Code Suggestion Format:
To suggest a code change, use a suggestion block:
{
  "path": "src/utils.ts",
  "position": 15,
  "body": "Use a stricter equality check here.\\n\`\`\`suggestion\\nif (value === 10) {\\n\`\`\`"
}

### Guidelines:
- Be constructive and explain WHY something is an issue
- Use the EXACT position value shown in the [P:n] prefix
- If there are no issues, return: { "event": "COMMENT", "body": "### ✅ Looks Good!\\nNo issues found." }

## PR Changes (Unified Diff Format):
`;

export async function buildReviewPrompt(
  diffContent: string,
  reviewRules: ReviewRule[],
  customPrompt?: string
): Promise<string> {
  let prompt = BASE_PROMPT;

  prompt += "\n```\n" + diffContent + "\n```\n";

  if (reviewRules.length > 0) {
    prompt += "\n\n## Additional Review Rules to Apply:\n";
    reviewRules.forEach((rule, index) => {
      prompt += `\n### Rule ${index + 1}: ${rule.title}\n`;
      prompt += rule.body + "\n";
    });
  }

  if (customPrompt && customPrompt.trim()) {
    prompt += "\n\n## Additional Instructions from User:\n";
    prompt += customPrompt + "\n";
  }

  prompt += "\n\n## Your Review (JSON object format):\n";

  return prompt;
}
