# Legendary Hunts — Slack App Setup (CLI & Manifest)

Create and run the Legendary Hunts Slack app via command line and manifest.

---

## Option A: Create App via CLI (Recommended)

### 1. Install Slack CLI (if needed)

```bash
curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash
# Add ~/.local/bin to PATH if needed
```

### 2. Get an App Configuration Token

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Scroll to **"Your App Configuration Tokens"** (below the app list)
3. Click **Generate**
4. Copy the token (starts with `xoxe-`)

### 3. Create the app from manifest

```bash
pnpm slack:create-app
# When prompted, paste your config token
# Or: SLACK_CONFIG_TOKEN=xoxe-... pnpm slack:create-app
```

The script creates the app and prints credentials. Add `SLACK_SIGNING_SECRET` to `.env.local`.

### 4. Install app and get remaining tokens

1. Open the app settings URL printed by the script (or [api.slack.com/apps](https://api.slack.com/apps))
2. **Install to Workspace** → copy `SLACK_BOT_TOKEN` (xoxb-...) from OAuth & Permissions
3. **Basic Information** → App-Level Tokens → Create with `connections:write` → copy `SLACK_APP_TOKEN` (xapp-1-...)

### 5. Run the app

```bash
cd apps/slack && pnpm dev
# Or: pnpm dev  (runs web + slack)
```

---

## Option B: Create New App at api.slack.com (Manual)

1. Go to [api.slack.com/apps?new_app=1](https://api.slack.com/apps?new_app=1)
2. Choose **"From an app manifest"**
3. Select your development workspace → **Next**
4. Select **JSON** tab and paste the contents of `apps/slack/manifest.json`
5. Click **Next** → **Create**

### 2. Install the app

1. Click **Install to Workspace**
2. Review permissions → **Allow**

### 3. Copy credentials to `.env.local`

From the app configuration page:

| Variable | Where to find |
|----------|---------------|
| `SLACK_SIGNING_SECRET` | **Basic Information** → App Credentials |
| `SLACK_BOT_TOKEN` | **OAuth & Permissions** → Bot User OAuth Token (starts with `xoxb-`) |
| `SLACK_APP_TOKEN` | **Basic Information** → App-Level Tokens. Create one with `connections:write` (starts with `xapp-`) |

Add/update these in the project root `.env.local`:

```bash
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
```

### 4. Run the Slack app

**From project root:**

```bash
pnpm install
cd apps/slack && pnpm dev
```

**Or via turbo (starts web + slack):**

```bash
pnpm dev
```

- **Socket Mode**: App runs on port 3001 (or uses Socket Mode connection)
- Console: `Legendary Hunts Slack app (Socket Mode) running`

---

## Option C: Slack CLI run (for local dev)

If you have the [Slack CLI](https://docs.slack.dev/tools/slack-cli) installed:

### 1. Initialize and link

```bash
cd apps/slack
slack init
```

Follow prompts to link an existing app (or create one via CLI).

### 2. Run with Slack CLI

```bash
slack run
```

The CLI manages tokens and Socket Mode connection.

---

## Phase 1 & 2 Verification

Phase 1 (scaffold) and Phase 2 (infrastructure) are complete. Verify:

| Check | How |
|-------|-----|
| Slack app starts | `cd apps/slack && pnpm dev` |
| Env vars | `pnpm env:check` |
| Web app | `pnpm dev` → http://localhost:3000 |
| Supabase | Migrations applied, `users` table exists |

---

## Phase 3 — Implemented Listeners

- **app_home_opened**: Renders App Home with daily quiz and web app buttons
- **Shortcuts**: `Start daily quiz`, `Open Legendary Hunts` (global shortcuts)
- **Slash command**: `/legendary`
- **Actions**: Button handlers for `start_daily_quiz`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Invalid env` | Ensure no spaces in `.env.local` (e.g. `SLACK_TOKEN=value` not `SLACK_TOKEN= value`) |
| Socket Mode fails | Regenerate App-Level Token with `connections:write` |
| Listeners not firing | Reinstall app after manifest changes, or update app at api.slack.com → App Manifest |
