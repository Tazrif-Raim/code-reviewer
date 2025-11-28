import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

export const llmApiKeyFormDeafaultValues = {
  apiKey: "",
};

export const llmApiKeyFormSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(5, "API key must be at least 5 characters.")
    .max(255, "API key must be at most 255 characters."),
});

export const llmApiKeyFormResolver = zodResolver(llmApiKeyFormSchema);
