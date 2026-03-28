import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import { ATTACK_BY_TIER, DAMAGE_BY_DIFFICULTY } from "@legendary-hunts/config";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations";

const bodySchema = z.object({
  slackUserId: z.string().min(1),
  battleSessionId: uuidSchema,
  questionId: uuidSchema,
  selectedOptionIds: z.array(uuidSchema),
  responseMs: z.number().optional(),
});

/**
 * Submit an answer for a battle turn.
 * Server validates the correct answer from answer_options.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { slackUserId, battleSessionId, questionId, selectedOptionIds } =
      parsed.data;

    const user = await getUserBySlackId(slackUserId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: session } = await supabase
      .from("battle_sessions")
      .select("id, user_id, status, questions_answered")
      .eq("id", battleSessionId)
      .eq("user_id", user.id)
      .single();

    if (!session || session.status !== "active") {
      return NextResponse.json(
        { error: "Invalid or completed battle session" },
        { status: 400 }
      );
    }

    const { data: correctOptions } = await supabase
      .from("answer_options")
      .select("id")
      .eq("question_id", questionId)
      .eq("is_correct", true);

    const correctIds = new Set((correctOptions ?? []).map((o) => o.id));
    const selectedSet = new Set(selectedOptionIds);
    const isCorrect =
      correctIds.size === selectedSet.size &&
      [...correctIds].every((id) => selectedSet.has(id));

    const { data: question } = await supabase
      .from("questions")
      .select("difficulty_tier")
      .eq("id", questionId)
      .single();

    const tier = question?.difficulty_tier ?? 2;
    const chosenAttack =
      tier in ATTACK_BY_TIER
        ? ATTACK_BY_TIER[tier as 1 | 2 | 3 | 4]
        : "ultimate";
    const damageDealt = isCorrect
      ? (DAMAGE_BY_DIFFICULTY[tier] ?? 25)
      : 0;
    const damageTaken = isCorrect ? 0 : 25;

    await supabase.from("battle_turns").insert({
      battle_session_id: battleSessionId,
      question_id: questionId,
      chosen_attack: chosenAttack,
      was_correct: isCorrect,
      damage_dealt: damageDealt,
      damage_taken: damageTaken,
      response_ms: parsed.data.responseMs ?? null,
    });

    await supabase
      .from("battle_sessions")
      .update({
        questions_answered: session.questions_answered + 1,
      })
      .eq("id", battleSessionId);

    return NextResponse.json({
      correct: isCorrect,
      damageDealt,
      damageTaken,
    });
  } catch (e) {
    console.error("battles/answer:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
