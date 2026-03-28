import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Compass, LayoutDashboard } from "lucide-react";
import { CrestMark } from "@/components/crest-mark";
import { HuntShell } from "@/components/hunt-shell";
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
    <HuntShell maxWidthClass="max-w-3xl">
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
        <CrestMark className="mb-6 h-24 w-24 drop-shadow-lg sm:h-28 sm:w-28" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">
          Legendary Hunts
        </p>
        <h1 className="font-display mt-3 max-w-xl text-4xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-5xl">
          Certification prep, leveled up
        </h1>
        <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-zinc-400">
          Quick study rituals in Slack. Deeper runs—hunts, encounters, and explanations—on the web.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="lh-panel inline-flex items-center gap-2 border-amber-900/40 bg-amber-950/30 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-600/50 hover:bg-amber-950/50"
          >
            <LayoutDashboard className="h-4 w-4 text-amber-400" aria-hidden />
            Dashboard
          </Link>
          <Link
            href={huntsHref}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-sm font-semibold text-zinc-100 shadow-lg shadow-black/30 transition hover:border-zinc-500 hover:bg-zinc-800/90"
          >
            <Compass className="h-4 w-4 text-amber-500/90" aria-hidden />
            Hunts
          </Link>
        </div>
        <div className="lh-panel mt-14 flex max-w-lg flex-col gap-3 border-zinc-800/60 p-5 text-left sm:flex-row sm:items-center sm:gap-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <BookOpen className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Each hunt is a path through topics. Battles mix questions and puzzles in one flow—no mode
            switching, just the next encounter.
          </p>
        </div>
      </div>
    </HuntShell>
  );
}
