import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";
import { FantasyPlayerStatusBar } from "@/components/fantasy/layout/FantasyPlayerStatusBar";
import { Panel } from "@/components/fantasy/ui/Panel";
import {
  computeTopicMastery,
  fetchTopicPracticeAggregates,
  recordTopicExplanationViewed,
  selectStudyExplanationForTopic,
} from "@legendary-hunts/core";

export default async function TopicExplanationPage({
  params,
  searchParams,
}: {
  params: Promise<{ domainSlug: string; topicSlug: string }>;
  searchParams: Promise<{ slack_user_id?: string }>;
}) {
  const { domainSlug, topicSlug } = await params;
  const sp = await searchParams;
  const q = sp.slack_user_id
    ? `?slack_user_id=${encodeURIComponent(sp.slack_user_id)}`
    : "";

  const supabase = createAdminClient();
  const { data: domain } = await supabase
    .from("domains")
    .select("id, name, slug")
    .eq("slug", domainSlug)
    .maybeSingle();

  if (!domain) notFound();

  const { data: topic } = await supabase
    .from("topics")
    .select("id, name, slug, summary, domain_id")
    .eq("slug", topicSlug)
    .eq("domain_id", domain.id)
    .maybeSingle();

  if (!topic) notFound();

  const slackUserId = sp.slack_user_id;
  let studyPick: Awaited<ReturnType<typeof selectStudyExplanationForTopic>> = null;
  let masteryPct: number | null = null;
  let noteUnlocked = false;
  let viewedBefore = false;

  if (slackUserId) {
    const user = await getUserBySlackId(slackUserId);
    if (user) {
      const { data: prior } = await supabase
        .from("user_topic_continuity")
        .select("explanation_last_viewed_at, study_note_unlocked_at")
        .eq("user_id", user.id)
        .eq("topic_id", topic.id)
        .maybeSingle();
      viewedBefore = Boolean(prior?.explanation_last_viewed_at);
      noteUnlocked = Boolean(prior?.study_note_unlocked_at);

      await recordTopicExplanationViewed(supabase, user.id, topic.id);
      studyPick = await selectStudyExplanationForTopic(supabase, user.id, topic.id);

      const { data: stat } = await supabase
        .from("user_stats")
        .select("correct_count, incorrect_count, total_response_ms")
        .eq("user_id", user.id)
        .eq("topic_id", topic.id)
        .maybeSingle();

      const correctCount = stat?.correct_count ?? 0;
      const incorrectCount = stat?.incorrect_count ?? 0;
      const attempts = correctCount + incorrectCount;
      const avgTimeMs =
        attempts > 0 && stat?.total_response_ms != null
          ? Math.round(Number(stat.total_response_ms) / attempts)
          : null;

      const { avgQuestionExposure, lastPracticedAtIso } = await fetchTopicPracticeAggregates(
        supabase,
        user.id,
        topic.id
      );

      const { score01 } = computeTopicMastery(
        {
          correctCount,
          incorrectCount,
          avgResponseMs: avgTimeMs,
          avgQuestionExposure,
          lastPracticedAtIso,
        },
        Date.now()
      );
      masteryPct = Math.round(score01 * 100);

      const { data: after } = await supabase
        .from("user_topic_continuity")
        .select("study_note_unlocked_at")
        .eq("user_id", user.id)
        .eq("topic_id", topic.id)
        .maybeSingle();
      noteUnlocked = Boolean(after?.study_note_unlocked_at);
    }
  }

  return (
    <main className="lh-fantasy-ui min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        {slackUserId ? <FantasyPlayerStatusBar slackUserId={slackUserId} /> : null}
        <p
          className="muted"
          style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          {domain.name}
        </p>
        <h1
          className="font-display mt-2 text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display), serif", marginBottom: 24 }}
        >
          {topic.name}
        </h1>

        {slackUserId && masteryPct !== null ? (
          <p className="muted" style={{ marginBottom: 16, fontSize: "0.88rem" }}>
            Recall signal: {masteryPct}%
            {noteUnlocked ? " · Study note unlocked" : ""}
            {viewedBefore ? " · Returning reader" : ""}
          </p>
        ) : null}

        <Panel variant="dashboard" title="Summary" subtitle="From your certification map">
          {topic.summary ? (
            <p style={{ margin: 0, lineHeight: 1.6, color: "var(--muted)" }}>{topic.summary}</p>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Summary forthcoming for this topic.
            </p>
          )}
          {studyPick ? (
            <div style={{ marginTop: 20 }}>
              <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 8 }}>
                Focused note
              </div>
              <p style={{ margin: 0, lineHeight: 1.55 }}>{studyPick.shortExplanation}</p>
              {noteUnlocked ? (
                <div style={{ marginTop: 16 }}>
                  <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 8 }}>
                    Deep study
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                    {studyPick.longExplanation}
                  </p>
                </div>
              ) : (
                <p className="muted" style={{ marginTop: 14, fontSize: "0.82rem" }}>
                  Deep study unlocks as your recall signal rises through practice.
                </p>
              )}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 16 }}>
              No study items yet for this topic in the vault.
            </p>
          )}
        </Panel>

        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 20 }}>
          <Link href={`/codex${q}`} className="fantasy-stone-link" style={{ marginTop: 0 }}>
            Browse codex
          </Link>
          <Link href={`/dashboard${q}`} className="fantasy-stone-link" style={{ marginTop: 0 }}>
            Dashboard
          </Link>
          <Link href={`/hunts${q}`} className="fantasy-stone-link" style={{ marginTop: 0 }}>
            Hunts
          </Link>
          <Link href={`/${q}`} className="fantasy-stone-link" style={{ marginTop: 0 }}>
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
