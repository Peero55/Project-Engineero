# Repository Intake Spec — Engineero

## 1. Current State Summary

Engineero is a pnpm/Turborepo monorepo for a Slack-first gamified learning platform with a Next.js web companion. The repo is structurally sound: `pnpm typecheck` passes across all 5 packages, turbo task graph is wired correctly, and shared packages follow clean dependency boundaries.

### Active Workspace Members

| Package           | Role                                                                           | Dependencies                                                       |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `apps/web`        | Next.js 15 App Router — dashboard, hunts, battles, codex, explanations, admin  | `@legendary-hunts/config`, `core`, `types`                         |
| `apps/slack`      | Slack Bolt app — daily quiz, shortcuts, commands, actions                      | `@legendary-hunts/config`, `types`                                 |
| `packages/core`   | Shared gameplay logic — battle engine, encounters, progression, content ingest | `@legendary-hunts/config`, `types`, `@supabase/supabase-js`, `zod` |
| `packages/types`  | Shared domain types — question, battle, user, encounter                        | (none)                                                             |
| `packages/config` | Shared constants — game tuning, daily config, session config                   | (none)                                                             |

### Phase Status

| Phase                                                | Status                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| 1 — Scaffold                                         | ✅ Complete                                                       |
| 2 — Core infrastructure                              | ✅ Complete                                                       |
| 3 — Slack daily questions                            | ✅ Complete                                                       |
| 4 — Game core (hunts, battles, encounters)           | ✅ Complete                                                       |
| 5 — Admin + content                                  | 🔄 Partial (question review MVP done; import pipeline incomplete) |
| 6 — Progression (trophies, badges, items, cooldowns) | 🔲 Pending                                                        |

### Build Health

- `pnpm typecheck`: ✅ all 5 packages pass (cached)
- Turbo tasks: `build`, `dev`, `lint`, `typecheck` all wired
- CI: GitHub Actions with lint/typecheck/build/test jobs on `main`/`dev`
- Secret scanning: TruffleHog workflow active
- Dependabot: configured for npm + github-actions

---

## 2. Validated System Map

### Web App (`apps/web`)

Next.js 15 App Router. Routes validated:

**Learner routes:**

- `/` — landing + Slack deep-link redirect
- `/dashboard` — learner dashboard with continuity snapshot, domain readiness, weakest topics
- `/hunts` — hunt list with fantasy token styling
- `/hunts/[huntId]` — hunt detail + battle launch
- `/battles/[battleId]` — battle session with EncounterScreen (question + puzzle support)
- `/codex` — domain/topic readiness view
- `/explanations/[domainSlug]/[topicSlug]` — canonical study explanation
- `/explanations/legacy/[topicSlug]` — legacy single-segment redirect via middleware

**API routes (primary):**

- `/api/battle/start`, `/api/battle/answer`, `/api/battle/pause`, `/api/battle/resume`, `/api/battle/[battleId]` — encounter-aware battle lifecycle
- `/api/hunts`, `/api/hunts/[huntId]` — hunt data
- `/api/daily-question`, `/api/daily-question/answer`, `/api/daily-question/message-ts` — daily quiz
- `/api/user/profile` — learner profile with `xpToNextLevel`
- `/api/slack/deeplink` — Slack-to-web bridge
- `/api/health` — health check
- `/api/admin/*` — admin auth, questions, certifications, content ingest/staging/promote

**API routes (legacy — see Blockers):**

- `/api/battles/start`, `/api/battles/answer` — pre-encounter battle routes, no client callers found

**Component library:**

- `components/fantasy/game/` — EncounterScreen, EnemyEncounterPanel, PlayerBattleVitals, QuestionPanel, AttackBar, FeedbackLayer
- `components/fantasy/layout/` — ScreenShell, PlayerInfoBar, FantasyPlayerStatusBar
- `components/fantasy/ui/` — Panel, Button, HealthBar, XPBar
- `components/` — CrestMark, HuntShell, SessionIdleGate, StashSlackParams, DevApiSmokeBanner

**Lib:**

- `lib/supabase/` — admin, client, server Supabase clients
- `lib/auth.ts` — Slack user lookup/creation
- `lib/admin-auth.ts` — admin cookie/bearer auth
- `lib/platform-user.ts` — platform-agnostic user resolution
- `lib/content-promotion.ts` — staging → live content promotion
- `lib/validations.ts` — shared zod schemas

**Styles:**

- `styles/fantasy-ui.css` — scoped under `.lh-fantasy-ui`, hunt token classes

### Slack App (`apps/slack`)

Slack Bolt (Node.js) with Socket Mode or OAuth receiver.

