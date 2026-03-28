import type { SupabaseClient } from "@supabase/supabase-js";

export interface GetQuestionInput {
  userId: string;
  difficulty: number;
  topicId?: string | null;
  certificationId?: string | null;
  /** When true, include tier 5 (labs). Default false for regular battles. */
  includeLabs?: boolean;
}

export interface GetQuestionOutput {
  question: {
    id: string;
    text: string;
    difficulty: number;
    topicId: string;
    certificationId: string;
  };
  answers: Array<{ id: string; label: string; text: string; isCorrect: boolean }>;
  difficulty: number;
  explanation: string;
}

const RECENT_QUESTION_COUNT = 20;

/**
 * getQuestion(user, difficulty, topic)
 * - Avoid repeating recent questions
 * - Weight toward weak topics (low correct/Total ratio)
 * - Return question, answers, difficulty, explanation
 * - Regular battles: tiers 1-4 only. Labs (tier 5) when includeLabs=true.
 */
export async function getQuestion(
  supabase: SupabaseClient,
  input: GetQuestionInput
): Promise<GetQuestionOutput | null> {
  const { userId, difficulty, topicId, certificationId, includeLabs = false } = input;

  const recentIds = await getRecentQuestionIds(supabase, userId);
  const weakTopicIds = await getWeakTopicIds(supabase, userId);
  const topicFilter = topicId ?? (weakTopicIds.length > 0 ? weakTopicIds[0] : null);

  const maxTier = includeLabs ? 5 : 4;

  let query = supabase
    .from("questions")
    .select("id, prompt, difficulty_tier, topic_id, certification_id, short_explanation")
    .eq("is_active", true)
    .gte("difficulty_tier", Math.max(1, difficulty - 1))
    .lte("difficulty_tier", Math.min(maxTier, difficulty + 1));

  if (topicFilter) {
    query = query.eq("topic_id", topicFilter);
  }
  if (certificationId) {
    query = query.eq("certification_id", certificationId);
  }

  const { data: questions } = await query;

  if (!questions || questions.length === 0) return null;

  const filtered = questions.filter((q) => !recentIds.has(q.id));
  const pool = filtered.length > 0 ? filtered : questions;
  const weights = pool.map((q) => {
    const topicWeak = weakTopicIds.includes(q.topic_id);
    return topicWeak ? 2 : 1;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  let idx = 0;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      idx = i;
      break;
    }
  }

  const q = pool[idx];

  const { data: optionsData } = await supabase
    .from("answer_options")
    .select("id, label, option_text, is_correct, sort_order")
    .eq("question_id", q.id)
    .order("sort_order");

  const options = (optionsData ?? []) as Array<{
    id: string;
    label: string;
    option_text: string;
    is_correct: boolean;
    sort_order: number;
  }>;

  return {
    question: {
      id: q.id,
      text: q.prompt,
      difficulty: q.difficulty_tier,
      topicId: q.topic_id,
      certificationId: q.certification_id,
    },
    answers: options.map((o) => ({
      id: o.id,
      label: o.label,
      text: o.option_text,
      isCorrect: o.is_correct,
    })),
    difficulty: q.difficulty_tier,
    explanation: q.short_explanation ?? "",
  };
}

async function getRecentQuestionIds(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("user_question_history")
    .select("question_id")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false })
    .limit(RECENT_QUESTION_COUNT);

  return new Set((data ?? []).map((r) => r.question_id));
}

async function getWeakTopicIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("user_stats")
    .select("topic_id, correct_count, incorrect_count")
    .eq("user_id", userId);

  if (!data || data.length === 0) return [];

  return data
    .filter((r) => {
      const total = r.correct_count + r.incorrect_count;
      return total >= 3 && r.correct_count / total < 0.6;
    })
    .map((r) => r.topic_id)
    .slice(0, 5);
}
