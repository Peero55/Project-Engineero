import { createAdminClient } from "./supabase/admin";

export type AuthUser = {
  id: string;
  slackUserId: string | null;
  email: string | null;
};

/**
 * Resolve Legendary Hunts user from Slack user ID.
 * MVP: Slack identity is primary. Creates user + profile if needed.
 */
export async function getUserBySlackId(slackUserId: string): Promise<AuthUser | null> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, slack_user_id, email")
    .eq("slack_user_id", slackUserId)
    .single();

  if (error || !user) return null;

  return {
    id: user.id,
    slackUserId: user.slack_user_id,
    email: user.email,
  };
}

/**
 * Create or get user by Slack ID. Returns user + ensures profile exists.
 */
export async function getOrCreateUserBySlackId(
  slackUserId: string,
  displayName: string,
  avatarUrl?: string
): Promise<AuthUser | null> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("users")
    .select("id, slack_user_id, email")
    .eq("slack_user_id", slackUserId)
    .single();

  if (existing) {
    return {
      id: existing.id,
      slackUserId: existing.slack_user_id,
      email: existing.email,
    };
  }

  const { data: created, error } = await supabase
    .from("users")
    .insert({ slack_user_id: slackUserId })
    .select("id, slack_user_id, email")
    .single();

  if (error || !created) return null;

  await supabase.from("profiles").insert({
    user_id: created.id,
    display_name: displayName,
    avatar_url: avatarUrl ?? null,
  });

  return {
    id: created.id,
    slackUserId: created.slack_user_id,
    email: created.email,
  };
}
