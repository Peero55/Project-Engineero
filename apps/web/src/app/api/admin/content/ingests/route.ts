import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 50));

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_ingests")
    .select("id, certification_id, title, source_kind, original_filename, parser_version, plain_text_fallback, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("content ingests list:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ingests: data ?? [] });
}
