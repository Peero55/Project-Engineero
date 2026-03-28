import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { uuidSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ingestId: string }> }
) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const { ingestId: rawId } = await context.params;
  const idParse = uuidSchema.safeParse(rawId);
  if (!idParse.success) {
    return NextResponse.json({ error: "Invalid ingest id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: ingest, error: iErr } = await supabase
    .from("content_ingests")
    .select(
      "id, certification_id, title, source_kind, original_filename, parser_version, plain_text_fallback, created_at"
    )
    .eq("id", idParse.data)
    .maybeSingle();

  if (iErr) {
    console.error("content ingest get:", iErr);
    return NextResponse.json({ error: iErr.message }, { status: 500 });
  }
  if (!ingest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: items, error: sErr } = await supabase
    .from("content_staging_items")
    .select(
      "id, kind, parent_staging_id, review_status, domain_slug, domain_name, topic_slug, topic_name, topic_summary, concept_key, variant_index, difficulty_tier, question_type, prompt, short_explanation, long_explanation, reference_link, answer_options, sort_order, reviewer_note, promoted_domain_id, promoted_topic_id, promoted_question_id, updated_at"
    )
    .eq("ingest_id", idParse.data)
    .order("sort_order", { ascending: true });

  if (sErr) {
    console.error("content staging list:", sErr);
    return NextResponse.json({ error: sErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ingest,
    items: items ?? [],
  });
}
