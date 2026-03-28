/**
 * Content ingestion: deterministic parsing and draft staging rows (no PDF / I/O).
 * Theme-agnostic; produces domain/topic/question shapes aligned with DB staging.
 */

export type StagingQuestionType = "multiple_choice" | "multi_select" | "scenario";

export interface StagingAnswerOption {
  label: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface StagingTopicDraft {
  kind: "topic";
  domain_slug: string;
  domain_name: string;
  topic_slug: string;
  topic_name: string;
  topic_summary: string;
  sort_order: number;
}

export interface StagingQuestionDraft {
  kind: "question";
  domain_slug: string;
  domain_name: string;
  topic_slug: string;
  topic_name: string;
  concept_key: string;
  variant_index: number;
  difficulty_tier: 1 | 2 | 3 | 4;
  question_type: StagingQuestionType;
  prompt: string;
  short_explanation: string;
  long_explanation: string;
  reference_link?: string;
  answer_options: StagingAnswerOption[];
  sort_order: number;
}

export type StagingDraftItem = StagingTopicDraft | StagingQuestionDraft;

export interface ContentIngestParseInput {
  /** When set and structured markdown is not detected, build one topic + heuristic questions. */
  plainTextFallback?: {
    domainSlug: string;
    domainName: string;
    topicSlug: string;
    topicName: string;
  };
  /** Heuristic variants when using plain text (default 2). */
  variantsPerConcept?: number;
}

const STRUCTURED_DOMAIN = /^#\s*domain:\s*(.+)$/im;
const STRUCTURED_TOPIC = /^##\s*topic:\s*(.+)$/im;
const QUESTION_HEADER = /^###\s*question\s*$/im;
const KEY_LINE = /^([a-z_]+):\s*(.*)$/i;

export function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "topic";
}

function parseSlugName(part: string): { slug: string; name: string } {
  const trimmed = part.trim();
  const pipe = trimmed.indexOf("|");
  if (pipe >= 0) {
    return {
      slug: slugify(trimmed.slice(0, pipe)),
      name: trimmed.slice(pipe + 1).trim() || slugify(trimmed.slice(0, pipe)),
    };
  }
  return { slug: slugify(trimmed), name: trimmed };
}

function splitSentences(text: string): string[] {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return [];
  const parts = flat.split(/(?<=[.!?])\s+/).map((s) => s.trim());
  return parts.filter((s) => s.length > 0);
}

function hashConceptKey(topicSlug: string, seed: string): string {
  let h = 0;
  const str = `${topicSlug}:${seed}`;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return `c${Math.abs(h).toString(36)}`;
}

/**
 * Build multiple-choice variants from explanatory prose (no structured blocks).
 */
export function buildHeuristicQuestionsFromBody(
  domainSlug: string,
  domainName: string,
  topicSlug: string,
  topicName: string,
  body: string,
  variantCount: number,
  defaultTier: 1 | 2 | 3 | 4 = 2
): StagingQuestionDraft[] {
  const sentences = splitSentences(body);
  if (sentences.length < 2) return [];

  const n = Math.max(1, Math.min(variantCount, sentences.length));
  const out: StagingQuestionDraft[] = [];

  for (let v = 0; v < n; v++) {
    const correctIdx = v % sentences.length;
    const correct = sentences[correctIdx];
    const pool = sentences.filter((_, i) => i !== correctIdx);
    const wrong1 = pool[0] ?? "The material does not support this statement.";
    const wrong2 = pool[1] ?? "This contradicts the explanation above.";
    const wrong3 = pool[2] ?? "Only some of the above apply.";

    const conceptKey = hashConceptKey(topicSlug, correct.slice(0, 80));
    const opts: StagingAnswerOption[] = [
      { label: "A", option_text: correct, is_correct: true, sort_order: 0 },
      { label: "B", option_text: wrong1, is_correct: false, sort_order: 1 },
      { label: "C", option_text: wrong2, is_correct: false, sort_order: 2 },
      { label: "D", option_text: wrong3, is_correct: false, sort_order: 3 },
    ];

    out.push({
      kind: "question",
      domain_slug: domainSlug,
      domain_name: domainName,
      topic_slug: topicSlug,
      topic_name: topicName,
      concept_key: conceptKey,
      variant_index: v,
      difficulty_tier: defaultTier,
      question_type: "multiple_choice",
      prompt: `Which statement about **${topicName}** is supported by the study note?`,
      short_explanation: correct.slice(0, 280),
      long_explanation: body.trim().slice(0, 8000),
      answer_options: opts,
      sort_order: v,
    });
  }

  return out;
}

