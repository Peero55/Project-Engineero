import type { SupabaseClient } from "@supabase/supabase-js";
import { DAILY_QUESTION_DEFAULTS, NETWORK_PLUS_CERTIFICATION_ID } from "@legendary-hunts/config";
import { getQuestion } from "./question-engine";
import { submitAnswer } from "./answer-evaluation";
import { applyProgression } from "./progression";

export type DailyPlatform = "slack" | "discord" | "teams";

export interface GetNextDailyQuestionInput {
  userId: string;
  certificationId?: string | null;
  platform: DailyPlatform;
}

export type PublicDailyAnswer = {
  id: string;
  label: string;
  text: string;
};

export interface GetNextDailyQuestionOutput {
  question: {
    id: string;
    text: string;
    difficulty: number;
    topicId: string;
  };
  answers: PublicDailyAnswer[];
  /** Calendar date (YYYY-MM-DD) in configured timezone; used to anchor delivery + Slack message updates. */
  deliveryDate: string;
  explanation?: string;
}

export type GetNextDailyQuestionResult =
  | { ok: true; atQuota: false; data: GetNextDailyQuestionOutput }
  | { ok: true; atQuota: true; message: string }
  | { ok: false; reason: "no_questions"; message: string };

export interface RecordDailyAnswerInput {
  userId: string;
  questionId: string;
  selectedOptionIds: string[];
  responseMs: number;
}

export interface RecordDailyAnswerOutput {
  correct: boolean;
  explanation: string;
  updatedStats?: {
    topicId: string;
    correctCount: number;
    incorrectCount: number;
  };
  /** Same XP path as battle question encounters (`applyProgression`) */
  progression?: { level: number; xp: number; xpGained: number };
  /** Canonical web study path (domain-safe); omit if topic/domain missing */
  studyPath?: { domainSlug: string; topicSlug: string };
}

function calendarDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function getActiveDailyConfig(
  supabase: SupabaseClient,
  certificationId: string | null
): Promise<{
  questions_per_day: number;
  delivery_timezone: string;
} | null> {
  if (certificationId) {
    const { data: forCert } = await supabase
      .from("daily_question_config")
      .select("questions_per_day, delivery_timezone")
      .eq("is_active", true)
      .eq("certification_id", certificationId)
      .maybeSingle();
    if (forCert) return forCert;
  }

  const { data: global } = await supabase
    .from("daily_question_config")
    .select("questions_per_day, delivery_timezone")
    .eq("is_active", true)
    .is("certification_id", null)
    .maybeSingle();

  return global;
}

/**
 * Whether the user may receive another daily question today (under quota).
 */
