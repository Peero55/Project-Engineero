"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SESSION_CONFIG } from "@legendary-hunts/config";

const STORAGE_LAST_ACTIVITY = "lh_last_activity_ms";
const STORAGE_SLACK_USER = "lh_slack_user_id";

/**
 * Clears client-stored identity after SESSION_CONFIG.idleLogoutMs of no pointer/key/touch activity.
 * Does not cap battle pause duration (server-side pause is separate).
 */
export function SessionIdleGate() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bump = useCallback(() => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    try {
      window.sessionStorage.setItem(STORAGE_LAST_ACTIVITY, String(now));
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(STORAGE_SLACK_USER);
      window.sessionStorage.removeItem(STORAGE_LAST_ACTIVITY);
    } catch {
      /* ignore */
    }
    router.replace("/?session_expired=1");
  }, [router]);

  useEffect(() => {
    bump();

    const resetTimer = () => {
      bump();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, SESSION_CONFIG.idleLogoutMs);
    };

    resetTimer();

    const windowEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;
    for (const ev of windowEvents) {
      window.addEventListener(ev, resetTimer, { passive: true });
    }
    document.addEventListener("visibilitychange", resetTimer, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const ev of windowEvents) {
        window.removeEventListener(ev, resetTimer);
      }
      document.removeEventListener("visibilitychange", resetTimer);
    };
  }, [bump, logout]);

  return null;
}

/** Call when establishing Slack identity from URL so idle gate can clear it on timeout */
export function stashSlackUserFromUrl(slackUserId: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_SLACK_USER, slackUserId);
  } catch {
    /* ignore */
  }
}
