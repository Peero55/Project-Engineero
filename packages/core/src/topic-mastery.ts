/**
 * Topic-level mastery (0–1) from aggregate stats and practice history.
 * Theme-free; presentation lives in apps/web.
 */

export type TopicMasteryAggregates = {
  correctCount: number;
  incorrectCount: number;
  /** Topic-level average response time from user_stats (ms) */
  avgResponseMs: number | null;
  /** Average times_seen across questions in this topic the user has touched */
  avgQuestionExposure: number;
  /** Most recent practice instant in this topic (from question history), ISO */
  lastPracticedAtIso: string | null;
};

export type TopicMasteryResult = {
  /** 0–1 composite score */
  score01: number;
  /** Same as score01; reserved for future “challenge readiness” tweaks */
  readiness01: number;
};

const RECENCY_DECAY_PER_DAY = 0.06;
const TARGET_RESPONSE_MS = 12_000;
const RESPONSE_SPREAD_MS = 18_000;

/** Unlock deep study note when mastery reaches this or {@link STUDY_NOTE_MIN_CORRECT} correct */
export const STUDY_NOTE_MASTERY_THRESHOLD = 0.42;
export const STUDY_NOTE_MIN_CORRECT = 2;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Blend accuracy, recency of practice, repetition exposure, and response timing.
 */
export function computeTopicMastery(
  input: TopicMasteryAggregates,
  nowMs: number
): TopicMasteryResult {
  const attempts = input.correctCount + input.incorrectCount;
  const accuracy01 = attempts > 0 ? input.correctCount / attempts : 0;

  let recency01 = 0.35;
  if (input.lastPracticedAtIso) {
    const last = new Date(input.lastPracticedAtIso).getTime();
    const days = Math.max(0, (nowMs - last) / (86_400_000));
    recency01 = Math.exp(-RECENCY_DECAY_PER_DAY * days);
  }

  const overExposure = Math.max(0, input.avgQuestionExposure - 1);
  const repetition01 = 1 / (1 + 0.22 * overExposure);

  let speed01 = 0.55;
  if (input.avgResponseMs != null && attempts > 0) {
    const raw = 1 - (input.avgResponseMs - 4_000) / RESPONSE_SPREAD_MS;
    speed01 = clamp01(raw);
  }

  const score01 = clamp01(
    0.48 * accuracy01 +
      0.26 * recency01 +
      0.18 * repetition01 +
      0.08 * speed01
  );

  const readinessBoost =
    attempts >= 4 && accuracy01 >= 0.65 ? 0.04 : attempts >= 8 && accuracy01 >= 0.55 ? 0.03 : 0;

  const readiness01 = clamp01(score01 + readinessBoost);

  return { score01, readiness01 };
}
