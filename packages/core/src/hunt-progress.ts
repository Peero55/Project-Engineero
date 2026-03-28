import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * When a battle linked to a hunt ends, advance hunt progress (separate from battle_sessions).
 */
export async function applyHuntProgressAfterBattleEnd(
  supabase: SupabaseClient,
  userId: string,
  battleId: string,
  outcome: "win" | "loss"
): Promise<void> {
  const { data: battle } = await supabase
    .from("battle_sessions")
    .select("hunt_id, status")
    .eq("id", battleId)
    .eq("user_id", userId)
    .single();

  if (!battle?.hunt_id) return;
  if (battle.status !== "won" && battle.status !== "lost") return;

  const { data: hunt } = await supabase
    .from("hunts")
    .select("required_progress")
    .eq("id", battle.hunt_id)
    .single();

  const { data: progress } = await supabase
    .from("hunt_progress")
    .select("id, progress_points, status")
    .eq("user_id", userId)
    .eq("hunt_id", battle.hunt_id)
    .maybeSingle();

  if (!progress) return;

  const cap = hunt?.required_progress ?? 100;
  const delta = outcome === "win" ? 28 : 6;
  const next = Math.min(progress.progress_points + delta, cap);
  const newStatus =
    next >= cap ? "completed" : progress.status === "completed" ? "completed" : "active";

  await supabase
    .from("hunt_progress")
    .update({
      progress_points: next,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", progress.id);
}
