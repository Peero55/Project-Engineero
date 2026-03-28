import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { z } from "zod";
import { parseStudyMaterial } from "@legendary-hunts/core";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { uuidSchema } from "@/lib/validations";

export const runtime = "nodejs";

const plainTextFallbackSchema = z.object({
  domainSlug: z.string().min(1),
  domainName: z.string().min(1),
  topicSlug: z.string().min(1),
  topicName: z.string().min(1),
});

const jsonBodySchema = z.object({
  certificationId: uuidSchema,
  title: z.string().min(1).max(500),
  sourceKind: z.enum(["pdf", "text"]),
  /** Raw text when not uploading a file */
  text: z.string().min(1).max(2_000_000).optional(),
  plainTextFallback: plainTextFallbackSchema.optional(),
  variantsPerConcept: z.number().int().min(1).max(6).optional(),
});

async function extractTextFromUpload(file: File): Promise<{ text: string; sourceKind: "pdf" | "text" }> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    try {
      const parsed = await parser.getText();
      return { text: parsed.text ?? "", sourceKind: "pdf" };
    } finally {
      await parser.destroy();
    }
  }
  return { text: buf.toString("utf8"), sourceKind: "text" };
}

export async function POST(request: NextRequest) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const contentType = request.headers.get("content-type") ?? "";
  let certificationId: string;
  let title: string;
  let plainTextFallback: z.infer<typeof plainTextFallbackSchema> | undefined;
  let variantsPerConcept: number | undefined;
  let extractedText: string;
  let sourceKind: "pdf" | "text";
  let originalFilename: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const cert = form.get("certificationId");
    const titleRaw = form.get("title");
    const file = form.get("file");
    const paste = form.get("text");
    certificationId = typeof cert === "string" ? cert : "";
    title = typeof titleRaw === "string" ? titleRaw : "";
    const pt = form.get("plainTextFallback");
    if (typeof pt === "string" && pt.trim()) {
      try {
        plainTextFallback = plainTextFallbackSchema.parse(JSON.parse(pt));
      } catch {
        return NextResponse.json({ error: "Invalid plainTextFallback JSON" }, { status: 400 });
      }
    }
    const vp = form.get("variantsPerConcept");
    if (typeof vp === "string" && vp) variantsPerConcept = Number(vp) || undefined;

    const certParse = uuidSchema.safeParse(certificationId);
    if (!certParse.success) {
      return NextResponse.json({ error: "Invalid certificationId" }, { status: 400 });
    }
    if (!title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    if (file instanceof File && file.size > 0) {
      originalFilename = file.name;
      const ex = await extractTextFromUpload(file);
      extractedText = ex.text;
      sourceKind = ex.sourceKind;
    } else if (typeof paste === "string" && paste.trim()) {
      extractedText = paste;
      sourceKind = "text";
    } else {
      return NextResponse.json({ error: "Provide file or text" }, { status: 400 });
    }
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = jsonBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    certificationId = parsed.data.certificationId;
    title = parsed.data.title;
    plainTextFallback = parsed.data.plainTextFallback;
    variantsPerConcept = parsed.data.variantsPerConcept;
    if (!parsed.data.text?.trim()) {
      return NextResponse.json({ error: "text is required for JSON ingest" }, { status: 400 });
    }
    extractedText = parsed.data.text;
    sourceKind = parsed.data.sourceKind;
  }

  if (!extractedText.trim()) {
    return NextResponse.json({ error: "Extracted text is empty" }, { status: 400 });
  }

  const { usedStructuredOutline, items } = parseStudyMaterial(extractedText, {
    plainTextFallback,
    variantsPerConcept,
  });

  if (items.length === 0) {
    return NextResponse.json(
      {
        error:
          "No staging items produced. Use structured markdown (see docs/CONTENT_INGEST_FORMAT.md) or provide plain-text fallback fields.",
      },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: ingestRow, error: ingestErr } = await supabase
    .from("content_ingests")
    .insert({
      certification_id: certificationId,
      title,
      source_kind: sourceKind,
      original_filename: originalFilename,
      extracted_text: extractedText.slice(0, 1_500_000),
      plain_text_fallback: Boolean(plainTextFallback),
      fallback_domain_slug: plainTextFallback?.domainSlug ?? null,
      fallback_domain_name: plainTextFallback?.domainName ?? null,
      fallback_topic_slug: plainTextFallback?.topicSlug ?? null,
      fallback_topic_name: plainTextFallback?.topicName ?? null,
    })
    .select("id")
    .single();

  if (ingestErr) {
    console.error("content_ingests insert:", ingestErr);
    return NextResponse.json({ error: ingestErr.message }, { status: 500 });
  }

  const ingestId = ingestRow.id as string;
  const topicKeyToStagingId = new Map<string, string>();

  for (const draft of items) {
    if (draft.kind === "topic") {
      const { data: row, error } = await supabase
        .from("content_staging_items")
        .insert({
          ingest_id: ingestId,
          kind: "topic",
          domain_slug: draft.domain_slug,
          domain_name: draft.domain_name,
          topic_slug: draft.topic_slug,
          topic_name: draft.topic_name,
          topic_summary: draft.topic_summary,
          sort_order: draft.sort_order,
          difficulty_tier: 1,
          question_type: "multiple_choice",
          variant_index: 0,
        })
        .select("id")
        .single();

      if (error) {
        console.error("staging topic insert:", error);
        await supabase.from("content_ingests").delete().eq("id", ingestId);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      topicKeyToStagingId.set(`${draft.domain_slug}/${draft.topic_slug}`, row.id);
      continue;
    }

    const parentKey = `${draft.domain_slug}/${draft.topic_slug}`;
    const parent_staging_id = topicKeyToStagingId.get(parentKey) ?? null;

    const { error } = await supabase.from("content_staging_items").insert({
      ingest_id: ingestId,
      kind: "question",
      parent_staging_id,
      domain_slug: draft.domain_slug,
      domain_name: draft.domain_name,
      topic_slug: draft.topic_slug,
      topic_name: draft.topic_name,
      concept_key: draft.concept_key,
      variant_index: draft.variant_index,
      difficulty_tier: draft.difficulty_tier,
      question_type: draft.question_type,
      prompt: draft.prompt,
      short_explanation: draft.short_explanation,
      long_explanation: draft.long_explanation,
      reference_link: draft.reference_link ?? null,
      answer_options: draft.answer_options,
      sort_order: draft.sort_order,
    });

    if (error) {
      console.error("staging question insert:", error);
      await supabase.from("content_ingests").delete().eq("id", ingestId);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ingestId,
    usedStructuredOutline,
    itemCount: items.length,
  });
}
