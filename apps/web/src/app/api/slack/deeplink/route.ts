import { NextRequest, NextResponse } from "next/server";

const WEB_APP_URL = process.env.WEB_APP_URL ?? process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";

/**
 * Generate a deep link from Slack to the web app.
 * Query params: user_id, redirect (optional path)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const redirect = searchParams.get("redirect") ?? "/";

  if (!userId) {
    return NextResponse.json(
      { error: "Missing user_id" },
      { status: 400 }
    );
  }

  const url = new URL(redirect, WEB_APP_URL);
  url.searchParams.set("slack_user_id", userId);

  return NextResponse.json({
    url: url.toString(),
    redirect: redirect,
  });
}
