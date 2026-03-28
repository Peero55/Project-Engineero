import { getOrCreateUserBySlackId, type AuthUser } from "./auth";

export type DailyPlatform = "slack" | "discord" | "teams";

/**
 * Resolve or create internal user from adapter identity (MVP: Slack only).
 */
export async function resolveUserForDailyApi(
  platform: DailyPlatform,
  platformUserId: string,
  opts?: { displayName?: string; avatarUrl?: string }
): Promise<AuthUser | null> {
  if (platform === "slack") {
    return getOrCreateUserBySlackId(
      platformUserId,
      opts?.displayName?.trim() || "Slack user",
      opts?.avatarUrl
    );
  }
  return null;
}
