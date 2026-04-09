# Getting Started

Welcome to **Engineero** — a Slack-first gamified learning platform with a Next.js web companion. This guide takes you from a fresh clone to a fully running local environment.

## Prerequisites

Install the following before you begin:

| Tool                                                 | Minimum Version | Check                |
| ---------------------------------------------------- | --------------- | -------------------- |
| [Node.js](https://nodejs.org/)                       | 18+             | `node -v`            |
| [pnpm](https://pnpm.io/)                             | 10+             | `pnpm -v`            |
| [Docker](https://www.docker.com/)                    | Latest stable   | `docker info`        |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | Latest          | `supabase --version` |

Docker must be running before you start Supabase local.

## 1. Clone the repository

```bash
git clone https://github.com/<org-or-user>/Engineero.git
cd Engineero
```

## 2. Install dependencies

```bash
pnpm install
```

This installs all packages across the monorepo (web app, Slack app, and shared packages).

## 3. Start Supabase local

```bash
supabase start
```

This launches a local Supabase stack via Docker (PostgreSQL, Auth, Studio, etc.). On first run it pulls container images, which may take a few minutes.

When it finishes, the CLI prints local credentials:

```
         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
  S3 Storage URL: http://localhost:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbG...  <-- copy this
service_role key: eyJhbG...  <-- copy this
```

You need the **API URL**, **anon key**, and **service_role key** for the next step.

## 4. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the Supabase values from the `supabase start` output:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start>
```

For Slack integration, you also need three tokens — see [Slack App Setup](#5-set-up-slack-app) below.

## 5. Set up Slack app

Follow the instructions in **[docs/SLACK_SETUP.md](./SLACK_SETUP.md)** to create a Slack app and obtain the required tokens. You will need:

| Variable               | Where to find                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `SLACK_BOT_TOKEN`      | OAuth & Permissions → Bot User OAuth Token (`xoxb-...`)                             |
| `SLACK_SIGNING_SECRET` | Basic Information → App Credentials                                                 |
| `SLACK_APP_TOKEN`      | Basic Information → App-Level Tokens → create with `connections:write` (`xapp-...`) |

Add all three to your `.env.local`:

```dotenv
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-level-token
```

These are **required** — the Slack app validates them on startup and will fail without them.

## 6. Apply database migrations and seed data

```bash
supabase db reset
```

This drops and recreates the local database, applies all migrations, and loads seed data (certifications, domains, topics, questions, and hunts).

## 7. Start the dev servers

```bash
pnpm dev
```

This starts both the web app and the Slack app via Turborepo:

- **Web app**: [http://localhost:3000](http://localhost:3000)
- **Slack app**: connects via Socket Mode

## Verification

Run these commands to confirm everything is healthy:

```bash
pnpm typecheck   # Type-check all packages (zero errors expected)
pnpm build       # Production build for web and Slack apps
pnpm lint        # Lint all packages (zero errors expected)
```

## Quick reference

| Task                               | Command             |
| ---------------------------------- | ------------------- |
| Install dependencies               | `pnpm install`      |
| Start Supabase local               | `supabase start`    |
| Stop Supabase local                | `supabase stop`     |
| Reset database (migrations + seed) | `supabase db reset` |
| Start dev servers                  | `pnpm dev`          |
| Type-check                         | `pnpm typecheck`    |
| Build                              | `pnpm build`        |
| Lint                               | `pnpm lint`         |
| Push migrations to remote          | `pnpm db:push`      |
| Validate env vars                  | `pnpm env:check`    |

## Troubleshooting

| Issue                          | Fix                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `supabase start` fails         | Make sure Docker is running (`docker info`)                                                         |
| Missing Supabase credentials   | Re-run `supabase start` — credentials are printed each time                                         |
| Slack app crashes on startup   | Verify all three Slack tokens are set in `.env.local` (see [docs/SLACK_SETUP.md](./SLACK_SETUP.md)) |
| Port 3000 in use               | Stop the conflicting process or set a custom port                                                   |
| Stale build artifacts          | Delete `.next` in `apps/web` and re-run `pnpm build`                                                |
| Migration errors on `db reset` | Ensure Supabase local is running, then retry                                                        |

## What to read next

- **[docs/SLACK_SETUP.md](./SLACK_SETUP.md)** — detailed Slack app creation and token setup
- **[docs/KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)** — known limitations and deferred items in the MVP build
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** — branching, PRs, and review expectations
- **[docs/code-standards.md](./code-standards.md)** — code organization and responsibilities

If something in this guide is wrong or outdated, open a PR to fix it.
