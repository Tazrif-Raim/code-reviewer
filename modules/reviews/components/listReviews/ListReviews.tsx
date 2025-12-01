"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { ReviewCard } from "./ReviewCard";

export async function ListReviews({
  repoId,
  githubPrId,
}: {
  repoId: string;
  githubPrId: number;
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
    .eq("github_pr_id", githubPrId)
    .eq("user_id", user.id)
    .single();

  if (reviewedPrError || !reviewedPr) {
    return (
      <div className="text-white">
        No reviews found for this pull request.
      </div>
    );
  }

  const { data: reviews, error: fetchError } = await supabase
    .from("reviews")
    .select("id,commit_hash,commit_message,updated_at,comments")
    .eq("reviewed_pr_id", reviewedPr.id)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (fetchError) {
    return <div>Error fetching reviews: something went wrong</div>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-white">
        No reviews found for this pull request.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {reviews.map((review) => {
          const commentsArray = Array.isArray(review.comments) ? review.comments : [];
          const commentsCount = commentsArray.length;
          const firstLine = review.commit_message.split("\n")[0];

          return (
            <ReviewCard
              key={review.id}
              review={{
                id: review.id,
                commitMessage: firstLine,
                updatedAt: review.updated_at,
                commentsCount,
              }}
              repoId={repoId}
              githubPrId={githubPrId}
            />
          );
        })}
      </div>
    </>
  );
}
