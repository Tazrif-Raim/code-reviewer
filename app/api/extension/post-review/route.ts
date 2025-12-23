import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { decrypt } from "@/shared/utils/crypto/crypto";
import { Octokit } from "octokit";
import { NextResponse } from "next/server";
import { EReviewStatus } from "@/shared/typedef/enums";

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Content-Type": "application/json",
});

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "";
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || "";

  try {
    const {
      repoId,
      pullNumber,
      reviewId,
      reviewData,
      shouldComment,
    } = await req.json();

    let parsedReviewData = reviewData;
    
    // Debug: log the type and structure of reviewData
    console.log("reviewData type:", typeof reviewData);
    console.log("reviewData is array:", Array.isArray(reviewData));
    if (typeof reviewData === "string") {
      console.log("reviewData length:", reviewData.length);
      console.log("First 50 chars:", JSON.stringify(reviewData.slice(0, 50)));
    }

    if (reviewData && typeof reviewData === "string") {
      try {
        // Remove BOM, zero-width spaces, and other invisible characters from entire string
        let cleanData = reviewData
          .replace(/[\uFEFF\u200B\u200C\u200D\u2060\u00A0]/g, "") // Remove invisible chars everywhere
          .replace(/[\x00-\x1F\x7F]/g, (match) => {
            // Keep valid whitespace (tab, newline, carriage return), remove other control chars
            if (match === "\t" || match === "\n" || match === "\r") return match;
            return "";
          })
          .trim();

        const jsonBlockMatch = cleanData.match(
          /```(?:json)?\s*([\s\S]*?)\s*```/,
        );
        if (jsonBlockMatch) {
          cleanData = jsonBlockMatch[1];
        }

        try {
          parsedReviewData = JSON.parse(cleanData);
        } catch (e) {
          const firstBrace = cleanData.indexOf("{");
          const lastBrace = cleanData.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanData = cleanData.substring(firstBrace, lastBrace + 1);
          }

          try {
            parsedReviewData = JSON.parse(cleanData);
          } catch (e) {
            cleanData = cleanData.replace(/,(\s*[}\]])/g, "$1");

            try {
              parsedReviewData = JSON.parse(cleanData);
            } catch (e) {
              const sanitized = sanitizeJson(cleanData);
              parsedReviewData = JSON.parse(sanitized);
            }
          }
        }

        if (typeof parsedReviewData === "string") {
          try {
            parsedReviewData = JSON.parse(parsedReviewData);
          } catch (e) {
            // Ignore
          }
        }
      } catch (error) {
        console.error("JSON Parse Error:", error);
        console.error("Problematic Data:", reviewData);
        // Log first 10 character codes to identify invisible characters
        console.error(
          "First 10 char codes:",
          [...reviewData.slice(0, 10)].map((c) => c.charCodeAt(0)),
        );
        return new Response(
          JSON.stringify({
            error: "Invalid reviewData format",
            details: String(error),
          }),
          { status: 400, headers: corsHeaders(origin) },
        );
      }
    }

    if (!parsedReviewData || typeof parsedReviewData !== "object") {
      return new Response(
        JSON.stringify({ error: "reviewData must be a valid JSON object" }),
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    const { body, event, comments } = parsedReviewData;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders(origin) },
      );
    }

    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        comments: parsedReviewData,
        status: EReviewStatus.COMPLETED,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update review" }),
        { status: 500, headers: corsHeaders(origin) },
      );
    }

    if (shouldComment) {
      const { data: repo, error: repoError } = await supabase
        .from("repos")
        .select("id, repo_name, owner_name, fine_grained_token")
        .eq("id", repoId)
        .eq("user_id", user.id)
        .single();

      if (repoError || !repo) {
        return new Response(
          JSON.stringify({ error: "Repository not found" }),
          { status: 404, headers: corsHeaders(origin) },
        );
      }

      const token = decrypt(repo.fine_grained_token);
      const octokit = new Octokit({ auth: token });

      const githubComments = comments?.map((
        comment: { path: string; position: number; body: string },
      ) => ({
        path: comment.path,
        position: comment.position,
        body: comment.body,
      })) || [];

      await octokit.rest.pulls.createReview({
        owner: repo.owner_name,
        repo: repo.repo_name,
        pull_number: pullNumber,
        event: event || "COMMENT",
        body: body || "",
        comments: githubComments,
      });

      await supabase
        .from("reviews")
        .update({
          commented_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders(origin) },
    );
  } catch (error) {
    console.error("Extension post-review error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: corsHeaders(origin) },
    );
  }
}

function sanitizeJson(jsonString: string): string {
  let inString = false;
  let result = "";

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];

    if (char === '"') {
      // Check if this quote is escaped by counting preceding backslashes
      let backslashCount = 0;
      let j = i - 1;
      while (j >= 0 && jsonString[j] === "\\") {
        backslashCount++;
        j--;
      }

      // If odd number of backslashes, it's escaped
      if (backslashCount % 2 === 1) {
        result += char;
        continue;
      }

      // It's an unescaped quote. Is it structural?
      if (inString) {
        // We are inside a string. Does this quote end it?
        // Check next non-whitespace char
        let nextCharIndex = i + 1;
        while (
          nextCharIndex < jsonString.length &&
          /\s/.test(jsonString[nextCharIndex])
        ) {
          nextCharIndex++;
        }
        const nextChar = jsonString[nextCharIndex];

        if (nextChar && [":", ",", "}", "]"].includes(nextChar)) {
          // Looks like a closing quote
          inString = false;
          result += char;
        } else {
          // Doesn't look like a closing quote, escape it
          result += '\\"';
        }
      } else {
        // We are not inside a string. This must be an opening quote.
        inString = true;
        result += char;
      }
    } else {
      result += char;
    }
  }
  return result;
}
