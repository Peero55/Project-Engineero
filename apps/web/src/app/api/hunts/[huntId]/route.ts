import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBySlackId } from "@/lib/auth";

type Params = { params: Promise<{ huntId: string }> };

export async function GET(request: NextRequest, context: Params) {
  try {
    const { huntId } = await context.params;
    const slackUserId = request.nextUrl.searchParams.get("slackUserId");
    const supabase = createAdminClient();

    const { data: hunt, error } = await supabase
      .from("hunts")
      .select("id, slug, name, description, hunt_type, required_progress, domain_id")
      .eq("id", huntId)
      .single();

    if (error || !hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    const { data: domain } = await supabase
      .from("domains")
      .select("name, slug")
      .eq("id", hunt.domain_id)
      .single();

    let huntProgress: {
      id: string;
      status: string;
      progressPoints: number;
    } | null = null;

    if (slackUserId) {
      const user = await getUserBySlackId(slackUserId);
      if (user) {
        const { data: hp } = await supabase
          .from("hunt_progress")
          .select("id, status, progress_points")
          .eq("user_id", user.id)
          .eq("hunt_id", huntId)
          .maybeSingle();
        if (hp) {
          huntProgress = {
            id: hp.id,
            status: hp.status,
            progressPoints: hp.progress_points,
          };
        }
      }
    }

    return NextResponse.json({
      hunt: {
        id: hunt.id,
        slug: hunt.slug,
        name: hunt.name,
        description: hunt.description,
        huntType: hunt.hunt_type,
        requiredProgress: hunt.required_progress,
        domainName: domain?.name ?? "",
        domainSlug: domain?.slug ?? "",
      },
      huntProgress,
    });
  } catch (e) {
    console.error("GET /api/hunts/[huntId]:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
