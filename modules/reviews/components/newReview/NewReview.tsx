"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { NewReviewForm } from "./NewReviewForm";

export async function NewReview({
  githubPrNumber,
  repoId,
}: {
  githubPrNumber: number;
  repoId: string;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return <div>Please log in to create a review.</div>;
  }

  const { data: reviewRules, error: fetchError } = await supabase
    .from("review_rules")
    .select("id,title")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (fetchError) {
    return <div>Error fetching review rules: something went wrong</div>;
  }

  return (
    <NewReviewForm
      githubPrNumber={githubPrNumber}
      repoId={repoId}
      reviewRules={reviewRules || []}
    />
  );
}