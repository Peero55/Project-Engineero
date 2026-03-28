import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeTopicMastery,
  STUDY_NOTE_MASTERY_THRESHOLD,
  STUDY_NOTE_MIN_CORRECT,
  type TopicMasteryAggregates,
  type TopicMasteryResult,
} from "./topic-mastery";

export type UserTopicContinuityRow = {
  topicId: string;
  discoveredAt: string | null;
  explanationLastViewedAt: string | null;
  studyNoteUnlockedAt: string | null;
};

export type TopicSummaryWithMastery = {
  topicId: string;
  topicSlug: string;
  topicName: string;
  domainId: string;
  domainSlug: string;
  mastery: TopicMasteryResult;
  aggregates: TopicMasteryAggregates;
  continuity: UserTopicContinuityRow | null;
};

/**
 * Exposure + recency aggregates for questions in a topic (for mastery).
 */
export async function fetchTopicPracticeAggregates(
  supabase: SupabaseClient,
  userId: string,
  topicId: string
): Promise<{
  avgQuestionExposure: number;
  lastPracticedAtIso: string | null;
}> {
  const { data: qrows } = await supabase.from("questions").select("id").eq("topic_id", topicId);
  const ids = (qrows ?? []).map((r) => r.id);
  if (ids.length === 0) {
    return { avgQuestionExposure: 0, lastPracticedAtIso: null };
  }

  const { data: hist } = await supabase
    .from("user_question_history")
    .select("times_seen, last_seen_at")
    .eq("user_id", userId)
    .in("question_id", ids);

  const rows = hist ?? [];
  if (rows.length === 0) {
    return { avgQuestionExposure: 0, lastPracticedAtIso: null };
  }

  const sumSeen = rows.reduce((a, r) => a + (r.times_seen ?? 0), 0);
  const avgQuestionExposure = sumSeen / rows.length;
  let lastMs = 0;
  for (const r of rows) {
    const t = new Date(r.last_seen_at).getTime();
    if (!Number.isNaN(t) && t > lastMs) lastMs = t;
  }

  return {
    avgQuestionExposure,
    lastPracticedAtIso: lastMs > 0 ? new Date(lastMs).toISOString() : null,
  };
}

async function loadContinuityRow(
  supabase: SupabaseClient,
  userId: string,
  topicId: string
): Promise<UserTopicContinuityRow | null> {
  const { data } = await supabase
    .from("user_topic_continuity")
    .select("topic_id, discovered_at, explanation_last_viewed_at, study_note_unlocked_at")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (!data) return null;
  return {
    topicId: data.topic_id,
    discoveredAt: data.discovered_at,
    explanationLastViewedAt: data.explanation_last_viewed_at,
    studyNoteUnlockedAt: data.study_note_unlocked_at,
  };
}

/**
 * After a question is answered: mark topic discovered; refresh optional study-note unlock.
 */
export async function refreshContinuityAfterQuestionAnswer(
  supabase: SupabaseClient,
  userId: string,
  topicId: string,
  correctCount: number,
  incorrectCount: number,
  avgTimeMs: number | null
): Promise<void> {
  const { avgQuestionExposure, lastPracticedAtIso } = await fetchTopicPracticeAggregates(
    supabase,
    userId,
    topicId
  );

  const agg: TopicMasteryAggregates = {
    correctCount,
    incorrectCount,
    avgResponseMs: avgTimeMs,
    avgQuestionExposure,
    lastPracticedAtIso,
  };

  const { score01 } = computeTopicMastery(agg, Date.now());
  const nowIso = new Date().toISOString();

  const { data: existing } = await supabase
    .from("user_topic_continuity")
    .select("discovered_at, study_note_unlocked_at, explanation_last_viewed_at")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();

  const shouldUnlockNote =
    !existing?.study_note_unlocked_at &&
    (score01 >= STUDY_NOTE_MASTERY_THRESHOLD || correctCount >= STUDY_NOTE_MIN_CORRECT);

  await supabase.from("user_topic_continuity").upsert(
    {
      user_id: userId,
      topic_id: topicId,
      discovered_at: existing?.discovered_at ?? nowIso,
      explanation_last_viewed_at: existing?.explanation_last_viewed_at ?? null,
      study_note_unlocked_at: shouldUnlockNote
        ? nowIso
        : (existing?.study_note_unlocked_at ?? null),
      updated_at: nowIso,
    },
    { onConflict: "user_id,topic_id" }
  );
}

