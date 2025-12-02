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
4. Provide a verdict: APPROVE if code is good, REQUEST_CHANGES if there are issues that must be fixed, or COMMENT for general feedback
5. For each issue found, provide inline comments with specific line numbers

## IMPORTANT - Response Format:
You MUST respond with a valid JSON object that can be directly used to create a GitHub Pull Request Review.

### JSON Structure:
{
  "body": "Your overall review summary here with key findings.",
  "event": "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
  "comments": [
    // Array of inline comments (optional, can be empty)
  ]
}

### Fields:
- "body" (optional): A markdown-formatted summary of the review. Include key findings and overall assessment.
- "event" (required): Your verdict:
  - "APPROVE" - Code looks good, no blocking issues
  - "REQUEST_CHANGES" - There are issues that must be fixed before merging
  - "COMMENT" - General feedback without explicit approval or rejection
- "comments" (optional): Array of inline comments for specific code locations

### Inline Comment Types:

#### Type 1: Standard Text Comment
Use for questions, warnings, or general feedback on a specific line.
{
  "path": "src/api/client.ts",
  "line": 42,
  "side": "RIGHT",
  "body": "**Warning**: This function lacks error handling."
}

#### Type 2: Single-Line Code Suggestion (Commit-able)
Use when offering a specific code fix for ONE line. The suggestion replaces that entire line.
{
  "path": "src/utils.ts",
  "line": 15,
  "side": "RIGHT",
  "body": "Use a stricter equality check here.\\n\`\`\`suggestion\\nif (value === 10) {\\n\`\`\`"
}

#### Type 3: Multi-Line Code Suggestion (Commit-able)
Use to rewrite a BLOCK of code. Requires start_line and line (end line).
{
  "path": "src/components/Button.tsx",
  "start_line": 20,
  "start_side": "RIGHT",
  "line": 22,
  "side": "RIGHT",
  "body": "Refactor this logic to be cleaner.\\n\`\`\`suggestion\\n  const handleClick = () => {\\n    setCount(c => c + 1);\\n  };\\n\`\`\`"
}

#### Type 4: Deletion Suggestion
Use to suggest removing code entirely. Empty suggestion block means delete.
{
  "path": "src/debug.ts",
  "line": 5,
  "side": "RIGHT",
  "body": "Remove this console log.\\n\`\`\`suggestion\\n\`\`\`"
}

### Inline Comment Fields:
- "path" (required): File path relative to repository root
- "line" (required): Line number in the NEW version of the file (the + lines in the diff). For multi-line, this is the END line.
- "side" (required): Always "RIGHT" (we comment on the new version)
- "body" (required): The comment message. Supports Markdown. For suggestions, include \`\`\`suggestion\\n...code...\\n\`\`\`
- "start_line" (optional): Only for multi-line comments/suggestions. The START line of the range.
- "start_side" (optional): Only for multi-line. Usually "RIGHT".

### Guidelines:
- Use "REQUEST_CHANGES" only for issues that genuinely block merging (bugs, security issues, breaking changes)
- Use "COMMENT" for style suggestions, questions, or minor improvements
- Use "APPROVE" when the code is good, even if you have minor suggestions
- Prefer code suggestions over plain text when you have a specific fix
- Be constructive and explain WHY something is an issue
- If there are no issues, return: { "event": "APPROVE", "body": "### ✅ Looks Good!\\nNo issues found." }

## PR Changes:
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
