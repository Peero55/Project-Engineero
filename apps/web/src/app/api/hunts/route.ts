import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * List hunts with domain name (public catalog).
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: hunts, error } = await supabase
      .from("hunts")
      .select("id, slug, name, description, hunt_type, required_progress, domain_id")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const domainIds = [...new Set((hunts ?? []).map((h) => h.domain_id))];
    const { data: domains } =
      domainIds.length > 0
        ? await supabase.from("domains").select("id, name, slug").in("id", domainIds)
        : { data: [] as { id: string; name: string; slug: string }[] };

    const dm = new Map((domains ?? []).map((d) => [d.id, d]));

    const payload = (hunts ?? []).map((h) => {
      const d = dm.get(h.domain_id);
      return {
        id: h.id,
        slug: h.slug,
        name: h.name,
        description: h.description,
        huntType: h.hunt_type,
        requiredProgress: h.required_progress,
        domainName: d?.name ?? "",
        domainSlug: d?.slug ?? "",
      };
    });

    return NextResponse.json({ hunts: payload });
  } catch (e) {
    console.error("GET /api/hunts:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
