'use client';

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
import { useAddRepoDialogForm } from "./addRepoDialogForm.hooks";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { useState } from "react";

export function AddRepoDialogForm() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { form, handleSubmit } = useAddRepoDialogForm({ setIsDialogOpen });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <form id="add-repo-form" onSubmit={handleSubmit}>
        <DialogTrigger asChild>
          <Button variant="outline">
            Add Repository
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add a github repository info</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Controller
                name="ownerName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-repo-form-ownerName">
                      Owner Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="add-repo-form-ownerName"
                      aria-invalid={fieldState.invalid}
                      placeholder="octocat"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="grid gap-3">
              <Controller
                name="repoName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-repo-form-repoName">
                      Repository Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="add-repo-form-repoName"
                      aria-invalid={fieldState.invalid}
                      placeholder="my-repo"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="grid gap-3">
              <Controller
                name="token"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-repo-form-token">
                      Fine Grained Token
                    </FieldLabel>
                    <Input
                      {...field}
                      id="add-repo-form-token"
                      aria-invalid={fieldState.invalid}
                      placeholder="github_pat_..."
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
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" form="add-repo-form" disabled={form.formState.isSubmitting}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
