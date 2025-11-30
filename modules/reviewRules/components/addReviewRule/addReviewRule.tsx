"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddReviewRule } from "./addReviewRule.hooks";
import { Controller } from "react-hook-form";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddReviewRule() {
  const router = useRouter();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const { form, handleSubmit } = useAddReviewRule();

  return (
    <div className="w-full p-6 grid place-items-center">
      <div className="max-w-4xl w-full">
        <form onSubmit={handleSubmit} className="w-full">
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Add New Review Rule</FieldLegend>
              <FieldGroup>
                <Controller
                  name="title"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="add-review-rule-title">
                        Title
                      </FieldLabel>
                      <Input
                        {...field}
                        id="add-review-rule-title"
                        aria-invalid={fieldState.invalid}
                        placeholder="Personal React App"
                        autoComplete="off"
                      />
                      <FieldDescription>
                        Clean title to identify your required rule from the rule
                        list
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="body"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="add-review-rule-body">
                        Review Prompt
                      </FieldLabel>
                      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary">
                        <CodeMirror
                          value={field.value}
                          theme={"dark"}
                          height="30rem"
                          extensions={[
                            markdown({
                              base: markdownLanguage,
                              codeLanguages: languages,
                            }),
                          ]}
                          onChange={(val) => field.onChange(val)}
                          basicSetup={{
                            lineNumbers: true,
                            foldGutter: true,
                            highlightActiveLine: true,
                            highlightActiveLineGutter: true,
                          }}
                        />
                      </div>
                      <FieldDescription>
                        Write your review guidelines in markdown format. This
                        will be used to guide the code review process.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>
            <Field orientation="horizontal" className="justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Submit
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Any unsaved changes will be lost. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Continue Editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                form.reset();
                router.push("/review-rules");
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
