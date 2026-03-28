import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Next.js forbids sibling dynamic segments with different param names (`[topicSlug]` vs `[domainSlug]`).
 * Canonical two-part public URL `/explanations/:topicSlug` is rewritten internally to `/explanations/legacy/:topicSlug`.
 */
export function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  if (segments[0] !== "explanations") return NextResponse.next();
  if (segments.length !== 2) return NextResponse.next();
  const [, single] = segments;
  if (single === "legacy") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/explanations/legacy/${encodeURIComponent(single)}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/explanations/:path*"],
};
