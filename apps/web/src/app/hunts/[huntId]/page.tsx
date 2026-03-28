import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MapPin, Swords } from "lucide-react";
import { HuntShell } from "@/components/hunt-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import { StashSlackParams } from "@/components/stash-slack-params";
import { StartBattleFromHunt } from "../start-battle-button";
import { fetchDomainTopicSummaries, summarizeDomainReadiness } from "@legendary-hunts/core";

export default async function HuntDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ huntId: string }>;
  searchParams: Promise<{ slack_user_id?: string }>;
}) {
  const { huntId } = await params;
  const sp = await searchParams;
  const slackUserId = sp.slack_user_id;

  const supabase = createAdminClient();
  const { data: hunt } = await supabase
    .from("hunts")
    .select("id, slug, name, description, hunt_type, required_progress, domain_id")
    .eq("id", huntId)
    .single();

  if (!hunt) notFound();

  const { data: domain } = await supabase
    .from("domains")
    .select("name, slug")
    .eq("id", hunt.domain_id)
    .single();

  let progress: { progress_points: number; status: string } | null = null;
  let readinessBreakdown: ReturnType<typeof summarizeDomainReadiness> | null = null;
  if (slackUserId) {
    const user = await getUserBySlackId(slackUserId);
    if (user) {
      const { data: hp } = await supabase
        .from("hunt_progress")
        .select("progress_points, status")
        .eq("user_id", user.id)
        .eq("hunt_id", huntId)
        .maybeSingle();
      if (hp) progress = hp;

      const summaries = await fetchDomainTopicSummaries(supabase, user.id, hunt.domain_id, Date.now());
      readinessBreakdown = summarizeDomainReadiness(summaries);
    }
  }

  const progressPct = progress
    ? Math.min(100, Math.round((progress.progress_points / hunt.required_progress) * 100))
    : 0;

  return (
    <>
      <Suspense fallback={null}>
        <StashSlackParams />
      </Suspense>
      <HuntShell>
        <div className="lh-hunt-panel-hero lh-panel relative overflow-hidden p-6 sm:p-8">
          <div
            className="lh-hunt-hero-glow pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="lh-hunt-text-accent inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {domain?.name ?? "Hunt"}
              </p>
              <h1 className="lh-hunt-text-primary font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {hunt.name}
              </h1>
            </div>
            <div className="lh-hunt-icon-plate flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
              <Swords className="lh-hunt-text-accent h-7 w-7" aria-hidden />
            </div>
          </div>
          {hunt.description && (
            <p className="lh-hunt-text-muted relative mt-5 max-w-2xl text-pretty leading-relaxed">
              {hunt.description}
            </p>
          )}
        </div>

        {slackUserId && readinessBreakdown && readinessBreakdown.totalTopicCount > 0 && (
          <div className="lh-hunt-panel-muted lh-panel mt-6 p-4">
            <p className="lh-hunt-text-primary text-sm font-medium">Hunt readiness (this domain)</p>
            <p className="lh-hunt-text-muted mt-2 text-sm">
              <span className="lh-hunt-text-accent font-mono">
                {readinessBreakdown.practicedTopicCount}/{readinessBreakdown.totalTopicCount}
              </span>{" "}
              topics practiced in{" "}
              <span className="lh-hunt-text-primary">{domain?.name ?? "this domain"}</span>
              {readinessBreakdown.readinessPct != null ? (
                <>
                  . Average readiness across practiced topics:{" "}
                  <span className="lh-hunt-text-accent font-mono">{readinessBreakdown.readinessPct}%</span>
                </>
              ) : (
                <>
                  . Answer at least one question in this domain to unlock a readiness percentage.
                </>
              )}
            </p>
            <p className="lh-hunt-text-muted mt-2 text-xs opacity-90">
              Same readiness aggregation as your dashboard and codex for this domain.
            </p>
          </div>
        )}

        {progress && (
          <div className="lh-panel mt-6 p-5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="lh-hunt-text-muted text-sm font-medium">Path progress</p>
              <p className="lh-hunt-text-accent font-mono text-sm">
                {progress.progress_points} / {hunt.required_progress}
                <span className="lh-hunt-text-muted ml-2 text-xs font-sans">({progress.status})</span>
              </p>
            </div>
            <div className="lh-hunt-progress-track mt-3 h-2 overflow-hidden rounded-full">
              <div
                className="lh-hunt-progress-fill h-full rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-8">
          {slackUserId ? (
            <StartBattleFromHunt huntId={hunt.id} slackUserId={slackUserId} />
          ) : (
            <div className="lh-hunt-text-muted lh-hunt-panel-muted lh-panel p-4 text-sm">
              Add{" "}
              <code className="lh-hunt-text-accent rounded bg-black/40 px-1.5 py-0.5 font-mono">
                ?slack_user_id=…
              </code>{" "}
              to open encounters for this hunt.
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href={
              slackUserId
                ? `/hunts?slack_user_id=${encodeURIComponent(slackUserId)}`
                : "/hunts"
            }
            className="lh-hunt-link text-sm font-medium"
          >
            ← All hunts
          </Link>
          {slackUserId ? (
            <>
              <Link
                href={`/codex?slack_user_id=${encodeURIComponent(slackUserId)}`}
                className="lh-hunt-link text-sm"
              >
                Codex
              </Link>
              <Link
                href={`/dashboard?slack_user_id=${encodeURIComponent(slackUserId)}`}
                className="lh-hunt-link text-sm"
              >
                Dashboard
              </Link>
            </>
          ) : null}
          <Link href="/" className="lh-hunt-text-muted text-sm hover:brightness-125">
            Home
          </Link>
        </div>
      </HuntShell>
    </>
  );
}
