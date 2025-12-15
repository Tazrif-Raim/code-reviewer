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
    if (typeof reviewData === "string") {
      try {
        parsedReviewData = JSON.parse(reviewData);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Invalid reviewData format" }),
          { status: 400, headers: corsHeaders(origin) },
        );
      }
    }

    const { body, event, comments } = parsedReviewData || {};

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
