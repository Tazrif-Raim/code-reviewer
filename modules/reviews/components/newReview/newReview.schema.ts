import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

export const MODELS = [
  { label: "gemini-2.5-flash", value: "gemini-2.5-flash" },
  { label: "gemini-2.5-pro", value: "gemini-2.5-pro" },
] as const;

export const newReviewDefaultValues = {
  reviewRuleIds: [],
  customPrompt: "",
  shouldComment: false,
  model: "",
};

export const newReviewSchema = z.object({
  reviewRuleIds: z.array(z.string()),
  shouldComment: z.boolean(),
  customPrompt: z
    .string()
    .max(5000, "Custom prompt must be at most 5000 characters")
    .optional(),
  model: z.string().min(1, "Please select an AI model"),
});

export const newReviewResolver = zodResolver(newReviewSchema);
