import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "lh_admin_session";

const SESSION_MARKER = "lh-admin-session-v1";

export function adminSessionToken(secret: string): string {
  return createHmac("sha256", secret).update(SESSION_MARKER).digest("hex");
}

export function timingSafeStringEq(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function getAdminApiSecret(): string | undefined {
  return process.env.ADMIN_API_SECRET?.trim() || undefined;
}

/** Valid Bearer secret or signed session cookie (set by POST /api/admin/session). */
export function adminRequestAuthorized(request: NextRequest): boolean {
  const secret = getAdminApiSecret();
  if (!secret) return false;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  if (bearer && timingSafeStringEq(bearer, secret)) return true;

  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (cookie && timingSafeStringEq(cookie, adminSessionToken(secret))) return true;

  return false;
}

/** Use in API routes: returns null if authorized, or a NextResponse error. */
export function unauthorizedAdminResponse(): NextResponse {
  const secret = getAdminApiSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Admin is not configured (set ADMIN_API_SECRET)" },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function requireAdmin(request: NextRequest): NextResponse | null {
  if (!getAdminApiSecret()) {
    return unauthorizedAdminResponse();
  }
  if (!adminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }
  return null;
}

export function verifyAdminCookieValue(value: string | undefined): boolean {
  const secret = getAdminApiSecret();
  if (!secret || !value) return false;
  return timingSafeStringEq(value, adminSessionToken(secret));
}
