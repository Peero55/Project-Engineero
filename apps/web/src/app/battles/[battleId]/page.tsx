import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import { fetchBattleViewState } from "@legendary-hunts/core";
import { BattleClient } from "./battle-client";
import { Suspense } from "react";
import { StashSlackParams } from "@/components/stash-slack-params";

type SearchParams = { slack_user_id?: string };

export default async function BattlePage({
  params,
  searchParams,
}: {
  params: Promise<{ battleId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { battleId } = await params;
  const sp = await searchParams;
  const slackUserId = sp.slack_user_id;
  if (!slackUserId) {
    return (
      <main className="lh-fantasy-ui min-h-screen px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <p
            className="muted"
            style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            Battle
          </p>
          <h1
            className="font-display mt-2 text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display), serif", marginBottom: 20 }}
          >
            Learner id required
          </h1>
          <section className="panel panel--dashboard">
            <div className="panel-body">
              <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                Open this encounter from Slack or add{" "}
                <span style={{ color: "var(--gold)", fontFamily: "ui-monospace, monospace", fontSize: "0.85em" }}>
                  ?slack_user_id=…
                </span>{" "}
                to the URL so progress and study links resolve correctly.
              </p>
            </div>
          </section>
          <Link href="/" className="fantasy-stone-link" style={{ display: "inline-block", marginTop: 24 }}>
            Home
          </Link>
        </div>
      </main>
    );
  }

  const user = await getUserBySlackId(slackUserId);
  if (!user) notFound();

  const supabase = createAdminClient();
  const initial = await fetchBattleViewState(supabase, battleId, user.id);
  if (!initial) notFound();

  const slackQ = `slack_user_id=${encodeURIComponent(slackUserId)}`;

  return (
    <main className="lh-fantasy-ui min-h-screen px-4 py-8 sm:px-8">
      <Suspense fallback={null}>
        <StashSlackParams />
      </Suspense>
      <div className="mx-auto max-w-4xl">
        <p className="muted" style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Battle
        </p>
        <h1
          className="font-display mt-1 text-2xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Encounter
        </h1>
        <div className="mt-6">
          <BattleClient battleId={battleId} slackUserId={slackUserId} initial={initial} />
        </div>
        <div className="mt-10 flex flex-wrap gap-6">
          <Link href={`/hunts?${slackQ}`} className="fantasy-stone-link" style={{ marginTop: 0 }}>
            Hunts
          </Link>
          <Link href={`/codex?${slackQ}`} className="fantasy-stone-link" style={{ marginTop: 0 }}>
            Codex
          </Link>
          <Link href={`/dashboard?${slackQ}`} className="fantasy-stone-link" style={{ marginTop: 0 }}>
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