function parseOptionsBlock(lines: string[], startIdx: number): { options: StagingAnswerOption[]; nextIdx: number } {
  const options: StagingAnswerOption[] = [];
  let i = startIdx;
  const optRe = /^-\s*\[(x| )\]\s*(.+)$/i;
  let order = 0;
  const labels = ["A", "B", "C", "D", "E", "F"];
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const m = line.match(optRe);
    if (!m) break;
    const isCorrect = m[1].toLowerCase() === "x";
    options.push({
      label: labels[order] ?? String(order + 1),
      option_text: m[2].trim(),
      is_correct: isCorrect,
      sort_order: order,
    });
    order++;
    i++;
  }
  return { options, nextIdx: i };
}

function normalizeQuestionType(raw: string | undefined): StagingQuestionType {
  const t = (raw ?? "multiple_choice").toLowerCase().trim();
  if (t === "multi_select" || t === "multi-select") return "multi_select";
  if (t === "scenario") return "scenario";
  return "multiple_choice";
}

function parseTier(raw: string | undefined): 1 | 2 | 3 | 4 {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return 2;
}

function parseQuestionBlock(block: string): Omit<
  StagingQuestionDraft,
  "kind" | "domain_slug" | "domain_name" | "topic_slug" | "topic_name" | "concept_key" | "variant_index" | "sort_order"
> | null {
  const lines = block.split(/\r?\n/);
  let tier: 1 | 2 | 3 | 4 = 2;
  let question_type: StagingQuestionType = "multiple_choice";
  let prompt = "";
  let short_explanation = "";
  let long_explanation = "";
  let reference_link = "";
  let i = 0;

  while (i < lines.length) {
    const L = lines[i];
    if (L.trim().toLowerCase() === "options:") {
      i++;
      const { options } = parseOptionsBlock(lines, i);
      const correctCount = options.filter((o) => o.is_correct).length;
      if (!prompt.trim() || options.length < 2 || correctCount < 1) return null;
      if (question_type === "multiple_choice" && correctCount !== 1) return null;
      return {
        difficulty_tier: tier,
        question_type,
        prompt: prompt.trim(),
        short_explanation: short_explanation.trim(),
        long_explanation: long_explanation.trim(),
        reference_link: reference_link.trim() || undefined,
        answer_options: options,
      };
    }
    const km = L.match(KEY_LINE);
    if (km) {
      const key = km[1].toLowerCase();
      const val = km[2] ?? "";
      if (key === "tier") tier = parseTier(val);
      else if (key === "type") question_type = normalizeQuestionType(val);
      else if (key === "prompt") prompt = val.trim();
      else if (key === "short") short_explanation = val.trim();
      else if (key === "long") long_explanation = val.trim();
      else if (key === "reference") reference_link = val.trim();
      i++;
      continue;
    }
    i++;
  }
  return null;
}

/**
 * Structured study markdown (see docs/CONTENT_INGEST_FORMAT.md).
 * Returns null if the document does not declare a domain heading.
 */
