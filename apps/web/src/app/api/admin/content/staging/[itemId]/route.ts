import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { uuidSchema } from "@/lib/validations";

const answerOptionSchema = z.object({
  label: z.string(),
  option_text: z.string(),
  is_correct: z.boolean(),
  sort_order: z.number().int(),
});

const patchSchema = z.object({
  /** Use POST …/promote to approve into curriculum; only reject or reset to pending here. */
  review_status: z.enum(["pending", "rejected"]).optional(),
  domain_slug: z.string().min(1).optional(),
  domain_name: z.string().nullable().optional(),
  topic_slug: z.string().min(1).optional(),
  topic_name: z.string().nullable().optional(),
  topic_summary: z.string().nullable().optional(),
  concept_key: z.string().nullable().optional(),
  variant_index: z.number().int().min(0).optional(),
  difficulty_tier: z.number().int().min(1).max(4).optional(),
  question_type: z.enum(["multiple_choice", "multi_select", "scenario"]).optional(),
  prompt: z.string().nullable().optional(),
  short_explanation: z.string().nullable().optional(),
  long_explanation: z.string().nullable().optional(),
  reference_link: z.string().nullable().optional(),
  answer_options: z.array(answerOptionSchema).optional(),
  reviewer_note: z.string().nullable().optional(),
});

export async function PATCH(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: existing, error: e0 } = await supabase
    .from("content_staging_items")
    .select("id, review_status, promoted_question_id, kind")
    .eq("id", idParse.data)
    .maybeSingle();

  if (e0) {
    return NextResponse.json({ error: e0.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.review_status !== "pending") {
    return NextResponse.json({ error: "Only pending staging rows can be edited" }, { status: 400 });
  }

  if (existing.promoted_question_id && parsed.data.review_status === "rejected") {
    return NextResponse.json({ error: "Cannot reject an item that promoted a question" }, { status: 400 });
  }

  const patch = { ...parsed.data, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("content_staging_items")
    .update(patch)
    .eq("id", idParse.data)
    .select()
    .single();

  if (error) {
    console.error("staging patch:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
