import z from "zod";
import { llmApiKeyFormSchema } from "./llmApiKeyForm.schema";

export type TLlmApiKeyFormValues = z.infer<typeof llmApiKeyFormSchema>;
