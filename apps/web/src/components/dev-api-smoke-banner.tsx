"use client";

import { useEffect, useMemo, useState } from "react";
import { DEV_TEST_SLACK_USER_ID } from "@/lib/dev-test-user";

/** Fixed bottom panel in development only: copy-paste curls for quick API checks. */
export function DevApiSmokeBanner() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const script = useMemo(() => {
    if (!origin) return "";
    const u = DEV_TEST_SLACK_USER_ID;
    const startBody = JSON.stringify({
      slackUserId: u,
      slackDisplayName: "Dev",
      battleType: "normal",
    });
    return [
      `# Slack test user: ${u}`,
      `curl -sS "${origin}/api/health"`,
      `curl -sS "${origin}/api/hunts?slackUserId=${encodeURIComponent(u)}"`,
      `curl -sS -X POST "${origin}/api/battle/start" -H "Content-Type: application/json" -d '${startBody}'`,
    ].join("\n");
  }, [origin]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <details className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-900/60 bg-zinc-950/95 text-zinc-200 shadow-[0_-4px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-amber-500/95 hover:bg-zinc-900/80">
        Dev · API smoke ({DEV_TEST_SLACK_USER_ID}) — click to expand
      </summary>
      <div className="max-h-48 overflow-auto border-t border-zinc-800 px-3 py-2">
        <p className="mb-2 text-[11px] text-zinc-500">
          Battles cycle difficulty tiers 1–4 per question step. Run{" "}
          <code className="text-zinc-400">pnpm db:push</code> for migration{" "}
          <code className="text-zinc-400">011</code>. Admin review UI: set{" "}
          <code className="text-zinc-400">ADMIN_API_SECRET</code> in <code className="text-zinc-400">.env.local</code>{" "}
          then open <code className="text-zinc-400">/admin/login</code>.
        </p>
        <pre className="whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-zinc-300">
          {script || "…"}
        </pre>
        <button
          type="button"
          disabled={!script}
          onClick={() => {
            if (!script) return;
            void navigator.clipboard.writeText(script).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="mt-2 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
        >
          {copied ? "Copied" : "Copy all"}
        </button>
      </div>
    </details>
  );
}
