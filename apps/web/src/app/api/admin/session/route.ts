import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionToken,
  getAdminApiSecret,
  timingSafeStringEq,
} from "@/lib/admin-auth";

const postSchema = z.object({ secret: z.string().min(1) });

export async function POST(request: NextRequest) {
  const envSecret = getAdminApiSecret();
  if (!envSecret) {
    return NextResponse.json(
      { error: "Admin is not configured (set ADMIN_API_SECRET)" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  if (!timingSafeStringEq(parsed.data.secret.trim(), envSecret)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const token = adminSessionToken(envSecret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
