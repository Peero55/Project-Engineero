import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateUserBySlackId } from "@/lib/auth";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations";

const bodySchema = z.object({
  slackUserId: z.string().min(1),
  slackDisplayName: z.string().default("Hunter"),
  huntId: uuidSchema,
});

/**
 * Start or resume a hunt.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { slackUserId, slackDisplayName, huntId } = parsed.data;

    const user = await getOrCreateUserBySlackId(
      slackUserId,
      slackDisplayName
    );
    if (!user) {
      return NextResponse.json({ error: "Could not resolve user" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("hunt_progress")
      .select("id, status, progress_points")
      .eq("user_id", user.id)
      .eq("hunt_id", huntId)
      .single();

    if (existing) {
      return NextResponse.json({
        huntProgress: existing,
        started: false,
      });
    }

    const { data: progress, error } = await supabase
      .from("hunt_progress")
      .insert({
        user_id: user.id,
        hunt_id: huntId,
        status: "active",
        progress_points: 0,
      })
      .select("id, status, progress_points")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      huntProgress: progress,
      started: true,
    });
  } catch (e) {
    console.error("hunts/start:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
