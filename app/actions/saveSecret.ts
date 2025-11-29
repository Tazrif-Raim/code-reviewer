"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { encrypt } from "@/shared/utils/crypto/crypto";
import { llmApiKeyFormSchema } from "@/shared/llmApiKey/llmApiKeyForm.schema";
import { LLM_PROVIDERS } from "@/shared/typedef/constants";
import { Database } from "@/shared/typedef/supabase.types";

export async function saveUserSecret(llmApiKey: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const validated = llmApiKeyFormSchema.safeParse({ apiKey: llmApiKey });
  if (!validated.success) {
    return { error: "Invalid input data" };
  }

  const encryptedKey = encrypt(validated.data.apiKey);

  const secretData: Database["public"]["Tables"]["user_secrets"]["Insert"] = {
    user_id: user.id,
    llm_provider: LLM_PROVIDERS[0],
    llm_api_key: encryptedKey,
  };

  const { error: upsertError } = await supabase
    .from("user_secrets")
    .upsert(secretData, { onConflict: "user_id,llm_provider" });

  if (upsertError) {
    return { error: "Failed to save key" };
  }

  return { success: "Key saved successfully" };
}
