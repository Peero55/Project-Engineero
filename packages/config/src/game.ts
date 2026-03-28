/**
 * Maps difficulty tier (1-4) to attack type for regular battles.
 * Tier 5 is reserved for labs (guided_lab) and uses lab-specific outcome logic.
 */
export const ATTACK_BY_TIER: Record<1 | 2 | 3 | 4, "light" | "medium" | "heavy" | "ultimate"> = {
  1: "light",
  2: "medium",
  3: "heavy",
  4: "ultimate",
};

/**
 * Variable encounter count per battle: pick an integer in [min, max] inclusive when generating a battle.
 * max_* below remain upper caps for legacy and for sizing enemy pressure.
 */
export const ENCOUNTER_STEP_RANGE = {
  daily: { min: 1, max: 5 },
  normal: { min: 3, max: 6 },
  mini_boss: { min: 8, max: 12 },
  legendary: { min: 15, max: 25 },
} as const;

/** Probability a generated step is a puzzle_step when at least one puzzle exists in DB */
export const ENCOUNTER_PUZZLE_WEIGHT = 0.35;

export const GAME_CONFIG = {
  normalBattleMaxQuestions: 4,
  miniBossMaxQuestions: 10,
  legendaryMaxQuestions: 20,
  timeoutSeconds: 20,
  cooldowns: [5, 15, 60], // minutes
  baseDamageDealt: 25,
  baseDamageTaken: 25,
  maxEnemyHp: 100,
  maxPlayerHp: 100,
} as const;

/**
 * Damage dealt per correct answer by difficulty tier.
 * Tier 5 (labs) uses lab-specific rules when implemented.
 */
export const DAMAGE_BY_DIFFICULTY: Record<number, number> = {
  1: 15,
  2: 20,
  3: 25,
  4: 30,
  5: 35,
};

/**
 * XP awarded per correct answer by difficulty tier.
 * Tier 5 (labs) uses lab-specific rules when implemented.
 */
export const XP_BY_DIFFICULTY: Record<number, number> = {
  1: 10,
  2: 20,
  3: 35,
  4: 50,
  5: 75,
};

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export type BattleTypeKey = "daily" | "normal" | "mini_boss" | "legendary";

/**
 * Random encounter count for a battle instance (variable length, not a fixed loop).
 */
export function pickEncounterStepCount(battleType: BattleTypeKey): number {
  const r = ENCOUNTER_STEP_RANGE[battleType];
  const span = r.max - r.min + 1;
  return r.min + Math.floor(Math.random() * span);
}

/** Map DB hunt_type to encounter battle tier selection */
export function mapHuntTypeToBattleType(
  huntType: string
): BattleTypeKey {
  if (huntType === "mini_boss") return "mini_boss";
  if (huntType === "legendary") return "legendary";
  return "normal";
}