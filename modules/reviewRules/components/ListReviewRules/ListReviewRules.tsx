"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { ReviewRuleCard } from "./ReviewRuleCard";

export async function ListReviewRules() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return <div>Please log in to view your review rules.</div>;
  }

  const { data: reviewRules, error: fetchError } = await supabase
    .from("review_rules")
    .select("id,title,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return <div>Error fetching review rules: something went wrong</div>;
  }

  if (!reviewRules || reviewRules.length === 0) {
    return (
      <div className="text-white">
        No review rules found. Please add a review rule.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {reviewRules.map((rule) => (
          <ReviewRuleCard
            key={rule.id}
            reviewRule={{
              id: rule.id,
              title: rule.title,
            }}
          />
        ))}
      </div>
    </>
  );
}
