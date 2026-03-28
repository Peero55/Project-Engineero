import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const supabase = createAdminClient();
  const { data: certs, error: cErr } = await supabase
    .from("certifications")
    .select("id, slug, name")
    .order("name");

  if (cErr) {
    console.error("admin certifications:", cErr);
    return NextResponse.json({ error: cErr.message }, { status: 500 });
  }

  const { data: domains, error: dErr } = await supabase
    .from("domains")
    .select("id, certification_id, slug, name, sort_order")
    .order("sort_order");

  if (dErr) {
    console.error("admin domains:", dErr);
    return NextResponse.json({ error: dErr.message }, { status: 500 });
  }

  return NextResponse.json({
    certifications: certs ?? [],
    domains: domains ?? [],
  });
}
