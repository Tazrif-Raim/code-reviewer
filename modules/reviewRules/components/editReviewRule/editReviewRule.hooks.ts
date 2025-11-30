"use client";

import { useForm } from "react-hook-form";
import { TAddReviewRuleValues } from "../addReviewRule/addReviewRule.types";
import { addReviewRuleResolver } from "../addReviewRule/addReviewRule.schema";
import { updateReviewRule } from "@/app/actions/reviewRules/action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const useEditReviewRule = ({
  id,
  title,
  body,
}: {
  id: string;
  title?: string;
  body?: string;
}) => {
  const router = useRouter();
  const form = useForm<TAddReviewRuleValues>({
    resolver: addReviewRuleResolver,
    defaultValues: {
      title: title || "",
      body: body || "",
    },
  });

  const onSubmit = async (data: TAddReviewRuleValues) => {
    try {
      const result = await updateReviewRule(id, data);

      if (result.error) {
        toast.error("Failed to update review rule", {
          description: result.error,
        });
        return;
      }

      toast.success("Review rule updated successfully");
      router.push("/review-rules");
    } catch {
      toast.error("Failed to update review rule", {
        description: "An error occurred. Please try again.",
      });
    }
  };

  return { form, handleSubmit: form.handleSubmit(onSubmit) };
};
