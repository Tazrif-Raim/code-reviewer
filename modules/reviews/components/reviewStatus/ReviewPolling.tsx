"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/utils/supabase/client";
import { EReviewStatus } from "@/shared/typedef/enums";

interface ReviewPollingProps {
  reviewId: string;
}

export function ReviewPolling({ reviewId }: ReviewPollingProps) {
  const router = useRouter();
  const [dots, setDots] = useState("");
  // ============ TODO: REMOVE - TEMPORARY TIMER ============
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // =========================================================

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const pollStatus = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("status")
        .eq("id", reviewId)
        .single();

      if (data?.status === EReviewStatus.COMPLETED || data?.status === EReviewStatus.FAILED) {
        router.refresh();
      }
    };

    const interval = setInterval(pollStatus, 5000);

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    // ============ TODO: REMOVE - TEMPORARY TIMER ============
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    // =========================================================

    return () => {
      clearInterval(interval);
      clearInterval(dotsInterval);
      // ============ TODO: REMOVE - TEMPORARY TIMER ============
      clearInterval(timerInterval);
      // =========================================================
    };
  }, [reviewId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Reviewing PR{dots}</h2>
        <p className="text-muted-foreground">
          AI is analyzing your code changes. This may take a minute.
        </p>
        {/* ============ TODO: REMOVE - TEMPORARY TIMER ============ */}
        <p className="text-sm text-muted-foreground font-mono">
          {elapsedSeconds}s elapsed
        </p>
        {/* =========================================================== */}
      </div>
    </div>
  );
}
