import { NextRequest, NextResponse } from "next/server";

/**
 * When INTERNAL_API_SECRET is set, adapter calls must send Authorization: Bearer <secret>.
 */
export function requireInternalApiAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return null;
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
