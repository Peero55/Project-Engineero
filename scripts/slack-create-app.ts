#!/usr/bin/env tsx
/**
 * Create Legendary Hunts Slack app from manifest via CLI.
 *
 * Prerequisites:
 * 1. Get an App Configuration Token from https://api.slack.com/apps
 *    - Scroll to "Your App Configuration Tokens" (below your app list)
 *    - Click "Generate" and copy the token (starts with xoxe-)
 *
 * 2. Set SLACK_CONFIG_TOKEN in env, or pass as arg:
 *    SLACK_CONFIG_TOKEN=xoxe-... pnpm slack:create-app
 *    pnpm slack:create-app --token xoxe-...
 */
import { config } from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { createInterface } from "node:readline";

config({ path: path.resolve(process.cwd(), ".env.local") });

const API_URL = "https://slack.com/api/apps.manifest.create";
const MANIFEST_PATH = path.resolve(process.cwd(), "apps/slack/manifest.json");

function getToken(): string {
  const argToken = process.argv.find((a) => a.startsWith("--token="))?.split("=")[1];
  if (argToken) return argToken;
  const envToken = process.env.SLACK_CONFIG_TOKEN;
  if (envToken) return envToken;
  return "";
}

async function promptToken(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(
      "Paste your App Configuration Token (from api.slack.com, below app list): ",
      (answer) => {
        rl.close();
        resolve(answer.trim());
      }
    );
  });
}

async function createApp(manifestJson: string, token: string): Promise<void> {
  const body = new URLSearchParams({ manifest: manifestJson });
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json()) as {
    ok: boolean;
    error?: string;
    errors?: Array< { message: string; pointer: string } >;
    app_id?: string;
    credentials?: {
      client_id: string;
      client_secret: string;
      verification_token?: string;
      signing_secret: string;
    };
    oauth_authorize_url?: string;
  };

  if (!data.ok) {
    if (data.errors?.length) {
      console.error("Manifest validation errors:");
      data.errors.forEach((e) => console.error(`  - ${e.pointer}: ${e.message}`));
    } else {
      console.error("Error:", data.error ?? "Unknown error");
    }
    process.exit(1);
  }

  console.log("\n✅ App created successfully!");
  console.log(`   App ID: ${data.app_id}`);
  console.log("\nAdd these to .env.local:\n");
  console.log(`SLACK_SIGNING_SECRET=${data.credentials?.signing_secret ?? ""}`);

  // Bot token requires OAuth install - the API doesn't return xoxb- directly.
  // User must install the app and get the token from OAuth & Permissions.
  console.log(`# SLACK_BOT_TOKEN - Install the app first, then get from OAuth & Permissions`);
  console.log(`# ${data.oauth_authorize_url ?? "Install from api.slack.com/apps"}`);
  console.log(`SLACK_BOT_TOKEN=xoxb-...`);
  console.log(`# SLACK_APP_TOKEN - Create App-Level Token with connections:write in Basic Information`);
  console.log(`SLACK_APP_TOKEN=xapp-1-...`);
  console.log("\nOpen app settings:", `https://api.slack.com/apps/${data.app_id}`);
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Manifest not found at ${MANIFEST_PATH}`);
    process.exit(1);
  }

  let token = getToken();
  if (!token) {
    console.log("App Configuration Token not set.");
    console.log("Get one from: https://api.slack.com/apps → scroll to 'Your App Configuration Tokens' → Generate\n");
    token = await promptToken();
    if (!token) {
      console.error("No token provided.");
      process.exit(1);
    }
  }

  const manifestJson = fs.readFileSync(MANIFEST_PATH, "utf-8");
  await createApp(manifestJson, token);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
