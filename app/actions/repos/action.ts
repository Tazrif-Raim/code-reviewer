"use server";

import { addRepoDialogFormSchema } from "@/modules/repos/components/addRepo/addRepoDialogForm.schema";
import { TAddRepoDialogFormValues } from "@/modules/repos/components/addRepo/addRepoDialogForm.types";
import { Database } from "@/shared/typedef/supabase.types";
import { encrypt } from "@/shared/utils/crypto/crypto";
import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addRepo(data: TAddRepoDialogFormValues) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const parsed = addRepoDialogFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid input data" };
  }

  const encryptedToken = encrypt(parsed.data.token);

  const repoData: Database["public"]["Tables"]["repos"]["Insert"] = {
    user_id: user.id,
    repo_name: parsed.data.repoName,
    owner_name: parsed.data.ownerName,
    fine_grained_token: encryptedToken,
  };

  const { error: insertError } = await supabase.from("repos").insert(repoData);

  if (insertError) {
    return { error: "Failed to add repo" };
  }

  revalidatePath("/repos");
  return { success: "Repo added successfully" };
}

export async function deleteRepo(repoId: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const { error: deleteError } = await supabase
    .from("repos")
    .delete()
    .eq("id", repoId)
    .eq("user_id", user.id);

  if (deleteError) {
    return { error: "Failed to delete repo" };
  }

  revalidatePath("/repos");
  return { success: "Repo deleted successfully" };
}

export async function updateRepo(id: string, data: TAddRepoDialogFormValues) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const parsed = addRepoDialogFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid input data" };
  }

  const encryptedToken = encrypt(parsed.data.token);

  const repoData: Database["public"]["Tables"]["repos"]["Update"] = {
    repo_name: parsed.data.repoName,
    owner_name: parsed.data.ownerName,
    fine_grained_token: encryptedToken,
  };

  const { error: updateError } = await supabase
    .from("repos")
    .update(repoData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: "Failed to update repo" };
  }

  revalidatePath("/repos");
  return { success: "Repo updated successfully" };
}
