"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReviewRuleActions } from "./ReviewRuleActions";
import { useRouter } from "next/navigation";

export function ReviewRuleCard({
  reviewRule,
}: {
  reviewRule: { id: string; title: string };
}) {
  const router = useRouter();
  const { id, title } = reviewRule;

  return (
    <Card
      className="cursor-pointer"
      onClick={() => router.push(`/review-rules/${id}`)}
    >
      <CardContent className="w-96 flex flex-row justify-between items-center">
        <div className="flex-1 overflow-hidden">
          <div className="truncate">{title}</div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ReviewRuleActions reviewRuleId={id} />
        </div>
      </CardContent>
    </Card>
  );
}
