import { NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callGeminiApi } from "@/app/actions/review/gemini";
import { EReviewStatus } from "@/shared/typedef/enums";
import { decrypt } from "@/shared/utils/crypto/crypto";
import { commentOnPr } from "@/app/actions/review/github";
import { Database } from "@/shared/typedef/supabase.types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const authHeader = req.headers.get("x-secret-key");
  if (authHeader !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId, prompt, encryptedLlmKey, shouldComment, githubToken } =
    await req.json();

  after(async () => {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    try {
      const llmKey = decrypt(encryptedLlmKey);
      const aiComments = await callGeminiApi(llmKey, prompt);

      const parsedComments = JSON.parse(JSON.stringify(aiComments));

      await supabase
        .from("reviews")
        .update({
          status: EReviewStatus.COMPLETED,
          comments: parsedComments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (shouldComment) {
        await commentOnPr(reviewId, parsedComments, supabase, githubToken);
      }
    } catch (error) {
      console.error(`Review ${reviewId} failed:`, error);

      await supabase
        .from("reviews")
        .update({
          status: EReviewStatus.FAILED,
          comments: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId);
    }
  });

  return NextResponse.json(
    { message: "Review processing queued" },
    { status: 200 }
  );
}