export async function canReceiveQuestion(
  supabase: SupabaseClient,
  userId: string,
  certificationId: string | null
): Promise<boolean> {
  const config = await getActiveDailyConfig(supabase, certificationId);
  if (!config) return false;

  const tz = config.delivery_timezone || "UTC";
  const today = calendarDateInTimeZone(new Date(), tz);

  const { count, error } = await supabase
    .from("daily_question_deliveries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("delivery_date", today);

  if (error) return false;
  const used = count ?? 0;
  return used < config.questions_per_day;
}

/**
 * Fetches the next daily question, inserts a delivery row, and returns sanitized answers (no correctness flags).
 */
export async function getNextDailyQuestion(
  supabase: SupabaseClient,
  input: GetNextDailyQuestionInput
): Promise<GetNextDailyQuestionResult> {
  const { userId, platform } = input;
  const certificationId =
    input.certificationId === undefined || input.certificationId === null
      ? NETWORK_PLUS_CERTIFICATION_ID
      : input.certificationId;

  const config = await getActiveDailyConfig(supabase, certificationId);
  if (!config) {
    return {
      ok: false,
      reason: "no_questions",
      message: "Daily question configuration is not available.",
    };
  }

  const tz = config.delivery_timezone || "UTC";
  const today = calendarDateInTimeZone(new Date(), tz);

  const { count } = await supabase
    .from("daily_question_deliveries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("delivery_date", today);

  const used = count ?? 0;
  if (used >= config.questions_per_day) {
    return {
      ok: true,
      atQuota: true,
      message: `You've completed your ${config.questions_per_day} questions for today.`,
    };
  }

  const pool = await getQuestion(supabase, {
    userId,
    difficulty: DAILY_QUESTION_DEFAULTS.difficultyTier,
    certificationId,
    includeLabs: false,
  });

  if (!pool) {
    return {
      ok: false,
      reason: "no_questions",
      message: "No questions are available yet. Check back later.",
    };
  }

  const { error: insertError } = await supabase.from("daily_question_deliveries").insert({
    user_id: userId,
    question_id: pool.question.id,
    delivery_date: today,
    platform,
  });

  if (insertError) {
    console.error("daily_question_deliveries insert:", insertError);
    return {
      ok: false,
      reason: "no_questions",
      message: "Could not start a daily question. Please try again.",
    };
  }

  const answers: PublicDailyAnswer[] = pool.answers.map((a) => ({
    id: a.id,
    label: a.label,
    text: a.text,
  }));

  return {
    ok: true,
    atQuota: false,
    data: {
      question: {
        id: pool.question.id,
        text: pool.question.text,
        difficulty: pool.question.difficulty,
        topicId: pool.question.topicId,
      },
      answers,
      deliveryDate: today,
      explanation: undefined,
    },
  };
}

/**
 * Records an answer for today's unanswered delivery for this question, then runs core submitAnswer.
 * Continuity and mastery match battles: same `submitAnswer` path (`user_stats`, `user_question_history`,
 * `refreshContinuityAfterQuestionAnswer` on the question's topic).
 */
export async function recordDailyAnswer(
  supabase: SupabaseClient,
  input: RecordDailyAnswerInput,
  certificationIdForDate: string | null
): Promise<RecordDailyAnswerOutput | null> {
  const { userId, questionId, selectedOptionIds, responseMs } = input;

  const certId =
    certificationIdForDate === undefined || certificationIdForDate === null
      ? NETWORK_PLUS_CERTIFICATION_ID
      : certificationIdForDate;

  const config = await getActiveDailyConfig(supabase, certId);
  const tz = config?.delivery_timezone ?? "UTC";
  const today = calendarDateInTimeZone(new Date(), tz);

  const { data: delivery, error: findError } = await supabase
    .from("daily_question_deliveries")
    .select("id")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .eq("delivery_date", today)
    .is("answered_at", null)
    .maybeSingle();

  if (findError || !delivery) return null;

  const result = await submitAnswer(supabase, {
    userId,
    questionId,
    selectedOptionIds,
    responseMs,
  });

  if (!result) return null;

  await supabase
    .from("daily_question_deliveries")
    .update({ answered_at: new Date().toISOString() })
    .eq("id", delivery.id);

  const { data: history } = await supabase
    .from("user_question_history")
    .select("times_seen")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();
  const timesSeenBefore = (history?.times_seen ?? 1) - 1;

  const { data: questionRow } = await supabase
    .from("questions")
    .select("difficulty_tier")
    .eq("id", questionId)
    .single();

  const progression = await applyProgression(supabase, userId, [
    {
      correct: result.correct,
      difficulty: questionRow?.difficulty_tier ?? 3,
      questionId,
      timesSeenBefore,
    },
  ]);

  let studyPath: { domainSlug: string; topicSlug: string } | undefined;
  const topicId = result.updatedStats.topicId;
  const { data: topicRow } = await supabase
    .from("topics")
    .select("slug, domain_id")
    .eq("id", topicId)
    .maybeSingle();
  if (topicRow?.domain_id && topicRow.slug) {
    const { data: dom } = await supabase
      .from("domains")
      .select("slug")
      .eq("id", topicRow.domain_id)
      .maybeSingle();
    if (dom?.slug) {
      studyPath = { domainSlug: dom.slug, topicSlug: topicRow.slug };
    }
  }

  return {
    correct: result.correct,
    explanation: result.explanation,
    updatedStats: {
      topicId: result.updatedStats.topicId,
      correctCount: result.updatedStats.correctCount,
      incorrectCount: result.updatedStats.incorrectCount,
    },
    progression,
    studyPath,
  };
}

/**
 * Updates Slack message timestamp on a delivery row (optional, for chat.update).
 */
export async function setDailyDeliveryMessageTs(
  supabase: SupabaseClient,
  params: {
    userId: string;
    questionId: string;
    deliveryDate: string;
    platformMessageTs: string;
  }
): Promise<void> {
  await supabase
    .from("daily_question_deliveries")
    .update({ platform_message_ts: params.platformMessageTs })
    .eq("user_id", params.userId)
    .eq("question_id", params.questionId)
    .eq("delivery_date", params.deliveryDate);
}
