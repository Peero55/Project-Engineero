import { NextRequest, NextResponse } from "next/server";
import { xpForLevel } from "@legendary-hunts/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slackUserId = searchParams.get("slackUserId");

    if (!slackUserId) {
      return NextResponse.json(
        { error: "Missing slackUserId" },
        { status: 400 }
      );
    }

    const user = await getUserBySlackId(slackUserId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("level, xp, current_hp, max_hp, display_name")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const level = profile.level ?? 1;
    return NextResponse.json({
      id: user.id,
      slackId: user.slackUserId,
      level,
      xp: profile.xp,
      xpToNextLevel: xpForLevel(level),
      currentHp: profile.current_hp,
      maxHp: profile.max_hp,
      displayName: profile.display_name,
    });
  } catch (e) {
    console.error("user/profile:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
