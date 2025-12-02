"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { decrypt } from "@/shared/utils/crypto/crypto";
import { GithubPrCard } from "./GithubPrCard";
import { Octokit } from "octokit";

export async function ListGithubPrs({ repoId }: { repoId: string }) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return <div>Please log in to view pull requests.</div>;
  }

  const { data: repo, error: fetchError } = await supabase
    .from("repos")
    .select("id,repo_name,owner_name,fine_grained_token")
    .eq("id", repoId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !repo) {
    return <div>Repository not found.</div>;
  }

  const token = decrypt(repo.fine_grained_token);

  try {
    const octokit = new Octokit({
      auth: token,
    });

    const { data: prs } = await octokit.rest.pulls.list({
      owner: repo.owner_name,
      repo: repo.repo_name,
      state: "closed",
    });

    if (!prs || prs.length === 0) {
      return (
        <div className="text-white">
          No open pull requests found for this repository.
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-col gap-4">
          {prs.map((pr) => (
            <GithubPrCard
              key={pr.node_id}
              pr={{
                number: pr.number,
                title: pr.title,
              }}
              repoId={repoId}
            />
          ))}
        </div>
      </>
    );
  } catch (error) {
    return <div>Error fetching pull requests: {String(error)}</div>;
  }
}
