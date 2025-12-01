import z from "zod";
import { newReviewSchema } from "./newReview.schema";

export type TNewReviewValues = z.infer<typeof newReviewSchema>;
