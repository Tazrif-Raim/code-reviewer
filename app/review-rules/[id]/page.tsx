import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { EditReviewRule } from "@/modules/reviewRules/components/editReviewRule/EditReviewRule";
import { notFound } from "next/navigation";

export default async function ReviewRulePage(
  props: PageProps<"/review-rules/[id]">
) {
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return <div>Please log in to edit review rules.</div>;
  }

  const { data: reviewRule, error: fetchError } = await supabase
    .from("review_rules")
    .select("id,title,body")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !reviewRule) {
    notFound();
  }

  return (
    <EditReviewRule
      id={reviewRule.id}
      title={reviewRule.title}
      body={reviewRule.body}
    />
  );
}
