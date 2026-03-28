"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { stashSlackUserFromUrl } from "@/components/session-idle-gate";

/** Persists Slack identity from URL into sessionStorage so idle logout can clear it after 30m. */
export function StashSlackParams() {
  const sp = useSearchParams();
  useEffect(() => {
    const id = sp.get("slack_user_id");
    if (id) stashSlackUserFromUrl(id);
  }, [sp]);
  return null;
}
