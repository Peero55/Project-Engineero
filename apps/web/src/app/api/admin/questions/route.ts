import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const { searchParams } = request.nextUrl;
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get("limit")) || 50)
  );
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
  const activeOnly = searchParams.get("active_only");
  const q = searchParams.get("q")?.trim();

  const supabase = createAdminClient();

  let query = supabase
    .from("questions")
    .select(
      "id, prompt, difficulty_tier, is_active, question_type, source_type, topic_id, certification_id, created_at, topics(name, slug)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (activeOnly === "true") {
    query = query.eq("is_active", true);
  } else if (activeOnly === "false") {
    query = query.eq("is_active", false);
  }

  if (q) {
    query = query.ilike("prompt", `%${q}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("admin questions list:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((row: Record<string, unknown>) => {
    const topics = row.topics as { name?: string; slug?: string } | null;
    return {
      id: row.id,
      prompt: row.prompt,
      difficulty_tier: row.difficulty_tier,
      is_active: row.is_active,
      question_type: row.question_type,
      source_type: row.source_type,
      topic_id: row.topic_id,
      certification_id: row.certification_id,
      created_at: row.created_at,
      topic_name: topics?.name ?? null,
      topic_slug: topics?.slug ?? null,
    };
  });

  return NextResponse.json({ questions: rows, total: count ?? rows.length, limit, offset });
}
