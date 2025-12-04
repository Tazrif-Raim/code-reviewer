"use server";

import { Octokit } from "octokit";
import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { decrypt } from "@/shared/utils/crypto/crypto";
import { getLatestCommit, getPrDetails } from "./github";
import { generatePrDiff } from "./diff";
import { buildReviewPrompt, ReviewRule } from "./prompt";
import { callGeminiApi } from "./gemini";
import { EReviewStatus } from "@/shared/typedef/enums";
import { waitUntil } from "@vercel/functions";

export interface StartReviewInput {
  repoId: string;
  githubPrNumber: number;
  reviewRuleIds: string[];
  customPrompt?: string;
}

export interface StartReviewResult {
  success: boolean;
  reviewId?: string;
  error?: string;
}

export async function startReview(
  input: StartReviewInput
): Promise<StartReviewResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: repo, error: repoError } = await supabase
    .from("repos")
    .select("id, repo_name, owner_name, fine_grained_token")
    .eq("id", input.repoId)
    .eq("user_id", user.id)
    .single();

  if (repoError || !repo) {
    return { success: false, error: "Repository not found" };
  }

  const token = decrypt(repo.fine_grained_token);
  const octokit = new Octokit({ auth: token });

  try {
    const prDetails = await getPrDetails(
      octokit,
      repo.owner_name,
      repo.repo_name,
      input.githubPrNumber
    );

    const latestCommit = await getLatestCommit(
      octokit,
      repo.owner_name,
      repo.repo_name,
      prDetails.headSha
    );

    let { data: reviewedPr } = await supabase
      .from("reviewed_prs")
      .select("id")
      .eq("pr_number", input.githubPrNumber)
      .eq("repo_id", input.repoId)
      .eq("user_id", user.id)
      .single();

    if (!reviewedPr) {
      const { data: newReviewedPr, error: insertError } = await supabase
        .from("reviewed_prs")
        .insert({
          github_pr_node_id: prDetails.githubPrNodeId,
          repo_id: input.repoId,
          user_id: user.id,
          pr_number: input.githubPrNumber,
          pr_title: prDetails.title,
        })
        .select("id")
        .single();

      if (insertError || !newReviewedPr) {
        return { success: false, error: "Failed to create reviewed PR record" };
      }

      reviewedPr = newReviewedPr;
    }

    const { data: review, error: reviewInsertError } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        reviewed_pr_id: reviewedPr.id,
        commit_hash: latestCommit.sha,
        commit_message: latestCommit.message,
        status: EReviewStatus.PENDING,
        should_comment: false,
        comments: null,
      })
      .select("id")
      .single();

    if (reviewInsertError || !review) {
      return { success: false, error: "Failed to create review record" };
    }

    waitUntil(
      processReview({
        reviewId: review.id,
        userId: user.id,
        repoId: input.repoId,
        prNumber: input.githubPrNumber,
        owner: repo.owner_name,
        repoName: repo.repo_name,
        token,
        reviewRuleIds: input.reviewRuleIds,
        customPrompt: input.customPrompt,
      }).catch((error) => {
        console.error("Background review processing failed:", error);
      })
    );

    return { success: true, reviewId: review.id };
  } catch (error) {
    console.error("Start review error:", error);
    return { success: false, error: String(error) };
  }
}

interface ProcessReviewInput {
  reviewId: string;
  userId: string;
  repoId: string;
  prNumber: number;
  owner: string;
  repoName: string;
  token: string;
  reviewRuleIds: string[];
  customPrompt?: string;
}

async function processReview(input: ProcessReviewInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const octokit = new Octokit({ auth: input.token });

  try {
    const { fullDiffContent } = await generatePrDiff(
      octokit,
      input.owner,
      input.repoName,
      input.prNumber
    );

    let reviewRules: ReviewRule[] = [];
    if (input.reviewRuleIds.length > 0) {
      const { data: rules } = await supabase
        .from("review_rules")
        .select("id, title, body")
        .in("id", input.reviewRuleIds)
        .eq("user_id", input.userId);

      if (rules) {
        reviewRules = rules;
      }
    }

    const prompt = await buildReviewPrompt(
      fullDiffContent,
      reviewRules,
      input.customPrompt
    );

    const { data: userSecret, error: secretError } = await supabase
      .from("user_secrets")
      .select("llm_api_key, llm_provider")
      .eq("user_id", input.userId)
      .single();

    if (secretError || !userSecret) {
      throw new Error(
        "Gemini API key not found. Please add your API key in settings."
      );
    }

    const apiKey = decrypt(userSecret.llm_api_key);

    const reviewPayload = await callGeminiApi(apiKey, prompt);

    await supabase
      .from("reviews")
      .update({
        status: EReviewStatus.COMPLETED,
        comments: JSON.parse(JSON.stringify(reviewPayload)),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.reviewId);
  } catch (error) {
    console.error("Process review error:", error);

    await supabase
      .from("reviews")
      .update({
        status: EReviewStatus.FAILED,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.reviewId);
  }
}
