"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { EReviewStatus } from "@/shared/typedef/enums";
import { ReviewPolling } from "@/modules/reviews/components/reviewStatus";
import { after } from "next/server";

export default async function ReviewComments(
  props: PageProps<"/repos/[id]/prs/[number]/reviews/[reviewId]">
) {
  const { reviewId, number, id } = await props.params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  if (review.should_comment && review.comments !== null && review.commented_at === null) {
    const reviewData = review.comments as {
      body?: string;
      event: "COMMENT";
      comments?: Array<{
        path: string;
        position: number;
        body: string;
      }>;
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    after(async () => {
      await fetch(`${baseUrl}/api/post-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
        },
        body: JSON.stringify({
          reviewId,
          pullNumber: Number(number),
          repoId: id,
          reviewBody: reviewData.body || "",
          comments: reviewData.comments || [],
          userId: user.id,
          reviewEvent: reviewData.event,
        }),
      });
    });
  }

  return <pre>{JSON.stringify(review.comments, null, 2)}</pre>;
}
