import { deleteRepo } from "@/app/actions/repos/action";
import { toast } from "sonner";
import { useState } from "react";

export function useRepoActions({
  setIsDeleteDialogOpen,
  id,
}: {
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  id: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteRepoAction() {
    setIsDeleting(true);
    try {
      const result = await deleteRepo(id);
      if (result.error) {
        toast.error("Failed to delete repo", {
          description: "Something went wrong. Please try again.",
        });
        return;
      }

      toast.success("Repo deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete repo", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return { deleteRepoAction, isDeleting };
}
