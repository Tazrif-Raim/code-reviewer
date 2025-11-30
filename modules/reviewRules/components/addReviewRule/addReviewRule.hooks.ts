"use client";

import { useForm } from "react-hook-form";
import { TAddReviewRuleValues } from "./addReviewRule.types";
import {
  addReviewRuleDefaultValues,
  addReviewRuleResolver,
} from "./addReviewRule.schema";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addReviewRule } from "@/app/actions/reviewRules/action";

export function useAddReviewRule() {
  const router = useRouter();

  const form = useForm<TAddReviewRuleValues>({
    resolver: addReviewRuleResolver,
    defaultValues: addReviewRuleDefaultValues,
  });

  const onSubmit = async (data: TAddReviewRuleValues) => {
    try {
      const result = await addReviewRule(data);

      if (result.error) {
        toast.error("Failed to add review rule", {
          description: result.error,
        });
        return;
      }

      toast.success("Review rule added successfully");
      form.reset();
      router.push("/review-rules");
    } catch {
      toast.error("Failed to add review rule", {
        description: "An error occurred. Please try again.",
      });
      form.reset();
    }
  };

  return { form, handleSubmit: form.handleSubmit(onSubmit) };
}
