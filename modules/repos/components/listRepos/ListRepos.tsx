"use server";

import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { RepoCard } from "./RepoCard";

export async function ListRepos() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return <div>Please log in to view your repositories.</div>;
  }

  const { data: repos, error: fetchError } = await supabase
    .from("repos")
    .select("id,repo_name,owner_name,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return <div>Error fetching repositories: something went wrong</div>;
  }

  if (!repos || repos.length === 0) {
    return (
      <div className="text-white">
        No repositories found. Please add a repository.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {repos.map((repo) => (
          <RepoCard
            key={repo.id}
            repo={{
              id: repo.id,
              ownerName: repo.owner_name,
              repoName: repo.repo_name,
            }}
          />
        ))}
      </div>
    </>
  );
}
