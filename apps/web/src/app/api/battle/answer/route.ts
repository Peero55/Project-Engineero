import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import {
  submitAnswer,
  processBattleTurn,
  processEncounterResolution,
  battleHasEncounters,
  evaluatePuzzleEncounter,
  applyProgression,
  applyHuntProgressAfterBattleEnd,
  fetchEncountersForBattleStart,
} from "@legendary-hunts/core";
import { ATTACK_BY_TIER, GAME_CONFIG } from "@legendary-hunts/config";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations";

const bodySchema = z
  .object({
    slackUserId: z.string().min(1),
    battleId: uuidSchema,
    encounterId: uuidSchema.optional(),
    responseMs: z.number().min(0).default(0),
    questionId: uuidSchema.optional(),
    selectedOptionIds: z.array(uuidSchema).optional(),
    puzzlePayload: z.unknown().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.puzzlePayload !== undefined && data.selectedOptionIds !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Send either puzzlePayload or selectedOptionIds, not both.",
      });
    }
  });

const PUZZLE_TIMEOUT_DAMAGE_TAKEN = 25;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const user = await getUserBySlackId(parsed.data.slackUserId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const battleId = parsed.data.battleId;
    const hasEnc = await battleHasEncounters(supabase, battleId);
    const timeoutMs = GAME_CONFIG.timeoutSeconds * 1000;

    if (hasEnc) {
      if (!parsed.data.encounterId) {
        return NextResponse.json(
          { error: "encounterId is required for this battle" },
          { status: 400 }
        );
      }

      const { data: enc } = await supabase
        .from("battle_encounters")
        .select("id, encounter_type, question_id, puzzle_id, status, started_at")
        .eq("id", parsed.data.encounterId)
        .eq("battle_session_id", battleId)
        .eq("user_id", user.id)
        .single();

      if (!enc || enc.status !== "active") {
        return NextResponse.json({ error: "Invalid or inactive encounter" }, { status: 400 });
      }

      const elapsedMs = enc.started_at
        ? Date.now() - new Date(enc.started_at).getTime()
        : 0;
      const timedOut = Boolean(enc.started_at && elapsedMs > timeoutMs);

      let damageDealt = 0;
      let damageTaken = 0;
      let correct = false;
      let explanation: string | undefined;
      let updatedStats: unknown;

      if (enc.encounter_type === "question") {
        if (!parsed.data.questionId || !parsed.data.selectedOptionIds) {
          return NextResponse.json(
            { error: "questionId and selectedOptionIds required for question encounter" },
            { status: 400 }
          );
        }
        if (parsed.data.questionId !== enc.question_id) {
          return NextResponse.json({ error: "questionId does not match encounter" }, { status: 400 });
        }

        const answerResult = await submitAnswer(supabase, {
          userId: user.id,
          questionId: parsed.data.questionId,
          selectedOptionIds: parsed.data.selectedOptionIds,
          responseMs: parsed.data.responseMs,
          timedOut,
        });

        if (!answerResult) {
          return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }
        correct = answerResult.correct;
        damageDealt = answerResult.damageDealt;
        damageTaken = answerResult.damageTaken;
        explanation = answerResult.explanation;
        updatedStats = answerResult.updatedStats;
      } else {
        if (timedOut) {
          correct = false;
          damageDealt = 0;
          damageTaken = PUZZLE_TIMEOUT_DAMAGE_TAKEN;
        } else {
          if (parsed.data.puzzlePayload === undefined) {
            return NextResponse.json(
              { error: "puzzlePayload required for puzzle encounter" },
              { status: 400 }
            );
          }
          if (!enc.puzzle_id) {
            return NextResponse.json({ error: "Encounter has no puzzle" }, { status: 400 });
          }
          const pe = await evaluatePuzzleEncounter(
            supabase,
            enc.puzzle_id,
            parsed.data.puzzlePayload
          );
          if (!pe) {
            return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
          }
          correct = pe.correct;
          damageDealt = pe.damageDealt;
          damageTaken = pe.damageTaken;
        }
      }

      let timesSeenBefore = 0;
      if (enc.question_id) {
        const { data: history } = await supabase
          .from("user_question_history")
          .select("times_seen")
          .eq("user_id", user.id)
          .eq("question_id", enc.question_id)
          .maybeSingle();
        timesSeenBefore = (history?.times_seen ?? 1) - 1;
      }

      const battleSnapshot = await processEncounterResolution(supabase, battleId, user.id, enc.id, {
        correct,
        damageDealt,
        damageTaken,
      });

      if (!battleSnapshot) {
        return NextResponse.json(
          { error: "Battle not active, paused, or could not resolve" },
          { status: 400 }
        );
      }

      if (battleSnapshot.result !== "ongoing") {
        await applyHuntProgressAfterBattleEnd(
          supabase,
          user.id,
          battleId,
          battleSnapshot.result === "win" ? "win" : "loss"
        );
      }

      let progression: Awaited<ReturnType<typeof applyProgression>> | null = null;
      if (enc.encounter_type === "question" && enc.question_id) {
        const { data: question } = await supabase
          .from("questions")
          .select("difficulty_tier")
          .eq("id", enc.question_id)
          .single();

        progression = await applyProgression(supabase, user.id, [
          {
            correct: timedOut ? false : correct,
            difficulty: question?.difficulty_tier ?? 3,
            questionId: enc.question_id,
            timesSeenBefore,
          },
        ]);
      }

      let tier = 2;
      if (enc.encounter_type === "question" && enc.question_id) {
        const { data: qrow } = await supabase
          .from("questions")
          .select("difficulty_tier")
          .eq("id", enc.question_id)
          .single();
        tier = qrow?.difficulty_tier ?? 2;
      } else if (enc.puzzle_id) {
        const { data: prow } = await supabase
          .from("puzzles")
          .select("difficulty_tier")
          .eq("id", enc.puzzle_id)
          .single();
        tier = prow?.difficulty_tier ?? 2;
      }

      const chosenAttack =
        tier >= 1 && tier <= 4 && tier in ATTACK_BY_TIER
          ? ATTACK_BY_TIER[tier as 1 | 2 | 3 | 4]
          : "medium";

      await supabase.from("battle_turns").insert({
        battle_session_id: battleId,
        battle_encounter_id: enc.id,
        question_id: enc.question_id,
        chosen_attack: chosenAttack,
        was_correct: correct,
        damage_dealt: damageDealt,
        damage_taken: damageTaken,
        response_ms: parsed.data.responseMs,
      });

      const encounters = await fetchEncountersForBattleStart(supabase, battleId, user.id);
      const activeEncounter = encounters.find((e) => e.status === "active") ?? null;

      return NextResponse.json({
        correct,
        timedOut,
        damageDealt,
        damageTaken,
        explanation,
        updatedStats,
        battleState: battleSnapshot,
        progression,
        encounters,
        activeEncounter,
      });
    }

    if (!parsed.data.questionId || !parsed.data.selectedOptionIds) {
      return NextResponse.json(
        { error: "questionId and selectedOptionIds required" },
        { status: 400 }
      );
    }

    const { data: history } = await supabase
      .from("user_question_history")
      .select("times_seen")
      .eq("user_id", user.id)
      .eq("question_id", parsed.data.questionId)
      .single();
    const timesSeenBefore = (history?.times_seen ?? 1) - 1;

    const answerResult = await submitAnswer(supabase, {
      userId: user.id,
      questionId: parsed.data.questionId,
      selectedOptionIds: parsed.data.selectedOptionIds,
      responseMs: parsed.data.responseMs,
    });

    if (!answerResult) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const battleSnapshot = await processBattleTurn(supabase, battleId, user.id, {
      correct: answerResult.correct,
      damageDealt: answerResult.damageDealt,
      damageTaken: answerResult.damageTaken,
    });

    if (!battleSnapshot) {
      return NextResponse.json({ error: "Invalid battle" }, { status: 400 });
    }

    if (battleSnapshot.result !== "ongoing") {
      await applyHuntProgressAfterBattleEnd(
        supabase,
        user.id,
        battleId,
        battleSnapshot.result === "win" ? "win" : "loss"
      );
    }

    const { data: question } = await supabase
      .from("questions")
      .select("difficulty_tier")
      .eq("id", parsed.data.questionId)
      .single();

    const tier = question?.difficulty_tier ?? 2;
    const chosenAttack =
      tier in ATTACK_BY_TIER ? ATTACK_BY_TIER[tier as 1 | 2 | 3 | 4] : "ultimate";

    const progression = await applyProgression(supabase, user.id, [
      {
        correct: answerResult.correct,
        difficulty: question?.difficulty_tier ?? 3,
        questionId: parsed.data.questionId,
        timesSeenBefore,
      },
    ]);

    await supabase.from("battle_turns").insert({
      battle_session_id: battleId,
      question_id: parsed.data.questionId,
      chosen_attack: chosenAttack,
      was_correct: answerResult.correct,
      damage_dealt: answerResult.damageDealt,
      damage_taken: answerResult.damageTaken,
      response_ms: parsed.data.responseMs,
    });

    return NextResponse.json({
      correct: answerResult.correct,
      timedOut: false,
      damageDealt: answerResult.damageDealt,
      damageTaken: answerResult.damageTaken,
      explanation: answerResult.explanation,
      updatedStats: answerResult.updatedStats,
      battleState: battleSnapshot,
      progression,
    });
  } catch (e) {
    console.error("battle/answer:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
