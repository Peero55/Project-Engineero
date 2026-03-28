import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ENCOUNTER_PUZZLE_WEIGHT,
  NETWORK_PLUS_CERTIFICATION_ID,
  pickEncounterStepCount,
  xpForLevel,
  type BattleTypeKey,
} from "@legendary-hunts/config";
import { getQuestion } from "./question-engine";
import { stripPuzzlePayloadForClient } from "./puzzle-evaluation";

type EncounterInsert = {
  battle_session_id: string;
  user_id: string;
  sequence_index: number;
  encounter_type: "question" | "puzzle_step";
  question_id: string | null;
  puzzle_id: string | null;
  status: "pending" | "active";
  started_at: string | null;
};

/**
 * Build a variable-length list of encounters (question | puzzle_step) and insert them.
 * First row is active; updates battle_sessions.max_questions to the realized count.
 */
export async function generateAndInsertEncounters(
  supabase: SupabaseClient,
  params: {
    battleSessionId: string;
    userId: string;
    battleType: BattleTypeKey;
    certificationId?: string;
    /** If omitted, picks once via {@link pickEncounterStepCount} */
    targetStepCount?: number;
  }
): Promise<{ ok: true; count: number } | { ok: false; message: string }> {
  const certificationId = params.certificationId ?? NETWORK_PLUS_CERTIFICATION_ID;
  const targetSteps =
    params.targetStepCount ?? pickEncounterStepCount(params.battleType);

  const { data: puzzles } = await supabase
    .from("puzzles")
    .select("id")
    .eq("is_active", true);

  const puzzleIds = (puzzles ?? []).map((p) => p.id);

  const rows: EncounterInsert[] = [];
  let attempts = 0;
  const maxAttempts = targetSteps * 10;
  /** Cycles 1–4 so each battle mixes light → medium → heavy → ultimate eligible pools */
  let questionDifficultyCycle = 0;

  while (rows.length < targetSteps && attempts < maxAttempts) {
    attempts += 1;
    const usePuzzle =
      puzzleIds.length > 0 && Math.random() < ENCOUNTER_PUZZLE_WEIGHT;

    if (usePuzzle) {
      const pick = puzzleIds[Math.floor(Math.random() * puzzleIds.length)];
      rows.push({
        battle_session_id: params.battleSessionId,
        user_id: params.userId,
        sequence_index: rows.length,
        encounter_type: "puzzle_step",
        question_id: null,
        puzzle_id: pick,
        status: rows.length === 0 ? "active" : "pending",
        started_at: rows.length === 0 ? new Date().toISOString() : null,
      });
      continue;
    }

    const difficulty = (questionDifficultyCycle % 4) + 1;
    questionDifficultyCycle += 1;

    const pool = await getQuestion(supabase, {
      userId: params.userId,
      difficulty,
      certificationId,
      includeLabs: false,
    });

    if (!pool) {
      if (puzzleIds.length > 0) {
        const pick = puzzleIds[Math.floor(Math.random() * puzzleIds.length)];
        rows.push({
          battle_session_id: params.battleSessionId,
          user_id: params.userId,
          sequence_index: rows.length,
          encounter_type: "puzzle_step",
          question_id: null,
          puzzle_id: pick,
          status: rows.length === 0 ? "active" : "pending",
          started_at: rows.length === 0 ? new Date().toISOString() : null,
        });
      }
      continue;
    }

    rows.push({
      battle_session_id: params.battleSessionId,
      user_id: params.userId,
      sequence_index: rows.length,
      encounter_type: "question",
      question_id: pool.question.id,
      puzzle_id: null,
      status: rows.length === 0 ? "active" : "pending",
      started_at: rows.length === 0 ? new Date().toISOString() : null,
    });
  }

  if (rows.length === 0) {
    return { ok: false, message: "Could not generate any encounters for this battle." };
  }

  const { error: insertErr } = await supabase.from("battle_encounters").insert(rows);
  if (insertErr) {
    console.error("battle_encounters insert:", insertErr);
    return { ok: false, message: insertErr.message };
  }

  const { error: updateErr } = await supabase
    .from("battle_sessions")
    .update({
      max_questions: rows.length,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", params.battleSessionId)
    .eq("user_id", params.userId);

  if (updateErr) {
    console.error("battle_sessions max_questions update:", updateErr);
    return { ok: false, message: updateErr.message };
  }

  return { ok: true, count: rows.length };
}

export type BattleEncounterPresentation = {
  id: string;
  sequenceIndex: number;
  encounterType: "question" | "puzzle_step";
  status: string;
  /** Server clock anchor for per-encounter timeout (GAME_CONFIG.timeoutSeconds) */
  startedAt?: string | null;
  /** Combat tuning tier (1–4) aligned with attack tier */
  difficultyTier?: number;
  /** Topic slug for study links (question encounters) */
  topicSlug?: string;
  /** Domain slug — pairs with topicSlug for canonical study URL */
  domainSlug?: string;
  question?: { id: string; prompt: string };
  /** Multiple-choice options (no correctness flags) */
  options?: Array<{ id: string; label: string; text: string }>;
  puzzle?: {
    id: string;
    title: string;
    layoutKind: string;
    payload: Record<string, unknown>;
  };
};

/** Profile snapshot for battle HUD — neutral field names, theme-agnostic */
export type BattlePlayerView = {
  displayName: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
};

export type BattleSessionView = {
  id: string;
  status: string;
  battleType: string;
  playerHP: number;
  enemyHP: number;
  maxQuestions: number;
  questionsAnswered: number;
  pausedAt: string | null;
  huntId: string | null;
};

export async function fetchBattleSessionForView(
  supabase: SupabaseClient,
  battleId: string,
  userId: string
): Promise<BattleSessionView | null> {
  const { data: b } = await supabase
    .from("battle_sessions")
    .select(
      "id, status, battle_type, player_hp_current, enemy_hp_current, max_questions, questions_answered, paused_at, hunt_id"
    )
    .eq("id", battleId)
    .eq("user_id", userId)
    .single();

  if (!b) return null;

  return {
    id: b.id,
    status: b.status,
    battleType: b.battle_type,
    playerHP: b.player_hp_current ?? 100,
    enemyHP: b.enemy_hp_current ?? 100,
    maxQuestions: b.max_questions,
    questionsAnswered: b.questions_answered ?? 0,
    pausedAt: b.paused_at,
    huntId: b.hunt_id,
  };
}

export async function fetchBattleViewState(
  supabase: SupabaseClient,
  battleId: string,
  userId: string
): Promise<{
  session: BattleSessionView;
  encounters: BattleEncounterPresentation[];
  activeEncounter: BattleEncounterPresentation | null;
  player: BattlePlayerView | null;
} | null> {
  const session = await fetchBattleSessionForView(supabase, battleId, userId);
  if (!session) return null;
  const encounters = await fetchEncountersForBattleStart(supabase, battleId, userId);
  const activeEncounter =
    encounters.find((e) => e.status === "active") ?? null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, level, xp")
    .eq("user_id", userId)
    .maybeSingle();

  let player: BattlePlayerView | null = null;
  if (profile) {
    const level = profile.level ?? 1;
    const xp = profile.xp ?? 0;
    player = {
      displayName: profile.display_name?.trim() || "Traveler",
      level,
      xp,
      xpToNextLevel: xpForLevel(level),
    };
  }

  return { session, encounters, activeEncounter, player };
}

/**
 * Load encounters for a battle with client-safe payloads (puzzle solutions stripped).
 */
export async function fetchEncountersForBattleStart(
  supabase: SupabaseClient,
  battleId: string,
  userId: string
): Promise<BattleEncounterPresentation[]> {
  const { data: rows } = await supabase
    .from("battle_encounters")
    .select("id, sequence_index, encounter_type, question_id, puzzle_id, status, started_at")
    .eq("battle_session_id", battleId)
    .eq("user_id", userId)
    .order("sequence_index", { ascending: true });

  if (!rows?.length) return [];

  const out: BattleEncounterPresentation[] = [];
  for (const r of rows) {
    if (r.encounter_type === "question" && r.question_id) {
      const { data: q } = await supabase
        .from("questions")
        .select("id, prompt, difficulty_tier, topic_id")
        .eq("id", r.question_id)
        .single();
      const { data: opts } = await supabase
        .from("answer_options")
        .select("id, label, option_text, sort_order")
        .eq("question_id", r.question_id)
        .order("sort_order", { ascending: true });
      const options = (opts ?? []).map((o) => ({
        id: o.id,
        label: o.label,
        text: o.option_text,
      }));
      let topicSlug: string | undefined;
      let domainSlug: string | undefined;
      if (q?.topic_id) {
        const { data: topic } = await supabase
          .from("topics")
          .select("slug, domain_id")
          .eq("id", q.topic_id)
          .maybeSingle();
        topicSlug = topic?.slug;
        if (topic?.domain_id) {
          const { data: dom } = await supabase
            .from("domains")
            .select("slug")
            .eq("id", topic.domain_id)
            .maybeSingle();
          domainSlug = dom?.slug;
        }
      }
      out.push({
        id: r.id,
        sequenceIndex: r.sequence_index,
        encounterType: "question",
        status: r.status,
        startedAt: r.started_at,
        difficultyTier: q?.difficulty_tier ?? undefined,
        topicSlug,
        domainSlug,
        question: q
          ? { id: q.id, prompt: q.prompt }
          : { id: r.question_id, prompt: "" },
        options,
      });
    } else if (r.encounter_type === "puzzle_step" && r.puzzle_id) {
      const { data: pz } = await supabase
        .from("puzzles")
        .select("id, title, layout_kind, payload, difficulty_tier")
        .eq("id", r.puzzle_id)
        .single();
      out.push({
        id: r.id,
        sequenceIndex: r.sequence_index,
        encounterType: "puzzle_step",
        status: r.status,
        startedAt: r.started_at,
        difficultyTier: pz?.difficulty_tier ?? undefined,
        puzzle: pz
          ? {
              id: pz.id,
              title: pz.title,
              layoutKind: pz.layout_kind,
              payload: stripPuzzlePayloadForClient(pz.payload),
            }
          : {
              id: r.puzzle_id,
              title: "",
              layoutKind: "ordering",
              payload: {},
            },
      });
    }
  }
  return out;
}
