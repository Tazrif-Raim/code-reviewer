"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function GithubPrCard({
  pr,
  repoId,
}: {
  pr: { id: number; number: number; title: string };
  repoId: string;
}) {
  const router = useRouter();
  const { id, number, title } = pr;

  return (
    <Card
      className="cursor-pointer"
      onClick={() => router.push(`/repos/${repoId}/prs/${id}/reviews`)}
    >
      <CardContent className="w-96">
        <div>
          <div className="font-semibold">PR #{number}</div>
          <div className="text-sm text-gray-400">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
}
