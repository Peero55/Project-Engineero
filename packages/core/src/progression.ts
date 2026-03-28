import type { SupabaseClient } from "@supabase/supabase-js";
import { XP_BY_DIFFICULTY, xpForLevel } from "@legendary-hunts/config";

export interface BattleResultForProgression {
  correct: boolean;
  difficulty: number;
  questionId: string;
  timesSeenBefore: number;
}

const REPETITION_PENALTY = 0.7;

/**
 * applyProgression(userId, battleResult)
 * - XP based on: difficulty, correctness, repetition penalty
 * - Level scaling exponential
 */
export async function applyProgression(
  supabase: SupabaseClient,
  userId: string,
  results: BattleResultForProgression[]
): Promise<{ level: number; xp: number; xpGained: number }> {
  let xpGained = 0;

  for (const r of results) {
    const baseXp = XP_BY_DIFFICULTY[r.difficulty] ?? 20;
    const correctnessMultiplier = r.correct ? 1 : 0.25;
    const repetitionMultiplier =
      r.timesSeenBefore > 0 ? Math.pow(REPETITION_PENALTY, r.timesSeenBefore) : 1;
    xpGained += Math.floor(baseXp * correctnessMultiplier * repetitionMultiplier);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("level, xp")
    .eq("user_id", userId)
    .single();

  if (!profile) return { level: 1, xp: 0, xpGained };

  let level = profile.level ?? 1;
  let xp = (profile.xp ?? 0) + xpGained;

  while (level < 99 && xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
  }

  await supabase
    .from("profiles")
    .update({ level, xp, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { level, xp, xpGained };
}
