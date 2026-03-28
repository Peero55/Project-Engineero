import type { SupabaseClient } from "@supabase/supabase-js";
import { DAMAGE_BY_DIFFICULTY } from "@legendary-hunts/config";
import { refreshContinuityAfterQuestionAnswer } from "./knowledge-continuity";

export interface SubmitAnswerInput {
  userId: string;
  questionId: string;
  selectedOptionIds: string[];
  responseMs: number;
  /** Server-side: elapsed time exceeded allowed window; counts as incorrect */
  timedOut?: boolean;
}

export interface SubmitAnswerOutput {
  correct: boolean;
  damageDealt: number;
  damageTaken: number;
  explanation: string;
  updatedStats: {
    topicId: string;
    correctCount: number;
    incorrectCount: number;
    avgTimeMs: number;
  };
}

const BASE_DAMAGE_TAKEN = 25;
const FAST_THRESHOLD_MS = 5000;
const SLOW_PENALTY_PER_SECOND = 2;

/**
 * submitAnswer(userId, questionId, answer, responseTime)
 * - wrong or no answer = full damage taken
 * - slower response = more damage taken
 * - correct answer = damage dealt based on difficulty
 */
export async function submitAnswer(
  supabase: SupabaseClient,
  input: SubmitAnswerInput
): Promise<SubmitAnswerOutput | null> {
  const { userId, questionId, selectedOptionIds, responseMs, timedOut } = input;

  const { data: questionRow } = await supabase
    .from("questions")
    .select("id, difficulty_tier, topic_id, short_explanation")
    .eq("id", questionId)
    .single();

  if (!questionRow) return null;

  const { data: correctOptions } = await supabase
    .from("answer_options")
    .select("id")
    .eq("question_id", questionId)
    .eq("is_correct", true);

  const correctIds = new Set((correctOptions ?? []).map((o) => o.id));
  const selectedSet = new Set(selectedOptionIds);
  const isCorrect = timedOut
    ? false
    : correctIds.size === selectedSet.size &&
      [...correctIds].every((id) => selectedSet.has(id));

  const difficulty = questionRow.difficulty_tier ?? 3;
  const damageDealt = isCorrect
    ? DAMAGE_BY_DIFFICULTY[difficulty] ?? 25
    : 0;

  let damageTaken = isCorrect ? 0 : BASE_DAMAGE_TAKEN;
  if (!isCorrect && !timedOut && responseMs > FAST_THRESHOLD_MS) {
    const extraSeconds = (responseMs - FAST_THRESHOLD_MS) / 1000;
    damageTaken += Math.floor(extraSeconds * SLOW_PENALTY_PER_SECOND);
  }

  const topicId = questionRow.topic_id;

  const { data: existingStat } = await supabase
    .from("user_stats")
    .select("id, correct_count, incorrect_count, total_response_ms")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .single();

  const prevCorrect = existingStat?.correct_count ?? 0;
  const prevIncorrect = existingStat?.incorrect_count ?? 0;
  const prevTotalMs = existingStat?.total_response_ms ?? 0;
  const newCorrect = prevCorrect + (isCorrect ? 1 : 0);
  const newIncorrect = prevIncorrect + (isCorrect ? 0 : 1);
  const newTotalMs = prevTotalMs + responseMs;
  const avgTimeMs = newCorrect + newIncorrect > 0
    ? Math.round(newTotalMs / (newCorrect + newIncorrect))
    : 0;

  await supabase.from("user_stats").upsert(
    {
      user_id: userId,
      topic_id: topicId,
      correct_count: newCorrect,
      incorrect_count: newIncorrect,
      total_response_ms: newTotalMs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_id" }
  );

  await upsertUserQuestionHistory(supabase, userId, questionId, isCorrect);

  await refreshContinuityAfterQuestionAnswer(
    supabase,
    userId,
    topicId,
    newCorrect,
    newIncorrect,
    avgTimeMs
  );

  return {
    correct: isCorrect,
    damageDealt,
    damageTaken,
    explanation: questionRow.short_explanation ?? "",
    updatedStats: {
      topicId,
      correctCount: newCorrect,
      incorrectCount: newIncorrect,
      avgTimeMs,
    },
  };
}

async function upsertUserQuestionHistory(
  supabase: SupabaseClient,
  userId: string,
  questionId: string,
  wasCorrect: boolean
): Promise<void> {
  const { data: existing } = await supabase
    .from("user_question_history")
    .select("id, times_seen, times_correct")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .single();

  if (existing) {
    await supabase
      .from("user_question_history")
      .update({
        times_seen: existing.times_seen + 1,
        times_correct: existing.times_correct + (wasCorrect ? 1 : 0),
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_question_history").insert({
      user_id: userId,
      question_id: questionId,
      times_seen: 1,
      times_correct: wasCorrect ? 1 : 0,
    });
  }
}
