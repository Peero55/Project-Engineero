import type { SupabaseClient } from "@supabase/supabase-js";
import { DAMAGE_BY_DIFFICULTY } from "@legendary-hunts/config";

/** Remove solution / answer keys before sending puzzle payload to the client */
export function stripPuzzlePayloadForClient(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const p = payload as Record<string, unknown>;
  const { solution, order: _order, ...rest } = p;
  return rest as Record<string, unknown>;
}

export interface PuzzleAnswerPayload {
  /** For layout_kind "ordering": ordered keys matching payload.solution shape */
  order?: string[];
}

/**
 * Evaluate a puzzle_step encounter server-side. No theme-specific wording.
 */
export async function evaluatePuzzleEncounter(
  supabase: SupabaseClient,
  puzzleId: string,
  payload: unknown
): Promise<{ correct: boolean; damageDealt: number; damageTaken: number } | null> {
  const { data: puzzle } = await supabase
    .from("puzzles")
    .select("id, payload, difficulty_tier")
    .eq("id", puzzleId)
    .eq("is_active", true)
    .single();

  if (!puzzle?.payload) return null;

  const tier = puzzle.difficulty_tier ?? 2;
  const baseDamage = DAMAGE_BY_DIFFICULTY[tier] ?? 25;
  const baseTaken = 25;

  const body = payload as PuzzleAnswerPayload;
  const p = puzzle.payload as {
    solution?: string[];
    order?: string[];
  };

  const expected = p.solution ?? p.order;
  if (!expected || !Array.isArray(expected)) {
    return { correct: false, damageDealt: 0, damageTaken: baseTaken };
  }

  const got = body.order;
  if (!got || !Array.isArray(got) || got.length !== expected.length) {
    return { correct: false, damageDealt: 0, damageTaken: baseTaken };
  }

  const correct = got.every((v, i) => v === expected[i]);
  return {
    correct,
    damageDealt: correct ? baseDamage : 0,
    damageTaken: correct ? 0 : baseTaken,
  };
}
