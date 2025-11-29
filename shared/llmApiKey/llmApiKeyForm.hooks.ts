"use client";

import { useForm } from "react-hook-form";
import {
  llmApiKeyFormDeafaultValues,
  llmApiKeyFormResolver,
} from "./llmApiKeyForm.schema";
import { TLlmApiKeyFormValues } from "./llmApiKeyForm.types";
import { toast } from "sonner";
import { Dispatch, SetStateAction } from "react";
import { saveUserSecret } from "@/app/actions/saveSecret";

export const useLlmApiKeyForm = ({
  setIsDialogOpen,
}: {
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const form = useForm<TLlmApiKeyFormValues>({
    resolver: llmApiKeyFormResolver,
    defaultValues: llmApiKeyFormDeafaultValues,
  });

  const onSubmit = async (data: TLlmApiKeyFormValues) => {
    try {
      const result = await saveUserSecret(data.apiKey);

      if (result.error) {
        toast.error("Failed to save API key", {
          description: result.error,
        });
        return;
      }

      toast.success("API key saved successfully");
      form.reset();
      setIsDialogOpen(false);
    } catch {
      toast.error("Failed to save API key", {
        description:
          "An error occurred while saving your API key. Please try again.",
      });
      form.reset();
    }
  };

  return { form, handleSubmit: form.handleSubmit(onSubmit) };
};