/**
 * Record codex page view (and backfill discovery if missing).
 */
export async function recordTopicExplanationViewed(
  supabase: SupabaseClient,
  userId: string,
  topicId: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data: existing } = await supabase
    .from("user_topic_continuity")
    .select("discovered_at, study_note_unlocked_at")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();

  await supabase.from("user_topic_continuity").upsert(
    {
      user_id: userId,
      topic_id: topicId,
      discovered_at: existing?.discovered_at ?? nowIso,
      explanation_last_viewed_at: nowIso,
      study_note_unlocked_at: existing?.study_note_unlocked_at ?? null,
      updated_at: nowIso,
    },
    { onConflict: "user_id,topic_id" }
  );
}

/**
 * Build mastery + continuity for all topics under a domain.
 */
export async function fetchDomainTopicSummaries(
  supabase: SupabaseClient,
  userId: string,
  domainId: string,
  nowMs: number
): Promise<TopicSummaryWithMastery[]> {
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, name, domain_id")
    .eq("domain_id", domainId)
    .order("sort_order", { ascending: true });

  const { data: domain } = await supabase.from("domains").select("slug").eq("id", domainId).single();

  const domainSlug = domain?.slug ?? "";

  const out: TopicSummaryWithMastery[] = [];
  for (const t of topics ?? []) {
    const { data: stat } = await supabase
      .from("user_stats")
      .select("correct_count, incorrect_count, total_response_ms, updated_at")
      .eq("user_id", userId)
      .eq("topic_id", t.id)
      .maybeSingle();

    const correctCount = stat?.correct_count ?? 0;
    const incorrectCount = stat?.incorrect_count ?? 0;
    const attempts = correctCount + incorrectCount;
    const avgTimeMs =
      attempts > 0 && stat?.total_response_ms != null
        ? Math.round(Number(stat.total_response_ms) / attempts)
        : null;

    const { avgQuestionExposure, lastPracticedAtIso } = await fetchTopicPracticeAggregates(
      supabase,
      userId,
      t.id
    );

    const aggregates: TopicMasteryAggregates = {
      correctCount,
      incorrectCount,
      avgResponseMs: avgTimeMs,
      avgQuestionExposure,
      lastPracticedAtIso,
    };

    const mastery = computeTopicMastery(aggregates, nowMs);
    const continuity = await loadContinuityRow(supabase, userId, t.id);

    out.push({
      topicId: t.id,
      topicSlug: t.slug,
      topicName: t.name,
      domainId: t.domain_id,
      domainSlug,
      mastery,
      aggregates,
      continuity,
    });
  }

  return out;
}

export function averageReadiness(summaries: TopicSummaryWithMastery[]): number {
  if (summaries.length === 0) return 0;
  const sum = summaries.reduce((a, s) => a + s.mastery.readiness01, 0);
  return sum / summaries.length;
}

/** Single source for domain-level readiness from {@link fetchDomainTopicSummaries} output. */
export type DomainReadinessBreakdown = {
  readinessPct: number | null;
  practicedTopicCount: number;
  totalTopicCount: number;
};

export function summarizeDomainReadiness(
  summaries: TopicSummaryWithMastery[]
): DomainReadinessBreakdown {
  const practiced = summaries.filter(
    (s) => s.aggregates.correctCount + s.aggregates.incorrectCount > 0
  );
  return {
    readinessPct:
      practiced.length > 0 ? Math.round(averageReadiness(practiced) * 100) : null,
    practicedTopicCount: practiced.length,
    totalTopicCount: summaries.length,
  };
}

