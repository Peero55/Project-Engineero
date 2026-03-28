/**
 * Default certification for daily Slack quiz (Network+ seed in migration 007).
 */
export const NETWORK_PLUS_CERTIFICATION_ID = "11111111-1111-4111-8111-111111111101";

export const DAILY_QUESTION_DEFAULTS = {
  questionsPerDay: 5,
  /** Medium difficulty for daily study flow (tiers 1–4 only; no labs). */
  difficultyTier: 2 as const,
} as const;
