import { startReview } from "@/app/actions/review/review";
import { NextResponse } from "next/server";

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || "";

  try {
    const { reviewParams } = await req.json();

    const result = await startReview(reviewParams);

    if (result.success && result.prompt) {
      return new Response(
        JSON.stringify({ prompt: result.prompt, reviewId: result.reviewId }),
        {
          status: 200,
          headers: corsHeaders(origin),
        },
      );
    } else {
      return new Response(
        JSON.stringify({ error: result.error || "Failed to generate prompt" }),
        {
          status: 500,
          headers: corsHeaders(origin),
        },
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: corsHeaders(origin),
      },
    );
  }
}
