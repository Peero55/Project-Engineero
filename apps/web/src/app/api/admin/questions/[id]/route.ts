import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { uuidSchema } from "@/lib/validations";

const patchSchema = z.object({
  is_active: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const { id: rawId } = await context.params;
  const idParse = uuidSchema.safeParse(rawId);
  if (!idParse.success) {
    return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .update({ is_active: parsed.data.is_active })
    .eq("id", idParse.data)
    .select("id, is_active")
    .single();

  if (error) {
    console.error("admin question patch:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json({ question: data });
}
