"use client";

import { useForm } from "react-hook-form";
import {
  addRepoDialogFormDefaultValues,
  addRepoDialogFormResolver,
} from "./addRepoDialogForm.schema";
import { TAddRepoDialogFormValues } from "./addRepoDialogForm.types";
import { Dispatch, SetStateAction } from "react";
import { addRepo } from "@/app/actions/repos/action";
import { toast } from "sonner";

export const useAddRepoDialogForm = ({
  setIsDialogOpen,
}: {
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const form = useForm<TAddRepoDialogFormValues>({
    resolver: addRepoDialogFormResolver,
    defaultValues: addRepoDialogFormDefaultValues,
  });

  const onSubmit = async (data: TAddRepoDialogFormValues) => {
    try {
      const result = await addRepo(data);

      if (result.error) {
        toast.error("Failed to add repository", {
          description: result.error,
        });
        return;
      }

      toast.success("Repository added successfully");
      form.reset();
      setIsDialogOpen(false);
    } catch {
      toast.error("Failed to add repository", {
        description: "An error occurred. Please try again.",
      });
      form.reset();
    }
  };

  return { form, handleSubmit: form.handleSubmit(onSubmit) };
};