- `src/index.ts` — bootstrap + start
- `src/app.ts` — Bolt app creation, listener registration, optional OAuth receiver
- `src/env.ts` — zod-validated env (SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN)
- `src/listeners/` — app-home, commands, shortcuts, actions
- `src/services/daily-quiz.ts` — daily question send + answer flow
- `src/lib/daily-api.ts` — HTTP client for web app daily-question endpoints
- `src/blocks/daily-question.ts` — Block Kit payload builders

### Shared Packages

**`packages/core` (12 modules):**

- question-engine, answer-evaluation, battle-engine, encounter-sequence, puzzle-evaluation
- progression, hunt-progress, daily-question, topic-mastery, study-explanation
- knowledge-continuity, content-ingest

**`packages/types` (4 modules):**

- question, battle, user, encounter

**`packages/config` (3 modules):**

- game (attack tiers, damage, XP, encounter config), daily (defaults, seed cert ID), session (idle timeout)

### Database (`supabase/`)

13 migrations (001–013) covering:

- Initial schema, indexes, RLS (001–002)
- Slack installations + RLS (003, 005)
- Phase 2 engine expansion (004)
- Schema deployment follow-up (006)
- Network+ seed content (007)
- Difficulty tier 5 (008)
- Daily questions (009)
- Battle encounters + puzzles (010)
- Dev question seed (011)
- User topic continuity (012)
- Content ingestion/staging (013)

Local Supabase config: PostgreSQL 15, port 54322, Studio on 54323.

### Scripts

- `scripts/validate-env.ts` — env validation with optional admin secret warning
- `scripts/slack-create-app.ts` — Slack app creation helper
- `scripts/penpot/` — Penpot semantic tagger and integrity rebind scripts

### Non-Workspace Directories

| Directory                        | Status                | Notes                                                                              |
| -------------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `legendary-hunts-react-starter/` | Reference only        | Not in pnpm workspace; earlier starter with its own package.json, docs, components |
| `penpot/`                        | Git submodule (empty) | Points to `github.com/penpot/penpot.git`; no files checked out                     |
| `config/`                        | Active                | `alignment.variables.json` — machine-readable alignment config                     |
| `docs/`                          | Active                | 17 markdown files + 3 screenshot directories                                       |

---

## 3. Architecture Boundary Validation

| Boundary                    | Status | Notes                                                                |
| --------------------------- | ------ | -------------------------------------------------------------------- |
| Core has no platform types  | ✅     | `packages/core` depends only on config, types, supabase-js, zod      |
| Slack has no business logic | ✅     | `apps/slack` calls web API endpoints; no direct core dependency      |
| Types are leaf package      | ✅     | No dependencies                                                      |
| Config is leaf package      | ✅     | No dependencies                                                      |
| Supabase = system of record | ✅     | All data flows through Supabase; no local SQLite or file-based state |
| React owns rendering        | ✅     | Fantasy component library in `apps/web/src/components/fantasy/`      |
| Theme-neutral core          | ✅     | Core uses `entity`, `encounter`, `action` — no theme words           |

**One boundary concern:** `apps/slack` does not depend on `@legendary-hunts/core` in its `package.json`, which is correct per architecture (Slack calls HTTP APIs). However, `apps/slack/src/app.ts` uses `FileInstallationStore` writing to `.slack-installations/` on disk — this is fine for dev but won't work in serverless/container deploys without a persistent volume or migration to Supabase-backed installation store.

---

## 4. Stale, Duplicate, or Risky Areas

