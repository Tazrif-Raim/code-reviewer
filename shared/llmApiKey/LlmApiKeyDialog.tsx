"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLlmApiKeyForm } from "./llmApiKeyForm.hooks";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { useState } from "react";
import { KeyRoundIcon } from "lucide-react";

export function LlmApiKeyDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { form, handleSubmit } = useLlmApiKeyForm({ setIsDialogOpen });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <form id="llm-api-key-form" onSubmit={handleSubmit}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <KeyRoundIcon className="not-dark:text-black" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter your Gemini API Key</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Controller
                name="apiKey"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="llm-api-key-form-apiKey">
                      API Key
                    </FieldLabel>
                    <Input
                      {...field}
                      id="llm-api-key-form-apiKey"
                      aria-invalid={fieldState.invalid}
                      placeholder="Ajxwqds..."
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="llm-api-key-form"
              disabled={form.formState.isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
