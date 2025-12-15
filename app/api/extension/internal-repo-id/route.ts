import { createSupabaseServerClient } from "@/shared/utils/supabase/server";
import { NextResponse } from "next/server";

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Content-Type": "application/json",
});

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "";
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin") || "";
  const { searchParams } = new URL(req.url);
  const ownerName = searchParams.get("ownerName");
  const repoName = searchParams.get("repoName");

  if (!ownerName || !repoName) {
    return new Response(
      JSON.stringify({ error: "Missing ownerName or repoName" }),
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: corsHeaders(origin) },
    );
  }

  const { data: repo, error: repoError } = await supabase
    .from("repos")
    .select("id")
    .eq("owner_name", ownerName)
    .eq("repo_name", repoName)
    .eq("user_id", user.id)
    .single();

  if (repoError || !repo) {
    return new Response(
      JSON.stringify({ error: "Repository not found" }),
      { status: 404, headers: corsHeaders(origin) },
    );
  }

  return new Response(
    JSON.stringify({ repoId: repo.id }),
    {
      status: 200,
      headers: corsHeaders(origin),
    },
  );
}
