import type { SupabaseClient } from "@supabase/supabase-js";
import { validateStagingQuestion, validateStagingTopic, type StagingQuestionDraft, type StagingTopicDraft } from "@legendary-hunts/core";

type StagingRow = {
  id: string;
  kind: "topic" | "question";
  ingest_id: string;
  review_status: string;
  domain_slug: string;
  domain_name: string | null;
  topic_slug: string;
  topic_name: string | null;
  topic_summary: string | null;
  concept_key: string | null;
  variant_index: number;
  difficulty_tier: number;
  question_type: string;
  prompt: string | null;
  short_explanation: string | null;
  long_explanation: string | null;
  reference_link: string | null;
  answer_options: unknown;
  promoted_domain_id: string | null;
  promoted_topic_id: string | null;
  promoted_question_id: string | null;
};

export async function resolveCertificationIdForIngest(
  supabase: SupabaseClient,
  ingestId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("content_ingests")
    .select("certification_id")
    .eq("id", ingestId)
    .maybeSingle();
  return data?.certification_id ?? null;
}

async function ensureDomain(
  supabase: SupabaseClient,
  certificationId: string,
  slug: string,
  name: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("domains")
    .select("id")
    .eq("certification_id", certificationId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: maxRow } = await supabase
    .from("domains")
    .select("sort_order")
    .eq("certification_id", certificationId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data: ins, error } = await supabase
    .from("domains")
    .insert({
      certification_id: certificationId,
      slug,
      name,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error) throw error;
  return ins.id;
}

async function ensureTopic(
  supabase: SupabaseClient,
  domainId: string,
  slug: string,
  name: string,
  summary: string | null
): Promise<string> {
  const { data: existing } = await supabase
    .from("topics")
    .select("id")
    .eq("domain_id", domainId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: maxRow } = await supabase
    .from("topics")
    .select("sort_order")
    .eq("domain_id", domainId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data: ins, error } = await supabase
    .from("topics")
    .insert({
      domain_id: domainId,
      slug,
      name,
      summary: summary?.trim() || null,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error) throw error;
  return ins.id;
}

async function getOrCreateConceptGroup(
  supabase: SupabaseClient,
  topicId: string,
  conceptSlug: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("question_concept_groups")
    .select("id")
    .eq("topic_id", topicId)
    .eq("slug", conceptSlug)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: ins, error } = await supabase
    .from("question_concept_groups")
    .insert({ topic_id: topicId, slug: conceptSlug })
    .select("id")
    .single();

  if (error) throw error;
  return ins.id;
}

function rowToTopicDraft(row: StagingRow): StagingTopicDraft {
  return {
    kind: "topic",
    domain_slug: row.domain_slug,
    domain_name: row.domain_name ?? row.domain_slug,
    topic_slug: row.topic_slug,
    topic_name: row.topic_name ?? row.topic_slug,
    topic_summary: row.topic_summary ?? "",
    sort_order: 0,
  };
}

function rowToQuestionDraft(row: StagingRow): StagingQuestionDraft {
  const opts = (row.answer_options as StagingQuestionDraft["answer_options"]) ?? [];
  return {
    kind: "question",
    domain_slug: row.domain_slug,
    domain_name: row.domain_name ?? row.domain_slug,
    topic_slug: row.topic_slug,
    topic_name: row.topic_name ?? row.topic_slug,
    concept_key: row.concept_key ?? "default",
    variant_index: row.variant_index,
    difficulty_tier: row.difficulty_tier as 1 | 2 | 3 | 4,
    question_type: row.question_type as StagingQuestionDraft["question_type"],
    prompt: row.prompt ?? "",
    short_explanation: row.short_explanation ?? "",
    long_explanation: row.long_explanation ?? "",
    reference_link: row.reference_link ?? undefined,
    answer_options: opts,
    sort_order: 0,
  };
}

export async function promoteStagingItem(
  supabase: SupabaseClient,
  certificationId: string,
  row: StagingRow
): Promise<{ domainId?: string; topicId?: string; questionId?: string }> {
  if (row.review_status !== "pending") {
    throw new Error("Only pending items can be promoted");
  }

  if (row.kind === "topic" && row.promoted_topic_id) {
    throw new Error("Topic was already promoted");
  }
  if (row.kind === "question" && row.promoted_question_id) {
    throw new Error("Question was already promoted");
  }

  if (row.kind === "topic") {
    const draft = rowToTopicDraft(row);
    const err = validateStagingTopic(draft);
    if (err) throw new Error(err);

    const domainId = await ensureDomain(
      supabase,
      certificationId,
      draft.domain_slug,
      draft.domain_name
    );
    const topicId = await ensureTopic(
      supabase,
      domainId,
      draft.topic_slug,
      draft.topic_name,
      draft.topic_summary || null
    );

    await supabase
      .from("content_staging_items")
      .update({
        review_status: "approved",
        promoted_domain_id: domainId,
        promoted_topic_id: topicId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    return { domainId, topicId };
  }

  const qDraft = rowToQuestionDraft(row);
  const qErr = validateStagingQuestion(qDraft);
  if (qErr) throw new Error(qErr);

  const { data: domainRow } = await supabase
    .from("domains")
    .select("id")
    .eq("certification_id", certificationId)
    .eq("slug", row.domain_slug)
    .maybeSingle();
  if (!domainRow?.id) {
    throw new Error("Domain does not exist for this certification — approve the topic row first or create the domain.");
  }

  const { data: topicRow } = await supabase
    .from("topics")
    .select("id")
    .eq("domain_id", domainRow.id)
    .eq("slug", row.topic_slug)
    .maybeSingle();
  if (!topicRow?.id) {
    throw new Error("Topic does not exist — approve the matching topic staging item first.");
  }

  const conceptSlug =
    (row.concept_key && row.concept_key.slice(0, 200)) || `variant-${row.variant_index}`;
  const conceptGroupId = await getOrCreateConceptGroup(supabase, topicRow.id, conceptSlug);

  const { data: questionIns, error: qe } = await supabase
    .from("questions")
    .insert({
      certification_id: certificationId,
      domain_id: domainRow.id,
      topic_id: topicRow.id,
      source_type: "ingested",
      question_type: row.question_type,
      difficulty_tier: row.difficulty_tier,
      prompt: row.prompt,
      short_explanation: row.short_explanation,
      long_explanation: row.long_explanation ?? row.short_explanation,
      reference_link: row.reference_link,
      is_active: false,
      concept_group_id: conceptGroupId,
    })
    .select("id")
    .single();

  if (qe) throw qe;
  const questionId = questionIns.id;

  const options = qDraft.answer_options;
  if (options.length) {
    const rows = options.map((o) => ({
      question_id: questionId,
      label: o.label,
      option_text: o.option_text,
      is_correct: o.is_correct,
      sort_order: o.sort_order,
    }));
    const { error: oe } = await supabase.from("answer_options").insert(rows);
    if (oe) throw oe;
  }

  await supabase
    .from("content_staging_items")
    .update({
      review_status: "approved",
      promoted_domain_id: domainRow.id,
      promoted_topic_id: topicRow.id,
      promoted_question_id: questionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  return { domainId: domainRow.id, topicId: topicRow.id, questionId };
}
