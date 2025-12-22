import { Button } from "@/components/ui/button";
import { ListReviews } from "../components/listReviews/ListReviews";
import Link from "next/link";

export function ReviewsContainer({
  repoId,
  githubPrNumber,
}: {
  repoId: string;
  githubPrNumber: number;
}) {
  return (
    <>
      <Button variant="outline" asChild>
        <Link href={`/repos/${repoId}/prs/${githubPrNumber}/reviews/new`}>
          New Review
        </Link>
      </Button>
      <div className="my-10 grid place-items-center">
        <ListReviews repoId={repoId} githubPrNumber={githubPrNumber} />
      </div>
    </>
  );
}
