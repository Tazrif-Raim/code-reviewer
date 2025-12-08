import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/shared/typedef/supabase.types";
import { decrypt } from "@/shared/utils/crypto/crypto";

export async function POST(req: Request) {
  const authHeader = req.headers.get("x-internal-secret");
  if (authHeader !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    repoId,
    pullNumber,
    reviewBody,
    comments,
    userId,
    reviewId,
    reviewEvent,
  } = await req.json();

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: repo, error: repoError } = await supabase
    .from("repos")
    .select("id, repo_name, owner_name, fine_grained_token")
    .eq("id", repoId)
    .eq("user_id", userId)
    .single();

  if (repoError || !repo) {
    return NextResponse.json(
      { ok: false, error: "Repository not found" },
      { status: 404 }
    );
  }

  const token = decrypt(repo.fine_grained_token);
  const octokit = new Octokit({ auth: token });

  // Comments already have position from AI, use directly
  const githubComments = comments.map((comment: { path: string; position: number; body: string }) => ({
    path: comment.path,
    position: comment.position,
    body: comment.body,
  }));

  await octokit.rest.pulls.createReview({
    owner: repo.owner_name,
    repo: repo.repo_name,
    pull_number: pullNumber,
    event: reviewEvent,
    body: reviewBody,
    comments: githubComments,
  });

  await supabase
    .from("reviews")
    .update({
      commented_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  return NextResponse.json({ ok: true });
}
