/**
 * Phase 0 foundation lock — typed constants for the MVP loop and structure.
 * Docs: docs/PHASE0_FOUNDATION_LOCK.md
 */

/** Ordered stages of the player journey (marketing + systems alignment). */
export const CORE_LOOP_STAGES = [
  "daily_slack",
  "encounter_web",
  "mini_boss_web",
  "legendary_web",
  "mastery_web",
] as const;

export type CoreLoopStage = (typeof CORE_LOOP_STAGES)[number];

/** Canonical encounter lengths from PROJECT_SYNOPSIS (templates, not fixed step counts everywhere). */
export const MVP_STRUCTURE = {
  dailyQuestionsPerDay: 5,
  encounterQuestionCount: 4,
  miniBossQuestionCount: 10,
  legendaryQuestionCount: 20,
} as const;

/** Defeat / end states for web battles (extend in later phases). */
export const BATTLE_END_STATES = ["victory", "defeat", "retreated"] as const;
export type BattleEndState = (typeof BATTLE_END_STATES)[number];

/** MVP boundaries (string keys for logging and config). */
export const MVP_EXCLUDED = [
  "pvp",
  "advanced_labs_primary_loop",
  "animation_first_delivery",
] as const;
