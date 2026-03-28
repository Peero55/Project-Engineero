import type { SupabaseClient } from "@supabase/supabase-js";

export type StudyExplanationSelection =
  | "remediation_recent_miss"
  | "high_exposure_review"
  | "anchor_by_difficulty";

export type StudyExplanationPick = {
  questionId: string;
  shortExplanation: string;
  longExplanation: string;
  selection: StudyExplanationSelection;
};

type QRow = {
  id: string;
  short_explanation: string;
  long_explanation: string;
  difficulty_tier: number;
  created_at: string;
};

type HistRow = {
  question_id: string;
  times_seen: number;
  times_correct: number;
  last_seen_at: string;
};

/**
 * Picks the best study copy for a topic:
 * 1) Recent incorrect / incomplete mastery on a question (remediation)
 * 2) Highest exposure (needs reinforcement)
 * 3) Hardest active anchor question in the topic
 */
export async function selectStudyExplanationForTopic(
  supabase: SupabaseClient,
  userId: string,
  topicId: string
): Promise<StudyExplanationPick | null> {
  const { data: questions } = await supabase
    .from("questions")
    .select("id, short_explanation, long_explanation, difficulty_tier, created_at")
    .eq("topic_id", topicId)
    .eq("is_active", true)
    .neq("question_type", "guided_lab")
    .lte("difficulty_tier", 4);

  const qs = (questions ?? []) as QRow[];
  if (qs.length === 0) return null;

  const qIds = qs.map((q) => q.id);
  const { data: history } = await supabase
    .from("user_question_history")
    .select("question_id, times_seen, times_correct, last_seen_at")
    .eq("user_id", userId)
    .in("question_id", qIds);

  const hist = (history ?? []) as HistRow[];
  const histByQ = new Map(hist.map((h) => [h.question_id, h]));

  const byRemediation = [...qs]
    .map((q) => {
      const h = histByQ.get(q.id);
      if (!h || h.times_seen < 1) return null;
      const misses = h.times_seen - h.times_correct;
      if (misses < 1) return null;
      return {
        q,
        misses,
        last: new Date(h.last_seen_at).getTime(),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => (b.misses !== a.misses ? b.misses - a.misses : b.last - a.last));

  if (byRemediation[0]) {
    const q = byRemediation[0].q;
    return {
      questionId: q.id,
      shortExplanation: q.short_explanation,
      longExplanation: q.long_explanation,
      selection: "remediation_recent_miss",
    };
  }

  const byExposure = [...qs]
    .map((q) => {
      const h = histByQ.get(q.id);
      return { q, seen: h?.times_seen ?? 0, last: h ? new Date(h.last_seen_at).getTime() : 0 };
    })
    .filter((x) => x.seen > 0)
    .sort((a, b) => (b.seen !== a.seen ? b.seen - a.seen : b.last - a.last));

  if (byExposure[0]) {
    const q = byExposure[0].q;
    return {
      questionId: q.id,
      shortExplanation: q.short_explanation,
      longExplanation: q.long_explanation,
      selection: "high_exposure_review",
    };
  }

  const anchor = [...qs].sort(
    (a, b) =>
      b.difficulty_tier - a.difficulty_tier ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  return {
    questionId: anchor.id,
    shortExplanation: anchor.short_explanation,
    longExplanation: anchor.long_explanation,
    selection: "anchor_by_difficulty",
  };
}
