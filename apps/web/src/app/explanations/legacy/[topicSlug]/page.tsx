import { permanentRedirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Legacy single-segment explanations URL is rewritten here from `/explanations/:topicSlug`
 * (see `middleware.ts`). Prefer `/explanations/:domainSlug/:topicSlug`.
 *
 * Optional `?domain=<domainSlug>` forces resolution.
 */
export default async function LegacyExplanationRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ topicSlug: string }>;
  searchParams: Promise<{ slack_user_id?: string; domain?: string }>;
}) {
  const { topicSlug } = await params;
  const sp = await searchParams;
  const q = sp.slack_user_id
    ? `?slack_user_id=${encodeURIComponent(sp.slack_user_id)}`
    : "";

  if (sp.domain) {
    permanentRedirect(
      `/explanations/${encodeURIComponent(sp.domain)}/${encodeURIComponent(topicSlug)}${q}`
    );
  }

  const supabase = createAdminClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("slug, domain_id")
    .eq("slug", topicSlug);

  if (!topics?.length) notFound();
  if (topics.length > 1) notFound();

  const { data: dom } = await supabase
    .from("domains")
    .select("slug")
    .eq("id", topics[0].domain_id)
    .single();

  if (!dom?.slug) notFound();

  permanentRedirect(
    `/explanations/${encodeURIComponent(dom.slug)}/${encodeURIComponent(topicSlug)}${q}`
  );
}
