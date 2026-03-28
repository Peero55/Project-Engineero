import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import { fetchBattleViewState } from "@legendary-hunts/core";

type Params = { params: Promise<{ battleId: string }> };

export async function GET(request: NextRequest, context: Params) {
  try {
    const { battleId } = await context.params;
    const slackUserId = request.nextUrl.searchParams.get("slackUserId");
    if (!slackUserId) {
      return NextResponse.json({ error: "slackUserId query required" }, { status: 400 });
    }

    const user = await getUserBySlackId(slackUserId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const view = await fetchBattleViewState(supabase, battleId, user.id);
    if (!view) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    return NextResponse.json(view);
  } catch (e) {
    console.error("GET /api/battle/[battleId]:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
