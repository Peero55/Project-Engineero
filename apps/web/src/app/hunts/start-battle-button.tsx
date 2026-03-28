"use client";

import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { useState } from "react";

export function StartBattleFromHunt({
  huntId,
  slackUserId,
}: {
  huntId: string;
  slackUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/battle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slackUserId,
          huntId,
          slackDisplayName: "Hunter",
        }),
      });
      const json = (await res.json()) as { error?: string; battle?: { id: string } };
      if (!res.ok || !json.battle?.id) {
        const raw = json.error ?? "Could not start battle";
        const friendly =
          raw.includes("last_activity_at") || raw.includes("schema cache")
            ? "Battle database is out of date — apply migration 010 (battle encounters) to your Supabase project, then retry."
            : raw;
        setErr(friendly);
        return;
      }
      router.push(
        `/battles/${json.battle.id}?slack_user_id=${encodeURIComponent(slackUserId)}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {err && (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={start}
        className="lh-hunt-primary-button inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition disabled:opacity-50"
      >
        <Swords className="h-5 w-5" aria-hidden />
        {loading ? "Starting encounter run…" : "Begin encounter run"}
      </button>
      <p className="lh-hunt-text-muted text-xs">
        Opens the battle screen: questions and puzzles in one continuous flow.
      </p>
    </div>
  );
}
