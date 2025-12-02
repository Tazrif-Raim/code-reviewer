"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { ReviewCard } from "./ReviewCard";

export async function ListReviews({
  repoId,
  githubPrNumber,
}: {
  repoId: string;
  githubPrNumber: number;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return <div>Please log in to view reviews.</div>;
  }

  const { data: reviewedPr, error: reviewedPrError } = await supabase
    .from("reviewed_prs")
    .select("id")
    .eq("pr_number", githubPrNumber)
    .eq("repo_id", repoId)
    .eq("user_id", user.id)
    .single();

  if (reviewedPrError || !reviewedPr) {
    return (
      <div className="text-white">No reviews found for this pull request.</div>
    );
  }

  const { data: reviews, error: fetchError } = await supabase
    .from("reviews")
    .select("id,commit_hash,commit_message,updated_at,comments,status")
    .eq("reviewed_pr_id", reviewedPr.id)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (fetchError) {
    return <div>Error fetching reviews: something went wrong</div>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-white">No reviews found for this pull request.</div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {reviews.map((review) => {
          const firstLine = review.commit_message.split("\n")[0];

          return (
            <ReviewCard
              key={review.id}
              review={{
                id: review.id,
                commitMessage: firstLine,
                updatedAt: review.updated_at,
                status: review.status,
              }}
              repoId={repoId}
              githubPrNumber={githubPrNumber}
            />
          );
        })}
      </div>
    </>
  );
}