| Item                                                                    | Type             | Risk                                                                                                      | Recommendation                                                                    |
| ----------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/api/battles/start` + `/api/battles/answer`                            | Duplicate        | Medium — confusing dual route namespace; legacy answer route lacks encounter wiring, progression, timeout | Remove after confirming zero callers (verified: no client/Slack references found) |
| `legendary-hunts-react-starter/`                                        | Stale            | Low — not in workspace, but adds ~50+ files to repo size and confuses new contributors                    | Archive to separate branch or repo; remove from main                              |
| `penpot/` submodule                                                     | Stale            | Low — empty directory, submodule points to full Penpot repo (huge); never checked out                     | Remove submodule + `.gitmodules` entry; keep `scripts/penpot/` for automation     |
| `Root_Package.json`                                                     | Stale            | Low — appears to be an earlier version of root `package.json`; not referenced                             | Delete                                                                            |
| `Golden_Prompt.md` + `Starting_Scaffolding.md` + `PHASE2_COMPLIANCE.md` | Stale            | Low — planning artifacts from early phases; not referenced by active docs or code                         | Move to `docs/archive/` or delete                                                 |
| `.cursorrules` + `.cursor/rules/`                                       | Stale context    | Low — Cursor-specific rules; not used by Kiro                                                             | Keep for now if team uses Cursor; otherwise archive                               |
| `docs/getting-started.md`                                               | Outdated         | Medium — still has placeholder commands ("npm install", "package manager TBD") despite pnpm being locked  | Update with actual pnpm commands and Supabase local setup                         |
| `docs/CURSOR_HANDOFF.md`                                                | Outdated context | Low — references Cursor-specific workflow                                                                 | Rename or merge relevant parts into a generic handoff doc                         |
| `apps/slack` FileInstallationStore                                      | Risky for deploy | Medium — writes to disk; won't work in serverless/containers                                              | Migrate to Supabase-backed store before production deploy                         |
| Edited historical migrations (009, 010, 011)                            | Risky            | Medium — environments that already applied old versions won't re-run; new clones benefit from guards      | Document in deployment guide; never edit applied migrations again                 |
| `slack_user_id` query param as identity                                 | Technical debt   | Medium — used across multiple web routes as temporary identity bridge                                     | Plan proper auth (OAuth/session) for web users                                    |

---

## 5. Top 10 MVP Blockers

| #   | Blocker                                       | Impact                                                                                                         | Where                                               |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Remote Supabase missing migration 010+        | Battle start fails with schema-cache error; no encounters possible                                             | `supabase/migrations/010_battle_encounters.sql`     |
| 2   | No proper web authentication                  | All web routes rely on `slack_user_id` query param; no session, no OAuth                                       | `apps/web/src/lib/auth.ts`, middleware              |
| 3   | Content import pipeline incomplete            | Phase 5 import (PDF/CSV → staging → review → activate) partially built; no concept extraction or AI generation | `packages/core/src/content-ingest.ts`, admin routes |
| 4   | No test suite                                 | Zero test files across the entire monorepo; CI `test` job skips when no `scripts.test` defined                 | All packages                                        |
| 5   | `INTERNAL_API_SECRET` not enforced            | Daily question APIs are open to unauthenticated callers when web is public                                     | `apps/web/src/app/api/daily-question/`              |
| 6   | Legacy `/api/battles/*` routes still deployed | Confusing dual namespace; legacy answer route lacks encounter model, progression, timeout                      | `apps/web/src/app/api/battles/`                     |
| 7   | HP cooldown not enforced                      | `GAME_CONFIG.cooldowns` exists in config but not enforced in battle start or progression flows                 | `packages/config/src/game.ts`, battle routes        |
| 8   | Slack FileInstallationStore uses disk         | Won't survive container restarts or serverless deploys                                                         | `apps/slack/src/app.ts`                             |
| 9   | No deployment documentation                   | `docs/deployment.md` exists but is placeholder                                                                 | `docs/deployment.md`                                |
| 10  | `docs/getting-started.md` outdated            | New contributors get wrong setup instructions (npm placeholders, no Supabase local steps)                      | `docs/getting-started.md`                           |

---

## 6. Top 10 Highest Leverage Next Tasks

| #   | Task                                                                                | Why                                                                            | Effort      |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------- |
| 1   | Apply migrations 010–013 to remote Supabase                                         | Unblocks live battle E2E; everything else works                                | Low         |
| 2   | Delete `/api/battles/start` and `/api/battles/answer`                               | Eliminates confusion; zero callers confirmed                                   | Low         |
| 3   | Update `docs/getting-started.md` with real pnpm + Supabase local setup              | Unblocks new contributors                                                      | Low         |
| 4   | Add basic auth for web (even cookie-based session from Slack OAuth callback)        | Removes `slack_user_id` query param dependency; required for any public deploy | Medium      |
| 5   | Add vitest + first test for `packages/core` (answer-evaluation, encounter-sequence) | Establishes test foundation; CI `test` job becomes meaningful                  | Medium      |
| 6   | Enforce `INTERNAL_API_SECRET` on daily-question routes in production                | Security gate for public deploy                                                | Low         |
| 7   | Write `docs/deployment.md` with actual Supabase + Vercel/Node deploy steps          | Unblocks anyone besides the original author from deploying                     | Medium      |
| 8   | Remove `penpot/` submodule and `legendary-hunts-react-starter/` from main           | Reduces repo noise; keeps `scripts/penpot/`                                    | Low         |
| 9   | Complete Phase 5 content import (structured markdown → staging → review)            | Enables content scaling beyond manual DB inserts                               | Medium-High |
| 10  | Implement HP cooldown enforcement in battle start                                   | Completes core gameplay loop per design lock                                   | Medium      |

---

## 7. Doc Update Recommendations

| Doc                                                                              | Status                  | Action                                                                                |
| -------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| `docs/getting-started.md`                                                        | Outdated                | Rewrite with pnpm, Supabase local, env setup, migration push                          |
| `docs/deployment.md`                                                             | Placeholder             | Write real deployment guide                                                           |
| `docs/REPO_INDEX.md`                                                             | Good but slightly stale | Update quirks section (Git repo now exists); note legacy battles routes as deprecated |
| `docs/DECISION_LOG.md`                                                           | Current                 | Add DL-007: web auth strategy decision needed                                         |
| `docs/PHASE_COMPLETIONS.md`                                                      | Current                 | No action needed                                                                      |
| `docs/ALIGNMENT_VARIABLES.md`                                                    | Current                 | No action needed                                                                      |
| `docs/CONTENT_INGEST_FORMAT.md`                                                  | Current                 | No action needed                                                                      |
| `docs/SLACK_SETUP.md`                                                            | Not validated           | Verify against current `apps/slack/src/env.ts` requirements                           |
| `TASKLIST.md`                                                                    | Mostly current          | Mark legacy battles routes as deprecated; add auth task to Phase 5 or new phase       |
| `README.md`                                                                      | Adequate                | Add quick-start commands section pointing to getting-started.md                       |
| Root-level `Golden_Prompt.md`, `Starting_Scaffolding.md`, `PHASE2_COMPLIANCE.md` | Stale                   | Archive to `docs/archive/`                                                            |

---

## 8. Validated Scripts and Package Wiring

### Root Scripts (`package.json`)

| Script      | Command                       | Status                                  |
| ----------- | ----------------------------- | --------------------------------------- |
| `dev`       | `turbo dev`                   | ✅ Wired                                |
| `build`     | `turbo build`                 | ✅ Wired                                |
| `lint`      | `turbo lint`                  | ✅ Wired                                |
| `typecheck` | `turbo typecheck`             | ✅ Passes all 5 packages                |
| `format`    | `prettier --write .`          | ✅ Wired                                |
| `env:check` | `tsx scripts/validate-env.ts` | ✅ Wired                                |
| `db:push`   | `npx supabase db push`        | ✅ Wired (requires remote project link) |

### Turbo Task Graph (`turbo.json`)

- `build`: depends on `^build`, outputs `.next/**`, `dist/**`
- `dev`: no cache, persistent
- `lint`: no dependencies
- `typecheck`: no dependencies

**Note:** `typecheck` does not depend on `^typecheck`, meaning packages typecheck in parallel. This is fine because TypeScript project references aren't used — each package resolves workspace deps via `main: ./src/index.ts` (source-level imports).

### Package Wiring

- All workspace deps use `workspace:*` — correct for pnpm workspaces
- `packages/core` exports via `./src/index.ts` (12 re-exports) — all modules verified present
- `packages/types` exports via `./src/index.ts` (4 re-exports) — all modules verified present
- `packages/config` exports via `./src/index.ts` (3 re-exports) — all modules verified present
- `apps/slack` does NOT depend on `@legendary-hunts/core` — correct per architecture (uses HTTP API)
- `apps/web` depends on all three shared packages — correct

### Env Variables (from `.env.example`)

| Variable                        | Required By                   | Status                                                                        |
| ------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | web                           | Documented                                                                    |
| `DATABASE_URL`                  | web (Supabase), db:push       | Documented                                                                    |
| `SLACK_BOT_TOKEN`               | slack                         | Documented (in .env.example as optional; required by `apps/slack/src/env.ts`) |
| `SLACK_SIGNING_SECRET`          | slack                         | Same                                                                          |
| `SLACK_APP_TOKEN`               | slack (Socket Mode)           | Same                                                                          |
| `ADMIN_API_SECRET`              | web (admin routes)            | Documented                                                                    |
| `INTERNAL_API_SECRET`           | web (daily-question API auth) | Documented but not enforced                                                   |
| `NEXT_PUBLIC_SUPABASE_URL`      | web                           | Not in .env.example — should be added                                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web                           | Not in .env.example — should be added                                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | web (admin client)            | Not in .env.example — should be added                                         |

---

## 9. Migration Chain Validation

All 13 migrations are sequential and cover the full schema evolution. Key concerns:

1. Migrations 009, 010, 011 were edited after initial application on some environments (added FK guards for idempotent push). New clones get the fixed versions; existing environments that already applied the originals are unaffected but won't re-run the guards.

2. Migration 010 is the critical blocker for live battles — adds `battle_encounters`, `puzzles`, `battle_sessions.last_activity_at`, `battle_sessions.paused_at`, status `paused`, and encounter FK on `battle_turns`.

3. Migration 007 seeds Network+ content — if skipped or failed on a remote, subsequent migrations that reference the certification ID will insert empty/skipped rows.

4. No down migrations exist. Rollback requires manual SQL or Supabase dashboard.
