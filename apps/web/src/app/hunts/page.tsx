import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Crown, Map as MapIcon, Sparkles } from "lucide-react";
import { HuntShell } from "@/components/hunt-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { StashSlackParams } from "@/components/stash-slack-params";

function huntTypeBadge(type: string) {
  const t = type.toLowerCase();
  if (t === "legendary") {
    return {
      label: "Legendary path",
      className: "lh-hunt-badge lh-hunt-badge--legendary",
      Icon: Crown,
    };
  }
  if (t === "mini_boss") {
    return {
      label: "Trial path",
      className: "lh-hunt-badge lh-hunt-badge--trial",
      Icon: Sparkles,
    };
  }
  return {
    label: "Hunt path",
    className: "lh-hunt-badge lh-hunt-badge--hunt",
    Icon: MapIcon,
  };
}

export default async function HuntsPage({
  searchParams,
}: {
  searchParams: Promise<{ slack_user_id?: string }>;
}) {
  const sp = await searchParams;
  const slackUserId = sp.slack_user_id;

  const supabase = createAdminClient();
  const { data: hunts } = await supabase
    .from("hunts")
    .select("id, slug, name, description, hunt_type, required_progress, domain_id")
    .order("name", { ascending: true });

  const domainIds = [...new Set((hunts ?? []).map((h) => h.domain_id))];
  const { data: domains } =
    domainIds.length > 0
      ? await supabase.from("domains").select("id, name, slug").in("id", domainIds)
      : { data: [] as { id: string; name: string; slug: string }[] };

  const dm = new Map((domains ?? []).map((d) => [d.id, d]));

  return (
    <>
      <Suspense fallback={null}>
        <StashSlackParams />
      </Suspense>
      <HuntShell>
        <header className="mb-10">
          <p className="lh-hunt-text-accent text-xs font-semibold uppercase tracking-[0.2em]">
            Legendary Hunts
          </p>
          <h1 className="lh-hunt-text-primary font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Hunts
          </h1>
          <p className="lh-hunt-text-muted mt-3 max-w-xl text-pretty">
            Pick a path. Progress saves when you bring a learner id from Slack—or use the dev default
            from Home.
          </p>
          {!slackUserId && (
            <div className="lh-hunt-callout lh-panel mt-6 flex gap-3 border p-4">
              <div className="lh-hunt-callout-bar mt-0.5 h-8 w-1 shrink-0 rounded-full" aria-hidden />
              <p className="lh-hunt-text-primary text-sm">
                Add{" "}
                <code className="lh-hunt-text-accent rounded bg-black/30 px-1.5 py-0.5 font-mono">
                  ?slack_user_id=…
                </code>{" "}
                to tie progress to a profile (Slack deep link or local tester id).
              </p>
            </div>
          )}
        </header>

        <ul className="space-y-4">
          {(hunts ?? []).map((h) => {
            const d = dm.get(h.domain_id);
            const q = slackUserId
              ? `slack_user_id=${encodeURIComponent(slackUserId)}`
              : "";
            const meta = huntTypeBadge(h.hunt_type);
            const Icon = meta.Icon;
            return (
              <li key={h.id}>
                <Link
                  href={q ? `/hunts/${h.id}?${q}` : `/hunts/${h.id}`}
                  className="lh-hunt-list-row group lh-panel flex gap-4 p-4 transition sm:p-5"
                >
                  <div className="lh-hunt-badge-icon flex h-12 w-12 shrink-0 items-center justify-center">
                    <Icon className="lh-hunt-text-accent h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="lh-hunt-text-primary font-display text-lg font-semibold group-hover:brightness-110">
                        {h.name}
                      </span>
                      <span className={meta.className}>
                        {meta.label}
                      </span>
                    </div>
                    <span className="lh-hunt-text-muted mt-1 block text-xs">
                      {d?.name ?? "Domain"} · {h.required_progress} pts to clear
                    </span>
                    {h.description && (
                      <p className="lh-hunt-text-muted mt-2 line-clamp-2 text-sm leading-relaxed">
                        {h.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    className="lh-hunt-text-muted mt-2 h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:text-[color:var(--lh-accent-gold)]"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {(!hunts || hunts.length === 0) && (
          <div className="lh-hunt-text-muted lh-panel mt-8 p-8 text-center">
            No hunts in the database yet. Run migrations and seeds (Network+ hunt in{" "}
            <code className="opacity-90">007</code>).
          </div>
        )}

        <div className="mt-12">
          <Link href="/" className="lh-hunt-link inline-flex items-center gap-1 text-sm font-medium">
            ← Home
          </Link>
        </div>
      </HuntShell>
    </>
  );
}
