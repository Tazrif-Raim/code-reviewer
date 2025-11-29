import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

export const addRepoDialogFormDefaultValues = {
  ownerName: "",
  repoName: "",
  token: "",
};

export const addRepoDialogFormSchema = z.object({
  ownerName: z
    .string()
    .trim()
    .min(1, "Owner name is required.")
    .max(100, "Owner name must be at most 100 characters."),
  repoName: z
    .string()
    .trim()
    .min(1, "Repository name is required.")
    .max(100, "Repository name must be at most 100 characters."),
  token: z
    .string()
    .trim()
    .min(10, "Token must be at least 10 characters.")
    .max(500, "Token must be at most 500 characters."),
});

export const addRepoDialogFormResolver = zodResolver(addRepoDialogFormSchema);
