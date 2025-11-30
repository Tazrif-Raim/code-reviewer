import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

export const addReviewRuleDefaultValues = {
  title: "",
  body: "",
};

export const addReviewRuleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters"),
  body: z
    .string()
    .min(1, "Body is required")
    .max(5000, "Body must be at most 5000 characters"),
});

export const addReviewRuleResolver = zodResolver(addReviewRuleSchema);
