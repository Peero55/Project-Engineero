import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import { getQuestion } from "@legendary-hunts/core";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations";

const querySchema = z.object({
  slackUserId: z.string().min(1),
  difficulty: z.coerce.number().min(1).max(5).default(3),
  topicId: uuidSchema.nullish(),
  certificationId: uuidSchema.nullish(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      slackUserId: searchParams.get("slackUserId"),
      difficulty: searchParams.get("difficulty"),
      topicId: searchParams.get("topicId") ?? undefined,
      certificationId: searchParams.get("certificationId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const user = await getUserBySlackId(parsed.data.slackUserId!);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const result = await getQuestion(supabase, {
      userId: user.id,
      difficulty: parsed.data.difficulty,
      topicId: parsed.data.topicId ?? null,
      certificationId: parsed.data.certificationId ?? null,
    });

    if (!result) {
      return NextResponse.json({ error: "No question available" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("question:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
