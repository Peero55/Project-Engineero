import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordDailyAnswer } from "@legendary-hunts/core";
import { NETWORK_PLUS_CERTIFICATION_ID } from "@legendary-hunts/config";
import { requireInternalApiAuth } from "@/lib/internal-api";
import { resolveUserForDailyApi } from "@/lib/platform-user";
import { uuidSchema } from "@/lib/validations";

const bodySchema = z.object({
  platformUserId: z.string().min(1),
  platform: z.enum(["slack", "discord", "teams"]),
  certificationId: uuidSchema.nullish(),
  questionId: uuidSchema,
  selectedOptionIds: z.array(uuidSchema).default([]),
  responseMs: z.number().int().min(0).max(3_600_000).default(0),
  displayName: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const authError = requireInternalApiAuth(request);
  if (authError) return authError;

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const {
      platformUserId,
      platform,
      certificationId,
      questionId,
      selectedOptionIds,
      responseMs,
      displayName,
      avatarUrl,
    } = parsed.data;

    const user = await resolveUserForDailyApi(platform, platformUserId, {
      displayName,
      avatarUrl,
    });
    if (!user) {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 401 });
    }

    const certId =
      certificationId === undefined || certificationId === null
        ? NETWORK_PLUS_CERTIFICATION_ID
        : certificationId;

    const supabase = createAdminClient();
    const result = await recordDailyAnswer(
      supabase,
      {
        userId: user.id,
        questionId,
        selectedOptionIds,
        responseMs,
      },
      certId
    );

    if (!result) {
      return NextResponse.json(
        { error: "No pending daily question for this item, or invalid question." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      correct: result.correct,
      explanation: result.explanation,
      studyPath: result.studyPath,
      progression: result.progression,
    });
  } catch (e) {
    console.error("daily-question/answer POST:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
