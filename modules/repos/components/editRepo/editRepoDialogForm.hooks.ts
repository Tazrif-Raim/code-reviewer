"use client";

import { useForm } from "react-hook-form";
import {
  addRepoDialogFormResolver,
} from "../addRepo/addRepoDialogForm.schema";
import { TAddRepoDialogFormValues } from "../addRepo/addRepoDialogForm.types";
import { updateRepo } from "@/app/actions/repos/action";
import { toast } from "sonner";

export const useEditRepoDialogForm = ({
  id,
  setIsDialogOpen,
  ownerName,
  repoName,
}: {
  id: string;
  setIsDialogOpen: (isOpen: boolean) => void;
  ownerName?: string;
  repoName?: string;
}) => {
  const form = useForm<TAddRepoDialogFormValues>({
    resolver: addRepoDialogFormResolver,
    defaultValues: {
      ownerName: ownerName || "",
      repoName: repoName || "",
      token: "",
    },
  });

  const onSubmit = async (data: TAddRepoDialogFormValues) => {
    try {
      const result = await updateRepo(id, data);

      if (result.error) {
        toast.error("Failed to update repository", {
          description: result.error,
        });
        return;
      }

      toast.success("Repository updated successfully");
      form.reset();
      setIsDialogOpen(false);
    } catch {
      toast.error("Failed to update repository", {
        description: "An error occurred. Please try again.",
      });
      form.reset();
    }
  };

  return { form, handleSubmit: form.handleSubmit(onSubmit) };
};
