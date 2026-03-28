import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateUserBySlackId } from "@/lib/auth";
import { GAME_CONFIG, pickEncounterStepCount } from "@legendary-hunts/config";
import {
  generateAndInsertEncounters,
  fetchEncountersForBattleStart,
} from "@legendary-hunts/core";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations";

const bodySchema = z.object({
  slackUserId: z.string().min(1),
  slackDisplayName: z.string().default("Hunter"),
  huntId: uuidSchema.optional(),
  battleType: z.enum(["daily", "normal", "mini_boss", "legendary"]),
});

/**
 * Start a battle session (encounter-based).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { slackUserId, slackDisplayName, huntId, battleType } = parsed.data;

    const user = await getOrCreateUserBySlackId(slackUserId, slackDisplayName);
    if (!user) {
      return NextResponse.json({ error: "Could not resolve user" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const enemyHp = GAME_CONFIG.maxEnemyHp;
    const stepCount = pickEncounterStepCount(battleType);

    const { data: session, error } = await supabase
      .from("battle_sessions")
      .insert({
        user_id: user.id,
        hunt_id: huntId ?? null,
        battle_type: battleType,
        max_questions: stepCount,
        player_hp_start: GAME_CONFIG.maxPlayerHp,
        player_hp_current: GAME_CONFIG.maxPlayerHp,
        enemy_hp_start: enemyHp,
        enemy_hp_current: enemyHp,
        last_activity_at: new Date().toISOString(),
      })
      .select("id, battle_type, max_questions, status")
      .single();

    if (error || !session) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
    }

    const gen = await generateAndInsertEncounters(supabase, {
      battleSessionId: session.id,
      userId: user.id,
      battleType,
      targetStepCount: stepCount,
    });

    if (!gen.ok) {
      await supabase.from("battle_sessions").delete().eq("id", session.id);
      return NextResponse.json({ error: gen.message }, { status: 500 });
    }

    const encounters = await fetchEncountersForBattleStart(supabase, session.id, user.id);
    const active = encounters.find((e) => e.status === "active");

    const { data: refreshed } = await supabase
      .from("battle_sessions")
      .select("id, battle_type, max_questions, status")
      .eq("id", session.id)
      .single();

    return NextResponse.json({
      battleSession: {
        id: refreshed?.id ?? session.id,
        battleType: refreshed?.battle_type ?? session.battle_type,
        maxQuestions: refreshed?.max_questions ?? session.max_questions,
        state: refreshed?.status ?? session.status,
      },
      encounters,
      activeEncounter: active ?? null,
    });
  } catch (e) {
    console.error("battles/start:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
