"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { Database } from "@/shared/typedef/supabase.types";
import { addReviewRuleSchema } from "@/modules/reviewRules/components/addReviewRule/addReviewRule.schema";
import { TAddReviewRuleValues } from "@/modules/reviewRules/components/addReviewRule/addReviewRule.types";

export async function addReviewRule(data: TAddReviewRuleValues) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const parsed = addReviewRuleSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid input data" };
  }

  const reviewRule: Database["public"]["Tables"]["review_rules"]["Insert"] = {
    user_id: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
  };

  const { error: insertError } = await supabase
    .from("review_rules")
    .insert(reviewRule);

  if (insertError) {
    return { error: "Failed to add review rule" };
  }

  revalidatePath("/review-rules");
  return { success: "Review rule added successfully" };
}

export async function updateReviewRule(
  id: string,
  data: TAddReviewRuleValues
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const parsed = addReviewRuleSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid input data" };
  }

  const reviewRule: Database["public"]["Tables"]["review_rules"]["Update"] = {
    title: parsed.data.title,
    body: parsed.data.body,
  };

  const { error: updateError } = await supabase
    .from("review_rules")
    .update(reviewRule)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: "Failed to update review rule" };
  }

  revalidatePath("/review-rules");
  return { success: "Review rule updated successfully" };
}

export async function deleteReviewRule(id: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const { error: deleteError } = await supabase
    .from("review_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return { error: "Failed to delete review rule" };
  }

  revalidatePath("/review-rules");
  return { success: "Review rule deleted successfully" };
}
