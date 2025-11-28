'use client';

import { useForm } from "react-hook-form";
import {
  llmApiKeyFormDeafaultValues,
  llmApiKeyFormResolver,
} from "./llmApiKeyForm.schema";
import { TLlmApiKeyFormValues } from "./llmApiKeyForm.types";

export const useLlmApiKeyForm = () => {
  const form = useForm<TLlmApiKeyFormValues>({
    resolver: llmApiKeyFormResolver,
    defaultValues: llmApiKeyFormDeafaultValues,
  });

  const onSubmit = (data: TLlmApiKeyFormValues) => {
    console.log("Llm API Key Form Submitted:", data);
  };

  return { form, handleSubmit: form.handleSubmit(onSubmit) };
};
