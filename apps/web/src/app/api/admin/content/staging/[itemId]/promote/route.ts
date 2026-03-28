import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { uuidSchema } from "@/lib/validations";
import { promoteStagingItem, resolveCertificationIdForIngest } from "@/lib/content-promotion";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const { itemId: rawId } = await context.params;

  const idParse = uuidSchema.safeParse(rawId);
  if (!idParse.success) {
    return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("content_staging_items")
    .select(
      "id, kind, ingest_id, review_status, domain_slug, domain_name, topic_slug, topic_name, topic_summary, concept_key, variant_index, difficulty_tier, question_type, prompt, short_explanation, long_explanation, reference_link, answer_options, promoted_domain_id, promoted_topic_id, promoted_question_id"
    )
    .eq("id", idParse.data)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const certificationId = await resolveCertificationIdForIngest(supabase, row.ingest_id);
  if (!certificationId) {
    return NextResponse.json({ error: "Ingest not found" }, { status: 404 });
  }

  try {
    const result = await promoteStagingItem(supabase, certificationId, row);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Promotion failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
