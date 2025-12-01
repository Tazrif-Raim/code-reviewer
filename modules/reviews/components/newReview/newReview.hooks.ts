"use client";

import { useForm } from "react-hook-form";
import { TNewReviewValues } from "./newReview.types";
import {
  newReviewDefaultValues,
  newReviewResolver,
} from "./newReview.schema";

export function useNewReview({
  githubPrId,
}: {
  githubPrId: number;
}) {
  const form = useForm<TNewReviewValues>({
    resolver: newReviewResolver,
    defaultValues: newReviewDefaultValues,
  });

  const onSubmit = async (data: TNewReviewValues) => {
    console.log({
      reviewRuleIds: data.reviewRuleIds,
      customPrompt: data.customPrompt,
      githubPrId,
    });
  };

  return { form, handleSubmit: form.handleSubmit(onSubmit) };
}
