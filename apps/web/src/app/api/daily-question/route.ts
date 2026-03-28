import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextDailyQuestion } from "@legendary-hunts/core";
import { NETWORK_PLUS_CERTIFICATION_ID } from "@legendary-hunts/config";
import { requireInternalApiAuth } from "@/lib/internal-api";
import { resolveUserForDailyApi } from "@/lib/platform-user";
import { uuidSchema } from "@/lib/validations";

const bodySchema = z.object({
  platformUserId: z.string().min(1),
  platform: z.enum(["slack", "discord", "teams"]),
  certificationId: uuidSchema.nullish(),
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

    const { platformUserId, platform, certificationId, displayName, avatarUrl } = parsed.data;

    const user = await resolveUserForDailyApi(platform, platformUserId, {
      displayName,
      avatarUrl,
    });
    if (!user) {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const certId =
      certificationId === undefined || certificationId === null
        ? NETWORK_PLUS_CERTIFICATION_ID
        : certificationId;

    const result = await getNextDailyQuestion(supabase, {
      userId: user.id,
      certificationId: certId,
      platform,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    if (result.atQuota) {
      return NextResponse.json({
        atQuota: true,
        message: result.message,
      });
    }

    return NextResponse.json({
      question: result.data.question,
      answers: result.data.answers,
      deliveryDate: result.data.deliveryDate,
    });
  } catch (e) {
    console.error("daily-question POST:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
