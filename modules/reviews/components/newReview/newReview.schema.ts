import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

export const newReviewDefaultValues = {
  reviewRuleIds: [],
  customPrompt: "",
  shouldComment: false,
};

export const newReviewSchema = z.object({
  reviewRuleIds: z.array(z.string()),
  shouldComment: z.boolean(),
  customPrompt: z
    .string()
    .max(5000, "Custom prompt must be at most 5000 characters")
    .optional(),
});

export const newReviewResolver = zodResolver(newReviewSchema);
