import z from "zod";
import { addRepoDialogFormSchema } from "./addRepoDialogForm.schema";

export type TAddRepoDialogFormValues = z.infer<typeof addRepoDialogFormSchema>;
