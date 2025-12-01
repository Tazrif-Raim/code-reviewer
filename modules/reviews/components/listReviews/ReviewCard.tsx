"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function ReviewCard({
  review,
  repoId,
  githubPrId,
}: {
  review: {
    id: string;
    commitMessage: string;
    updatedAt: string;
    commentsCount: number;
  };
  repoId: string;
  githubPrId: number;
}) {
  const router = useRouter();
  const { id, commitMessage, updatedAt, commentsCount } = review;

  const formattedDate = new Date(updatedAt).toLocaleString();

  return (
    <Card
      className="cursor-pointer"
      onClick={() =>
        router.push(`/repos/${repoId}/prs/${githubPrId}/reviews/${id}`)
      }
    >
      <CardContent className="w-96">
        <div>
          <div className="font-semibold truncate">{commitMessage}</div>
          <div className="text-sm text-gray-400">
            Updated: {formattedDate}
          </div>
          <div className="text-sm text-gray-400">
            Comments: {commentsCount}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
