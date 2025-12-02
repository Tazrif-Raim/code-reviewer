"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { EReviewStatus } from "@/shared/typedef/enums";
import { ReviewPolling } from "@/modules/reviews/components/reviewStatus";

export default async function ReviewComments(
  props: PageProps<"/repos/[id]/prs/[number]/reviews/[reviewId]">
) {
  const { reviewId } = await props.params;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div>Please log in to view review comments.</div>;
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .single();

  if (!review) {
    return <div>Review not found.</div>;
  }

  if (review.status === EReviewStatus.PENDING) {
    return <ReviewPolling reviewId={reviewId} />;
  }

  if (review.status === EReviewStatus.FAILED) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-red-500 text-6xl">✗</div>
        <h2 className="text-xl font-semibold">Review Failed</h2>
        <p className="text-muted-foreground">
          Something went wrong while processing your review. Please try again.
        </p>
      </div>
    );
  }

  return (
    <pre>
      {JSON.stringify(review.comments, null, 2)}
    </pre>
  )
}