export function parseStructuredStudyMarkdown(text: string): StagingDraftItem[] | null {
  const t = text.trim();
  const dm = t.match(STRUCTURED_DOMAIN);
  if (!dm) return null;

  const { slug: domainSlug, name: domainName } = parseSlugName(dm[1]);
  const headerEnd = t.indexOf(dm[0]) + dm[0].length;
  const rest = t.slice(headerEnd);
  const chunks = rest.split(STRUCTURED_TOPIC);
  const items: StagingDraftItem[] = [];
  let sortTopic = 0;
  let sortQuestion = 0;

  for (let ti = 1; ti < chunks.length; ti += 2) {
    const topicHead = chunks[ti] ?? "";
    const topicBody = chunks[ti + 1] ?? "";
    const { slug: topicSlug, name: topicName } = parseSlugName(topicHead);
    if (!topicSlug) continue;

    const qParts = topicBody.split(QUESTION_HEADER);
    const topicIntro = (qParts[0] ?? "").trim();
    let topicSummary = topicIntro;
    const sm = topicIntro.match(/^summary:\s*([\s\S]+)$/im);
    if (sm) topicSummary = sm[1].trim();

    items.push({
      kind: "topic",
      domain_slug: domainSlug,
      domain_name: domainName,
      topic_slug: topicSlug,
      topic_name: topicName,
      topic_summary: topicSummary,
      sort_order: sortTopic++,
    });

    for (let qi = 1; qi < qParts.length; qi++) {
      const block = (qParts[qi] ?? "").trim();
      const parsed = parseQuestionBlock(block);
      if (!parsed) continue;
      const conceptKey = hashConceptKey(topicSlug, parsed.prompt.slice(0, 120));
      const variantIndex = items.filter(
        (it) =>
          it.kind === "question" &&
          it.topic_slug === topicSlug &&
          it.concept_key === conceptKey
      ).length;
      items.push({
        kind: "question",
        domain_slug: domainSlug,
        domain_name: domainName,
        topic_slug: topicSlug,
        topic_name: topicName,
        concept_key: conceptKey,
        variant_index: variantIndex,
        ...parsed,
        sort_order: sortQuestion++,
      });
    }
  }

  return items.length ? items : null;
}

/**
 * Main entry: structured markdown first; optional plain-text fallback produces topic + heuristic MCQs.
 */
export function parseStudyMaterial(text: string, input: ContentIngestParseInput = {}): {
  usedStructuredOutline: boolean;
  items: StagingDraftItem[];
} {
  const structured = parseStructuredStudyMarkdown(text.trim());
  if (structured && structured.length > 0) {
    return { usedStructuredOutline: true, items: structured };
  }

  const fb = input.plainTextFallback;
  if (!fb) {
    return { usedStructuredOutline: false, items: [] };
  }

  const body = text.trim();
  const topicSummary = body.slice(0, 2000);
  const variants = input.variantsPerConcept ?? 2;
  const topicRow: StagingTopicDraft = {
    kind: "topic",
    domain_slug: slugify(fb.domainSlug),
    domain_name: fb.domainName.trim(),
    topic_slug: slugify(fb.topicSlug),
    topic_name: fb.topicName.trim(),
    topic_summary: topicSummary,
    sort_order: 0,
  };
  const questions = buildHeuristicQuestionsFromBody(
    topicRow.domain_slug,
    topicRow.domain_name,
    topicRow.topic_slug,
    topicRow.topic_name,
    body,
    variants,
    2
  );
  return { usedStructuredOutline: false, items: [topicRow, ...questions] };
}

export function validateStagingQuestion(q: StagingQuestionDraft): string | null {
  if (!q.prompt.trim()) return "prompt is required";
  if (!q.short_explanation.trim()) return "short_explanation is required";
  if (!q.long_explanation.trim()) return "long_explanation is required";
  if (q.difficulty_tier < 1 || q.difficulty_tier > 4) return "difficulty_tier must be 1–4";
  if (!q.answer_options || q.answer_options.length < 2) return "at least two answer_options required";
  const correct = q.answer_options.filter((o) => o.is_correct);
  if (correct.length < 1) return "at least one correct option required";
  if (q.question_type === "multiple_choice" && correct.length !== 1) {
    return "multiple_choice requires exactly one correct option";
  }
  return null;
}

export function validateStagingTopic(t: StagingTopicDraft): string | null {
  if (!t.domain_slug.trim()) return "domain_slug is required";
  if (!t.topic_slug.trim()) return "topic_slug is required";
  if (!t.topic_name.trim()) return "topic_name is required";
  return null;
}
