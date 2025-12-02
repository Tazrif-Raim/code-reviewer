"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function ReviewCard({
  review,
  repoId,
  githubPrNumber,
}: {
  review: {
    id: string;
    commitMessage: string;
    updatedAt: string;
    status: string;
  };
  repoId: string;
  githubPrNumber: number;
}) {
  const router = useRouter();
  const { id, commitMessage, updatedAt, status } = review;

  const formattedDate = new Date(updatedAt).toLocaleString();

  return (
    <Card
      className="cursor-pointer"
      onClick={() =>
        router.push(`/repos/${repoId}/prs/${githubPrNumber}/reviews/${id}`)
      }
    >
      <CardContent className="w-96">
        <div>
          <div className="font-semibold truncate">{commitMessage}</div>
          <div className="text-sm text-gray-400">
            Updated: {formattedDate}
          </div>
          <div className="text-sm text-gray-400">
            Status: {status}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
