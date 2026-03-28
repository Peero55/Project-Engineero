import type { SupabaseClient } from "@supabase/supabase-js";
import { GAME_CONFIG } from "@legendary-hunts/config";
import type { BattleStateSnapshot, BattleResult } from "@legendary-hunts/types";

export interface AnswerResultInput {
  correct: boolean;
  damageDealt: number;
  damageTaken: number;
}

/**
 * Legacy path: increment turn count without encounter rows (older battles).
 * Prefer {@link processEncounterResolution} when battle_encounters exist.
 */
export async function processBattleTurn(
  supabase: SupabaseClient,
  battleId: string,
  userId: string,
  answerResult: AnswerResultInput
): Promise<BattleStateSnapshot | null> {
  const { data: battle } = await supabase
    .from("battle_sessions")
    .select(
      "id, user_id, status, questions_answered, max_questions, enemy_hp_current, player_hp_current, enemy_hp_start, paused_at"
    )
    .eq("id", battleId)
    .eq("user_id", userId)
    .single();

  if (!battle || battle.status !== "active") return null;
  if (battle.paused_at) return null;

  let enemyHp = battle.enemy_hp_current ?? battle.enemy_hp_start ?? GAME_CONFIG.maxEnemyHp;
  let playerHp = battle.player_hp_current ?? GAME_CONFIG.maxPlayerHp;

  enemyHp = Math.max(0, enemyHp - answerResult.damageDealt);
  playerHp = Math.max(0, playerHp - answerResult.damageTaken);

  const questionsAnswered = battle.questions_answered + 1;
  const maxQuestions = battle.max_questions ?? GAME_CONFIG.normalBattleMaxQuestions;

  let newStatus: "active" | "won" | "lost" = "active";
  if (playerHp <= 0) {
    newStatus = "lost";
  } else if (enemyHp <= 0 || questionsAnswered >= maxQuestions) {
    newStatus = enemyHp <= 0 ? "won" : "lost";
  }

  await supabase
    .from("battle_sessions")
    .update({
      questions_answered: questionsAnswered,
      enemy_hp_current: enemyHp,
      player_hp_current: playerHp,
      status: newStatus,
      completed_at: newStatus !== "active" ? new Date().toISOString() : null,
      player_hp_end: newStatus !== "active" ? playerHp : null,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", battleId);

  const result: BattleResult =
    newStatus === "won" ? "win" : newStatus === "lost" ? "loss" : "ongoing";

  return {
    battleId,
    battleState: newStatus,
    playerHP: playerHp,
    enemyHP: enemyHp,
    result,
    questionsAnswered,
    maxQuestions,
  };
}

/**
 * Resolve the active encounter: apply HP, complete row, activate next, evaluate terminal state.
 */
export async function processEncounterResolution(
  supabase: SupabaseClient,
  battleId: string,
  userId: string,
  encounterId: string,
  answerResult: AnswerResultInput
): Promise<BattleStateSnapshot | null> {
  const { data: battle } = await supabase
    .from("battle_sessions")
    .select(
      "id, user_id, status, questions_answered, max_questions, enemy_hp_current, player_hp_current, enemy_hp_start, paused_at"
    )
    .eq("id", battleId)
    .eq("user_id", userId)
    .single();

  if (!battle || battle.status !== "active") return null;
  if (battle.paused_at) return null;

  const { data: enc } = await supabase
    .from("battle_encounters")
    .select("id, status")
    .eq("id", encounterId)
    .eq("battle_session_id", battleId)
    .eq("user_id", userId)
    .single();

  if (!enc || enc.status !== "active") return null;

  let enemyHp = battle.enemy_hp_current ?? battle.enemy_hp_start ?? GAME_CONFIG.maxEnemyHp;
  let playerHp = battle.player_hp_current ?? GAME_CONFIG.maxPlayerHp;

  enemyHp = Math.max(0, enemyHp - answerResult.damageDealt);
  playerHp = Math.max(0, playerHp - answerResult.damageTaken);

  const questionsAnswered = battle.questions_answered + 1;
  const maxQuestions = battle.max_questions ?? GAME_CONFIG.normalBattleMaxQuestions;

  await supabase
    .from("battle_encounters")
    .update({
      status: "completed",
      was_correct: answerResult.correct,
      damage_dealt: answerResult.damageDealt,
      damage_taken: answerResult.damageTaken,
      completed_at: new Date().toISOString(),
    })
    .eq("id", encounterId);

  const { data: nextList } = await supabase
    .from("battle_encounters")
    .select("id")
    .eq("battle_session_id", battleId)
    .eq("status", "pending")
    .order("sequence_index", { ascending: true })
    .limit(1);

  const nextPending = nextList?.[0] ?? null;

  if (nextPending) {
    await supabase
      .from("battle_encounters")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
      })
      .eq("id", nextPending.id);
  }

  let newStatus: "active" | "won" | "lost" = "active";
  if (playerHp <= 0) {
    newStatus = "lost";
  } else if (enemyHp <= 0) {
    newStatus = "won";
  } else if (!nextPending) {
    newStatus = "lost";
  }

  await supabase
    .from("battle_sessions")
    .update({
      questions_answered: questionsAnswered,
      enemy_hp_current: enemyHp,
      player_hp_current: playerHp,
      status: newStatus,
      completed_at: newStatus !== "active" ? new Date().toISOString() : null,
      player_hp_end: newStatus !== "active" ? playerHp : null,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", battleId);

  const result: BattleResult =
    newStatus === "won" ? "win" : newStatus === "lost" ? "loss" : "ongoing";

  return {
    battleId,
    battleState: newStatus,
    playerHP: playerHp,
    enemyHP: enemyHp,
    result,
    questionsAnswered,
    maxQuestions,
  };
}

export async function setBattlePaused(
  supabase: SupabaseClient,
  battleId: string,
  userId: string,
  paused: boolean
): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("battle_sessions")
    .update(
      paused
        ? {
            status: "paused",
            paused_at: now,
            last_activity_at: now,
          }
        : {
            status: "active",
            paused_at: null,
            last_activity_at: now,
          }
    )
    .eq("id", battleId)
    .eq("user_id", userId)
    .eq("status", paused ? "active" : "paused");

  return !error;
}

export async function battleHasEncounters(
  supabase: SupabaseClient,
  battleId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("battle_encounters")
    .select("*", { count: "exact", head: true })
    .eq("battle_session_id", battleId);

  return (count ?? 0) > 0;
}

/** Reset `started_at` on the active encounter so pause/resume does not consume the answer timer. */
export async function refreshActiveEncounterStartedAt(
  supabase: SupabaseClient,
  battleId: string,
  userId: string
): Promise<void> {
  const { data: active } = await supabase
    .from("battle_encounters")
    .select("id")
    .eq("battle_session_id", battleId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!active) return;

  await supabase
    .from("battle_encounters")
    .update({ started_at: new Date().toISOString() })
    .eq("id", active.id);
}
