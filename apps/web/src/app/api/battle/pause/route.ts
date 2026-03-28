import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import { setBattlePaused } from "@legendary-hunts/core";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations";

const bodySchema = z.object({
  slackUserId: z.string().min(1),
  battleId: uuidSchema,
});

/** Pause is indefinite (no max duration); client may still enforce session idle logout separately. */
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
    const ok = await setBattlePaused(supabase, parsed.data.battleId, user.id, true);
    if (!ok) {
      return NextResponse.json(
        { error: "Could not pause (battle not active or not found)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, paused: true });
  } catch (e) {
    console.error("battle/pause:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
