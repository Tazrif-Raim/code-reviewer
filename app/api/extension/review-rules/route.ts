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
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders(origin),
    });
  }

  const { data: reviewRules, error } = await supabase
    .from("review_rules")
    .select("id,title")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }

  return new Response(JSON.stringify({ reviewRules }), {
    status: 200,
    headers: corsHeaders(origin),
  });
}
