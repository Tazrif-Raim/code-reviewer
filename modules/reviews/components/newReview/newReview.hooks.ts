"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TNewReviewValues } from "./newReview.types";
import {
  newReviewDefaultValues,
  newReviewResolver,
} from "./newReview.schema";
import { startReview } from "@/app/actions/review/review";

export function useNewReview({
  repoId,
  githubPrNumber,
}: {
  repoId: string;
  githubPrNumber: number;
}) {
  const router = useRouter();
  const form = useForm<TNewReviewValues>({
    resolver: newReviewResolver,
    defaultValues: newReviewDefaultValues,
  });

  const onSubmit = async (data: TNewReviewValues) => {
    try {
      const result = await startReview({
        repoId,
        githubPrNumber,
        reviewRuleIds: data.reviewRuleIds,
        customPrompt: data.customPrompt,
      });

      if (result.success) {
        toast.success("Review started! Processing in background...");
        router.push(`/repos/${repoId}/prs/${githubPrNumber}/reviews/${result.reviewId}`);
      } else {
        toast.error(result.error || "Failed to start review");
      }
    } catch {
      toast.error("An error occurred: " + "Something went wrong.");
    }
  };

  return { form, handleSubmit: form.handleSubmit(onSubmit) };
}
