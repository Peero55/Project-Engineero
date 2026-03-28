import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { setDailyDeliveryMessageTs } from "@legendary-hunts/core";
import { requireInternalApiAuth } from "@/lib/internal-api";
import { resolveUserForDailyApi } from "@/lib/platform-user";

const bodySchema = z.object({
  platformUserId: z.string().min(1),
  platform: z.enum(["slack", "discord", "teams"]),
  questionId: z.string().uuid(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  platformMessageTs: z.string().min(1),
  displayName: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * After posting the Block Kit message, the Slack adapter stores message ts for chat.update.
 */
export async function POST(request: NextRequest) {
  const authError = requireInternalApiAuth(request);
  if (authError) return authError;

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { platformUserId, platform, questionId, deliveryDate, platformMessageTs, displayName, avatarUrl } =
      parsed.data;

    const user = await resolveUserForDailyApi(platform, platformUserId, {
      displayName,
      avatarUrl,
    });
    if (!user) {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 401 });
    }

    const supabase = createAdminClient();
    await setDailyDeliveryMessageTs(supabase, {
      userId: user.id,
      questionId,
      deliveryDate,
      platformMessageTs,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("daily-question/message-ts POST:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
