"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { useNewReview } from "./newReview.hooks";
import { Controller } from "react-hook-form";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MODELS } from "./newReview.schema";

export function NewReviewForm({
  githubPrNumber,
  repoId,
  reviewRules,
}: {
  githubPrNumber: number;
  repoId: string;
  reviewRules: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const { form, handleSubmit } = useNewReview({ repoId, githubPrNumber });

  return (
    <div className="w-full p-6 grid place-items-center">
      <div className="max-w-4xl w-full">
        <form onSubmit={handleSubmit} className="w-full">
          <FieldGroup>
            <FieldSet>
              <FieldLegend>New Review</FieldLegend>
              <FieldGroup>
                <Controller
                  name="reviewRuleIds"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Select Review Rules (Optional)</FieldLabel>
                      <div className="space-y-2">
                        {reviewRules.length === 0 ? (
                          <div className="text-sm text-gray-400">
                            No review rules available. Create one first.
                          </div>
                        ) : (
                          reviewRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="flex items-center gap-4"
                            >
                              <Checkbox
                                id={rule.id}
                                checked={field.value.includes(rule.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, rule.id]);
                                  } else {
                                    field.onChange(
                                      field.value.filter((id) => id !== rule.id)
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor={rule.id}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {rule.title}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                      <FieldDescription>
                        Select zero or more review rules to apply for this PR
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="model"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      orientation="responsive"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-select-model">
                          Model
                        </FieldLabel>
                        <FieldDescription>
                          Select the AI model to use for the review
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldContent>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="form-rhf-select-model"
                          aria-invalid={fieldState.invalid}
                          className="min-w-[120px]"
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  name="shouldComment"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      orientation="horizontal"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldContent>
                        <FieldLabel htmlFor="switch-shouldComment">
                          Auto comment on PR
                        </FieldLabel>
                        <FieldDescription>
                          The system will post your review directly to the PR
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldContent>
                      <Switch
                        id="switch-shouldComment"
                        name={field.name}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                      />
                    </Field>
                  )}
                />
                <Controller
                  name="customPrompt"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new-review-custom-prompt">
                        Custom Prompt (Optional)
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
                        Write custom review guidelines specific to this PR in
                        markdown format
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
                Start Review
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  router.push(`/repos/${repoId}/prs/${githubPrNumber}/reviews`)
                }
              >
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
