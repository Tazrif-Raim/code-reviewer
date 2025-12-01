import { Button } from "@/components/ui/button";
import { ListReviews } from "../components/listReviews/ListReviews";
import Link from "next/link";

export function ReviewsContainer({
  repoId,
  githubPrId,
}: {
  repoId: string;
  githubPrId: number;
}) {
  return (
    <>
      <Button asChild>
        <Link href={`/repos/${repoId}/prs/${githubPrId}/reviews/new`}>
          New Review
        </Link>
      </Button>
      <div className="my-10 grid place-items-center">
        <ListReviews repoId={repoId} githubPrId={githubPrId} />
      </div>
    </>
  );
}
