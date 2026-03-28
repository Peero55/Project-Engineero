# Legendary Hunts

Gamified certification learning platform. Slack-integrated daily questions + web-based RPG-style hunts and battles.

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Slack:** Bolt for JavaScript, Block Kit UI
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **Architecture:** Monorepo (pnpm + Turborepo)

## Project Structure

```
legendary-hunts/
├── apps/
│   ├── web/          # Next.js web app
│   └── slack/        # Bolt Slack app
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── config/      # Shared game/config constants
├── supabase/
│   ├── migrations/  # SQL migrations
│   └── config.toml  # Local dev config
└── package.json
```

For a current codebase map, see [docs/REPO_INDEX.md](docs/REPO_INDEX.md).

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase account
- Slack app (for Slack integration)

## Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase and Slack credentials
   # For Slack: see docs/SLACK_SETUP.md to create the app from manifest
   ```

3. **Run Supabase migrations** (hosted project)
   ```bash
   npx supabase db push
   ```
   Or use Supabase local dev:
   ```bash
   npx supabase start
   npx supabase db reset
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```
   - Web: http://localhost:3000
   - Slack: http://localhost:3001 (OAuth mode: set SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_STATE_SECRET; else Socket Mode)
   - OAuth install: http://localhost:3001/slack/install (when using OAuth mode)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |

## Missing Config / Secrets

Before running:

- [ ] Supabase project URL and keys
- [ ] Slack app credentials (signing secret, bot token, app token)
- [ ] `SESSION_SECRET` for auth (generate with `openssl rand -hex 32`)

## MVP Scope (from blueprint)

- Slack daily quiz system
- Web-based hunts and battles
- Question + explanation system
- Admin question management
- Basic progression (XP, trophies, cooldowns)
- Network+ as first certification

**Out of scope for MVP:** PvP, advanced multiplayer, labs, animations, multiple certifications

## Build Rules

See [docs/ALIGNMENT_VARIABLES.md](docs/ALIGNMENT_VARIABLES.md) and [.cursor/rules/alignment.mdc](.cursor/rules/alignment.mdc) for full alignment rules.

1. Do not invent features outside the blueprint
2. Do not change MVP scope without calling it out
3. Do not skip database design
4. Do not hardcode question content
5. Validate answers server-side only
6. Slack = habit + quick study; web app = immersion + deeper learning

## License

Private