export type UserContinuityCounts = {
  topicsDiscovered: number;
  explanationsViewed: number;
  studyNotesUnlocked: number;
};

export async function fetchUserContinuityCounts(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContinuityCounts> {
  const { data: rows } = await supabase
    .from("user_topic_continuity")
    .select("discovered_at, explanation_last_viewed_at, study_note_unlocked_at")
    .eq("user_id", userId);

  const list = rows ?? [];
  return {
    topicsDiscovered: list.filter((r) => r.discovered_at != null).length,
    explanationsViewed: list.filter((r) => r.explanation_last_viewed_at != null).length,
    studyNotesUnlocked: list.filter((r) => r.study_note_unlocked_at != null).length,
  };
}

export type DashboardKnowledgeSnapshot = {
  continuity: UserContinuityCounts;
  weakest: TopicSummaryWithMastery[];
  domains: Array<{
    domainId: string;
    domainSlug: string;
    domainName: string;
  } & DomainReadinessBreakdown>;
};

export async function fetchDashboardKnowledgeSnapshot(
  supabase: SupabaseClient,
  userId: string,
  nowMs: number,
  weakestLimit: number
): Promise<DashboardKnowledgeSnapshot> {
  const continuity = await fetchUserContinuityCounts(supabase, userId);
  const weakest = await fetchWeakestTopicSummaries(supabase, userId, nowMs, weakestLimit);

  const { data: domains } = await supabase
    .from("domains")
    .select("id, name, slug, sort_order")
    .order("sort_order", { ascending: true });

  const domainsOut: DashboardKnowledgeSnapshot["domains"] = [];
  for (const d of domains ?? []) {
    const summaries = await fetchDomainTopicSummaries(supabase, userId, d.id, nowMs);
    domainsOut.push({
      domainId: d.id,
      domainSlug: d.slug,
      domainName: d.name,
      ...summarizeDomainReadiness(summaries),
    });
  }

  return { continuity, weakest, domains: domainsOut };
}

/**
 * Cross-domain snapshot for dashboard (weakest topics first).
 */
export async function fetchWeakestTopicSummaries(
  supabase: SupabaseClient,
  userId: string,
  nowMs: number,
  limit: number
): Promise<TopicSummaryWithMastery[]> {
  const { data: stats } = await supabase
    .from("user_stats")
    .select("topic_id, correct_count, incorrect_count, total_response_ms")
    .eq("user_id", userId);

  const rows = stats ?? [];
  const enriched: TopicSummaryWithMastery[] = [];

  for (const s of rows) {
    const { data: topic } = await supabase
      .from("topics")
      .select("id, slug, name, domain_id")
      .eq("id", s.topic_id)
      .maybeSingle();
    if (!topic) continue;

    const { data: domain } = await supabase
      .from("domains")
      .select("slug")
      .eq("id", topic.domain_id)
      .single();

    const correctCount = s.correct_count ?? 0;
    const incorrectCount = s.incorrect_count ?? 0;
    const attempts = correctCount + incorrectCount;
    const avgTimeMs =
      attempts > 0 && s.total_response_ms != null
        ? Math.round(Number(s.total_response_ms) / attempts)
        : null;

    const { avgQuestionExposure, lastPracticedAtIso } = await fetchTopicPracticeAggregates(
      supabase,
      userId,
      topic.id
    );

    const aggregates: TopicMasteryAggregates = {
      correctCount,
      incorrectCount,
      avgResponseMs: avgTimeMs,
      avgQuestionExposure,
      lastPracticedAtIso,
    };

    const mastery = computeTopicMastery(aggregates, nowMs);
    const continuity = await loadContinuityRow(supabase, userId, topic.id);

    enriched.push({
      topicId: topic.id,
      topicSlug: topic.slug,
      topicName: topic.name,
      domainId: topic.domain_id,
      domainSlug: domain?.slug ?? "",
      mastery,
      aggregates,
      continuity,
    });
  }

  enriched.sort((a, b) => a.mastery.score01 - b.mastery.score01);
  return enriched.slice(0, limit);
}
