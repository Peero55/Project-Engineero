"use client";

import { useEffect, useState } from "react";
import { GAME_CONFIG } from "@legendary-hunts/config";
import { PlayerInfoBar } from "@/components/fantasy/layout/PlayerInfoBar";

type ProfilePayload = {
  displayName: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentHp: number | null;
  maxHp: number | null;
};

/**
 * Sticky identity + HP + XP for fantasy routes when `slack_user_id` is present.
 * Omit on battle pages — {@link BattleClient} renders its own combat header.
 */
export function FantasyPlayerStatusBar({ slackUserId }: { slackUserId?: string }) {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);

  useEffect(() => {
    if (!slackUserId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/user/profile?slackUserId=${encodeURIComponent(slackUserId)}`
      );
      if (!res.ok) return;
      const json = (await res.json()) as ProfilePayload & { error?: string };
      if (!cancelled && !json.error) setProfile(json);
    })();
    return () => {
      cancelled = true;
    };
  }, [slackUserId]);

  if (!slackUserId || !profile) return null;

  const maxHp = profile.maxHp ?? GAME_CONFIG.maxPlayerHp;
  const hp = profile.currentHp ?? maxHp;

  return (
    <div className="fantasy-player-status-bar">
      <PlayerInfoBar
        name={profile.displayName?.trim() || "Traveler"}
        level={profile.level ?? 1}
        hp={hp}
        maxHp={maxHp}
        xpLabel={`${profile.xp ?? 0} / ${profile.xpToNextLevel} XP`}
      />
    </div>
  );
}
