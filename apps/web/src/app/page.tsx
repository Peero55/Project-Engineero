import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Swords, Sparkles } from "lucide-react";
import { CrestMark } from "@/components/crest-mark";
import { DEV_TEST_SLACK_USER_ID } from "@/lib/dev-test-user";

type HomeSearchParams = {
  slack_user_id?: string;
  question_id?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const p = await searchParams;
  if (p.slack_user_id) {
    const qs = new URLSearchParams();
    qs.set("slack_user_id", p.slack_user_id);
    if (p.question_id) qs.set("question_id", p.question_id);
    redirect(`/dashboard?${qs.toString()}`);
  }

  const huntsHref =
    process.env.NODE_ENV === "development"
      ? `/hunts?slack_user_id=${encodeURIComponent(DEV_TEST_SLACK_USER_ID)}`
      : "/hunts";

  return (
    <div className="lh-fantasy-ui relative min-h-screen overflow-hidden">
      {/* Atmospheric background layers */}
      <div className="lh-title-bg" aria-hidden />
      <div className="lh-title-vignette" aria-hidden />
      <div className="lh-title-particles" aria-hidden />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-16">
        {/* Crest with glow */}
        <div className="lh-title-crest-glow relative mb-8">
          <CrestMark className="h-28 w-28 drop-shadow-[0_0_24px_rgba(242,201,76,0.35)] sm:h-36 sm:w-36" />
        </div>

        {/* Title lockup */}
        <p className="lh-title-subtitle text-xs font-semibold uppercase tracking-[0.3em]">
          Prepare for the Hunt
        </p>
        <h1
          className="font-display mt-3 max-w-2xl text-center text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl"
          style={{ color: "var(--lh-text-primary)" }}
        >
          Legendary Hunts
        </h1>
        <p
          className="mt-2 text-center font-display text-lg tracking-wide sm:text-xl"
          style={{ color: "var(--lh-accent-gold)", opacity: 0.85 }}
        >
          Certification prep, leveled up
        </p>
        <p
          className="mt-5 max-w-md text-center text-sm leading-relaxed"
          style={{ color: "var(--lh-text-muted)" }}
        >
          Quick study rituals in Slack. Deeper runs — hunts, encounters, and
          explanations — on the web.
        </p>

        {/* Action buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href={huntsHref} className="lh-title-btn lh-title-btn--primary">
            <Swords className="h-4 w-4" aria-hidden />
            Begin Hunt
          </Link>
          <Link
            href="/dashboard"
            className="lh-title-btn lh-title-btn--secondary"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Dashboard
          </Link>
        </div>

        {/* Feature callout */}
        <div className="lh-title-callout mt-16 max-w-lg">
          <div className="lh-title-callout-icon">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--lh-text-muted)" }}
          >
            Each hunt is a path through topics. Battles mix questions and
            puzzles in one flow — no mode switching, just the next encounter.
          </p>
        </div>
      </div>
    </div>
  );
}
