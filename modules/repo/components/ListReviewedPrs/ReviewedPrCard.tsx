"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function ReviewedPrCard({
  pr,
  repoId,
}: {
  pr: { githubPrId: number; prNumber: number; prTitle: string };
  repoId: string;
}) {
  const router = useRouter();
  const { githubPrId, prNumber, prTitle } = pr;

  return (
    <Card
      className="cursor-pointer"
      onClick={() => router.push(`/repos/${repoId}/prs/${githubPrId}/reviews`)}
    >
      <CardContent className="w-96">
        <div>
          <div className="font-semibold">PR #{prNumber}</div>
          <div className="text-sm text-gray-400">{prTitle}</div>
        </div>
      </CardContent>
    </Card>
  );
}