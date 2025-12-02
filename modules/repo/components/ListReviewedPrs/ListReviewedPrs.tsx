"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { ReviewedPrCard } from "./ReviewedPrCard";

export async function ListReviewedPrs({ id }: { id: string }) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return <div>Please log in to view reviewed pull requests.</div>;
  }

  const { data: reviewedPrs, error: fetchError } = await supabase
    .from("reviewed_prs")
    .select("id,pr_number,pr_title")
    .eq("repo_id", id)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (fetchError) {
    return <div>Error fetching reviewed pull requests: something went wrong</div>;
  }

  if (!reviewedPrs || reviewedPrs.length === 0) {
    return (
      <div className="text-white">
        No reviewed pull requests found for this repository.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {reviewedPrs.map((pr) => (
          <ReviewedPrCard
            key={pr.id}
            pr={{
              prNumber: pr.pr_number,
              prTitle: pr.pr_title || "Untitled PR",
            }}
            repoId={id}
          />
        ))}
      </div>
    </>
  );
}
