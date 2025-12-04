"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { useEditRepoDialogForm } from "./editRepoDialogForm.hooks";

export function EditRepoDialogForm({
  id,
  isEditDialogOpen,
  setIsEditDialogOpen,
  ownerName,
  repoName,
}: {
  id: string;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  ownerName?: string;
  repoName?: string;
}) {
  const { form, handleSubmit } = useEditRepoDialogForm({
    id,
    setIsDialogOpen: setIsEditDialogOpen,
    ownerName,
    repoName,
  });

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <form id="edit-repo-form" onSubmit={handleSubmit} className="hidden">
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit github repository info</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Controller
                name="ownerName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-repo-form-ownerName">
                      Owner Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-repo-form-ownerName"
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
                    <FieldLabel htmlFor="edit-repo-form-repoName">
                      Repository Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-repo-form-repoName"
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
                    <FieldLabel htmlFor="edit-repo-form-token">
                      Fine Grained Token
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-repo-form-token"
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
              form="edit-repo-form"
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
