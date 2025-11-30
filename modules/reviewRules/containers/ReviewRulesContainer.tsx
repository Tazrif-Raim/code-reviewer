import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ListReviewRules } from "../components/ListReviewRules/ListReviewRules";

export function ReviewRulesContainer() {
  return (
    <>
      <h1>Review Rules Page</h1>
      <Button asChild>
        <Link href="/review-rules/new">Add Review Rule</Link>
      </Button>
      <div className="my-10 grid place-items-center">
        <ListReviewRules />
      </div>
    </>
  );
}
