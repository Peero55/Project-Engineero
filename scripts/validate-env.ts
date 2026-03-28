#!/usr/bin/env tsx
/**
 * Validates required environment variables.
 * Run: pnpm env:check
 */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const slackRequired = [
  "SLACK_SIGNING_SECRET",
  "SLACK_BOT_TOKEN",
  "SLACK_APP_TOKEN",
] as const;

const missing = required.filter((key) => !process.env[key]);
const slackMissing = slackRequired.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("Missing required env vars:", missing.join(", "));
  process.exit(1);
}

if (slackMissing.length > 0) {
  console.warn("Missing Slack vars (required for apps/slack):", slackMissing.join(", "));
}

if (!process.env.ADMIN_API_SECRET?.trim()) {
  console.warn(
    "ADMIN_API_SECRET not set — /admin/question review UI and admin APIs stay disabled until set."
  );
}

console.log("Env check passed");
