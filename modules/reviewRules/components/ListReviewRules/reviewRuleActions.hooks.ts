import { deleteReviewRule } from "@/app/actions/reviewRules/action";
import { toast } from "sonner";
import { useState } from "react";

export function useReviewRuleActions({
  setIsDeleteDialogOpen,
  id,
}: {
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  id: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteReviewRuleAction() {
    setIsDeleting(true);
    try {
      const result = await deleteReviewRule(id);
      if (result.error) {
        toast.error("Failed to delete review rule", {
          description: "Something went wrong. Please try again.",
        });
        return;
      }

      toast.success("Review rule deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete review rule", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return { deleteReviewRuleAction, isDeleting };
}
