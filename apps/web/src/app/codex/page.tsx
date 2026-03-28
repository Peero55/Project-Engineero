import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import { FantasyPlayerStatusBar } from "@/components/fantasy/layout/FantasyPlayerStatusBar";
import { Panel } from "@/components/fantasy/ui/Panel";
import {
  type DomainReadinessBreakdown,
  fetchDomainTopicSummaries,
  summarizeDomainReadiness,
} from "@legendary-hunts/core";

function formatDomainReadinessLine(r: DomainReadinessBreakdown): string {
  const base = `${r.practicedTopicCount}/${r.totalTopicCount} topics practiced`;
  return r.readinessPct != null ? `${base} · readiness ${r.readinessPct}%` : `${base} · readiness —`;
}

export default async function CodexPage({
  searchParams,
}: {
  searchParams: Promise<{ slack_user_id?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.slack_user_id
    ? `?slack_user_id=${encodeURIComponent(sp.slack_user_id)}`
    : "";

  const supabase = createAdminClient();
  const { data: domains } = await supabase
    .from("domains")
    .select("id, name, slug, sort_order")
    .order("sort_order", { ascending: true });

  const domainIds = (domains ?? []).map((d) => d.id);
  const { data: topics } =
    domainIds.length > 0
      ? await supabase
          .from("topics")
          .select("id, name, slug, domain_id, sort_order")
          .in("domain_id", domainIds)
          .order("sort_order", { ascending: true })
      : { data: [] as { id: string; name: string; slug: string; domain_id: string; sort_order: number }[] };

  const byDomain = new Map<string, NonNullable<typeof topics>>();
  for (const t of topics ?? []) {
    const arr = byDomain.get(t.domain_id) ?? [];
    arr.push(t);
    byDomain.set(t.domain_id, arr);
  }

  const user = sp.slack_user_id ? await getUserBySlackId(sp.slack_user_id) : null;
  const summaryByTopicId = new Map<
    string,
    Awaited<ReturnType<typeof fetchDomainTopicSummaries>>[number]
  >();
  const readinessByDomainId = new Map<string, ReturnType<typeof summarizeDomainReadiness>>();
  if (user) {
    const now = Date.now();
    for (const d of domains ?? []) {
      const sums = await fetchDomainTopicSummaries(supabase, user.id, d.id, now);
      readinessByDomainId.set(d.id, summarizeDomainReadiness(sums));
      for (const s of sums) summaryByTopicId.set(s.topicId, s);
    }
  }

  return (
    <main className="lh-fantasy-ui min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {sp.slack_user_id ? <FantasyPlayerStatusBar slackUserId={sp.slack_user_id} /> : null}
        <p
          className="muted"
          style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          Study
        </p>
        <h1
          className="font-display mt-2 text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display), serif", marginBottom: 24 }}
        >
          Codex
        </h1>

        <Panel
          variant="dashboard"
          title="Topics"
          subtitle={
            user
              ? "Per-topic recall + continuity; domain header uses the same readiness summary as dashboard/hunts"
              : "Add slack_user_id to see your continuity signals"
          }
        >
          <div style={{ display: "grid", gap: 24 }}>
            {(domains ?? []).map((d) => (
              <section key={d.id}>
                <h2 className="panel-title" style={{ fontSize: "1rem", marginBottom: 4 }}>
                  {d.name}
                </h2>
                {user && readinessByDomainId.has(d.id) ? (
                  <p className="muted" style={{ fontSize: "0.78rem", marginBottom: 10 }}>
                    {formatDomainReadinessLine(readinessByDomainId.get(d.id)!)}
                  </p>
                ) : (
                  <div style={{ marginBottom: 10 }} />
                )}
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                  {(byDomain.get(d.id) ?? []).map((t) => {
                    const sum = summaryByTopicId.get(t.id);
                    return (
                      <li key={t.id}>
                        <Link
                          href={`/explanations/${d.slug}/${t.slug}${q}`}
                          className="answer-choice"
                          style={{ textDecoration: "none", color: "inherit", flexWrap: "wrap" }}
                        >
                          <span>{t.name}</span>
                          {sum ? (
                            <span className="muted" style={{ fontSize: "0.75rem", marginLeft: "auto" }}>
                              {sum.aggregates.correctCount + sum.aggregates.incorrectCount > 0
                                ? `${Math.round(sum.mastery.score01 * 100)}%`
                                : "—"}
                              {sum.continuity?.discoveredAt ? " · seen" : ""}
                              {sum.continuity?.explanationLastViewedAt ? " · read" : ""}
                              {sum.continuity?.studyNoteUnlockedAt ? " · note" : ""}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </Panel>

        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 20 }}>
          <Link href={`/${q}`} className="fantasy-stone-link">
            Home
          </Link>
          <Link href={`/dashboard${q}`} className="fantasy-stone-link">
            Dashboard
          </Link>
          <Link
            href={q ? `/hunts${q}` : "/hunts"}
            className="fantasy-stone-link"
          >
            Hunts
          </Link>
        </div>
      </div>
    </main>
  );
}
