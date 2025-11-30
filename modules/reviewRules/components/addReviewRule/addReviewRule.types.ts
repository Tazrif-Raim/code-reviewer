import z from "zod";
import { addReviewRuleSchema } from "./addReviewRule.schema";

export type TAddReviewRuleValues = z.infer<typeof addReviewRuleSchema>;
