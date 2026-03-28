import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import { StashSlackParams } from "@/components/stash-slack-params";
import { FantasyPlayerStatusBar } from "@/components/fantasy/layout/FantasyPlayerStatusBar";
import { Panel } from "@/components/fantasy/ui/Panel";
import { fetchDashboardKnowledgeSnapshot } from "@legendary-hunts/core";

type DashboardSearchParams = {
  slack_user_id?: string;
  question_id?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const p = await searchParams;
  const hasSlack = Boolean(p.slack_user_id);
  const q = p.slack_user_id
    ? `?slack_user_id=${encodeURIComponent(p.slack_user_id)}`
    : "";

  const supabase = createAdminClient();
  let snapshot: Awaited<ReturnType<typeof fetchDashboardKnowledgeSnapshot>> | null = null;
  if (p.slack_user_id) {
    const user = await getUserBySlackId(p.slack_user_id);
    if (user) {
      snapshot = await fetchDashboardKnowledgeSnapshot(supabase, user.id, Date.now(), 8);
    }
  }

  return (
    <main className="lh-fantasy-ui min-h-screen px-4 py-10 sm:px-8">
      <Suspense fallback={null}>
        <StashSlackParams />
      </Suspense>
      <div className="mx-auto max-w-2xl">
        {p.slack_user_id ? <FantasyPlayerStatusBar slackUserId={p.slack_user_id} /> : null}
        <p
          className="muted"
          style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          Legendary Hunts
        </p>
        <h1
          className="font-display mt-2 text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display), serif", marginBottom: 8 }}
        >
          Dashboard
        </h1>
        <p className="muted" style={{ marginBottom: 28, maxWidth: "36rem", lineHeight: 1.55 }}>
          Daily Slack questions and web battles both update the same recall map, codex entries, and study
          unlocks.
        </p>

        {hasSlack && (
          <Panel variant="dashboard" title="Slack link" subtitle="Identity keyed by slack_user_id until full auth lands">
            <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
              Deep links from Slack include your learner id automatically.
            </p>
            {p.question_id ? (
              <p className="muted" style={{ marginTop: 12, fontSize: "0.78rem", fontFamily: "monospace" }}>
                Question context: {p.question_id}
              </p>
            ) : null}
          </Panel>
        )}

        {snapshot && (
          <div style={{ marginTop: 24 }}>
            <Panel
              variant="dashboard"
              title="Codex continuity"
              subtitle="From practice across Slack daily and web encounters"
            >
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "16px 20px",
                  margin: 0,
                }}
              >
                <div>
                  <dt className="muted" style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Discovered topics
                  </dt>
                  <dd
                    style={{
                      margin: "6px 0 0",
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "1.35rem",
                      color: "var(--gold)",
                    }}
                  >
                    {snapshot.continuity.topicsDiscovered}
                  </dd>
                </div>
                <div>
                  <dt className="muted" style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Explanations viewed
                  </dt>
                  <dd
                    style={{
                      margin: "6px 0 0",
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "1.35rem",
                      color: "var(--gold)",
                    }}
                  >
                    {snapshot.continuity.explanationsViewed}
                  </dd>
                </div>
                <div>
                  <dt className="muted" style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Study notes unlocked
                  </dt>
                  <dd
                    style={{
                      margin: "6px 0 0",
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "1.35rem",
                      color: "var(--gold)",
                    }}
                  >
                    {snapshot.continuity.studyNotesUnlocked}
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>
        )}

        {snapshot && snapshot.domains.some((d) => d.totalTopicCount > 0) && (
          <div style={{ marginTop: 24 }}>
            <Panel
              variant="dashboard"
              title="Domain readiness"
              subtitle="Same signal as codex and hunt pages — average over topics you have practiced at least once"
            >
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                {snapshot.domains
                  .filter((d) => d.totalTopicCount > 0)
                  .map((d) => (
                    <li
                      key={d.domainId}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 8,
                        paddingBottom: 12,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span style={{ color: "var(--text)" }}>{d.domainName}</span>
                      <span className="muted" style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.78rem" }}>
                        {d.practicedTopicCount}/{d.totalTopicCount} topics practiced
                        {d.readinessPct != null ? (
                          <>
                            {" "}
                            · readiness <span style={{ color: "var(--gold)" }}>{d.readinessPct}%</span>
                          </>
                        ) : (
                          " · readiness —"
                        )}
                      </span>
                    </li>
                  ))}
              </ul>
            </Panel>
          </div>
        )}

        {snapshot && snapshot.weakest.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Panel
              variant="dashboard"
              title="Weakest topics"
              subtitle="Lowest mastery among topics you have attempted"
            >
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                {snapshot.weakest.map((row) => (
                  <li
                    key={row.topicId}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <Link href={`/explanations/${row.domainSlug}/${row.topicSlug}${q}`} className="fantasy-stone-link">
                      {row.topicName}
                    </Link>
                    <span className="muted" style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.78rem" }}>
                      {Math.round(row.mastery.score01 * 100)}% · ready {Math.round(row.mastery.readiness01 * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={`/codex${q}`} className="fantasy-stone-link" style={{ display: "inline-block", marginTop: 16 }}>
                Open codex →
              </Link>
            </Panel>
          </div>
        )}

        {hasSlack && !snapshot && (
          <p className="muted" style={{ marginTop: 24 }}>
            Unknown user for this slack id.
          </p>
        )}

        {hasSlack && snapshot && snapshot.weakest.length === 0 && (
          <Panel variant="dashboard" title="Recall map" subtitle="Getting started">
            <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
              No topic stats yet — answer daily questions in Slack or battles on the web to populate your recall
              map.
            </p>
          </Panel>
        )}

        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 20 }}>
          <Link href={`/${q}`} className="fantasy-stone-link">
            Home
          </Link>
          <Link href={`/codex${q}`} className="fantasy-stone-link">
            Codex
          </Link>
          <Link
            href={
              p.slack_user_id
                ? `/hunts?slack_user_id=${encodeURIComponent(p.slack_user_id)}`
                : "/hunts"
            }
            className="fantasy-stone-link"
          >
            Hunts
          </Link>
        </div>
      </div>
    </main>
  );
}
