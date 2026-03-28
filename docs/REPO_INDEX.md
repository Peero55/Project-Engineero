# Repo Index

This index was built from the active workspace manifests, key entrypoints, and the current app/package layout.

## 1. What Is In Scope

The active product is `Legendary Hunts`, a pnpm/Turborepo monorepo for:

- a Next.js web app in `apps/web`
- a Slack Bolt app in `apps/slack`
- shared logic/types/config in `packages/*`
- Supabase schema and seeds in `supabase/`

The actual pnpm workspace is defined in `pnpm-workspace.yaml` and includes only:

- `apps/*`
- `packages/*`

That means the following top-level directories are present in the tree but are not part of the active workspace build graph:

- `legendary-hunts-react-starter/`
- `penpot/`

## 2. Top-Level Landmarks

- `package.json` - root scripts for `turbo dev`, `build`, `lint`, `typecheck`, env validation, and Slack app creation
- `turbo.json` - Turborepo task graph
- `pnpm-workspace.yaml` - workspace boundaries
- `README.md` - setup and product summary
- `apps/` - deployable apps
- `packages/` - shared TypeScript libraries
- `supabase/` - database config and SQL migrations
- `scripts/` - small operational scripts
- `docs/` - design locks, QA reports, system design notes, and handoff docs

## 3. Apps

### `apps/web`

Next.js 15 App Router web experience for dashboard, hunts, battles, codex, explanations, and admin tools.

Key entrypoints:

- `apps/web/src/app/layout.tsx` - root layout, fonts, global styles, providers
- `apps/web/src/app/page.tsx` - landing page and Slack deep-link redirect
- `apps/web/src/app/dashboard/page.tsx` - learner dashboard and continuity snapshot
- `apps/web/src/app/hunts/page.tsx` - hunt list
- `apps/web/src/app/hunts/[huntId]/page.tsx` - hunt detail and battle launch surface
- `apps/web/src/app/battles/[battleId]/page.tsx` - battle session page
- `apps/web/src/app/codex/page.tsx` - topic readiness and continuity view
- `apps/web/src/app/explanations/[domainSlug]/[topicSlug]/page.tsx` - study explanation route
- `apps/web/src/app/admin/*` - admin login, question review, and content ingestion UI

Important API routes:

- `apps/web/src/app/api/health/route.ts` - health check
- `apps/web/src/app/api/question/route.ts` - direct question fetch
- `apps/web/src/app/api/daily-question/route.ts` - internal daily question delivery API
- `apps/web/src/app/api/daily-question/answer/route.ts` - internal daily answer API
- `apps/web/src/app/api/daily-question/message-ts/route.ts` - stores Slack delivery message timestamp
- `apps/web/src/app/api/hunts/route.ts` - hunts listing data
- `apps/web/src/app/api/hunts/[huntId]/route.ts` - single hunt data
- `apps/web/src/app/api/hunts/start/route.ts` - start a hunt-linked battle flow
- `apps/web/src/app/api/battle/*` - primary battle lifecycle routes
- `apps/web/src/app/api/battles/*` - older or parallel battle route namespace still present
- `apps/web/src/app/api/user/profile/route.ts` - learner profile payload
- `apps/web/src/app/api/slack/deeplink/route.ts` - Slack-to-web deep link support
- `apps/web/src/app/api/admin/*` - admin auth, certification metadata, questions, and content ingestion/promote routes

Web app support code:

- `apps/web/src/lib/auth.ts` - Slack-user lookup and creation
- `apps/web/src/lib/admin-auth.ts` - admin cookie/header auth helpers
- `apps/web/src/lib/platform-user.ts` - platform-agnostic user resolution for daily APIs
- `apps/web/src/lib/content-promotion.ts` - promotion from staging content into live content
- `apps/web/src/lib/supabase/*` - server/admin/browser Supabase clients
- `apps/web/src/components/fantasy/*` - fantasy UI layout, battle, and reusable game components

### `apps/slack`

Slack app for daily quiz delivery and Slack-side interaction loops.

Key entrypoints:

- `apps/slack/src/index.ts` - bootstraps env and starts Socket Mode or OAuth receiver
- `apps/slack/src/app.ts` - creates Bolt app and registers listeners
- `apps/slack/src/env.ts` - env parsing and validation

Listener and service layout:

- `apps/slack/src/listeners/app-home.ts` - App Home behavior
- `apps/slack/src/listeners/commands.ts` - slash commands
- `apps/slack/src/listeners/shortcuts.ts` - global/message shortcuts
- `apps/slack/src/listeners/actions.ts` - interactive actions
- `apps/slack/src/services/daily-quiz.ts` - send question and handle answer flow
- `apps/slack/src/lib/daily-api.ts` - HTTP client for the web app's daily-question endpoints
- `apps/slack/src/blocks/daily-question.ts` - Block Kit payload builders

## 4. Shared Packages

### `packages/core`

Shared domain logic. This is the main product engine and the best first stop for gameplay rules and learning logic.

- `question-engine.ts` - question selection
- `answer-evaluation.ts` - answer checking
- `battle-engine.ts` - battle turn resolution, pause/resume helpers
- `encounter-sequence.ts` - encounter generation and battle session view shaping
- `progression.ts` - XP/progression updates after battle outcomes
- `hunt-progress.ts` - hunt progress updates tied to battle completion
- `daily-question.ts` - daily question delivery and answer recording
- `topic-mastery.ts` - mastery scoring
- `knowledge-continuity.ts` - cross-surface continuity, weakest topics, dashboard summaries
- `study-explanation.ts` - explanation selection
- `puzzle-evaluation.ts` - puzzle encounter handling
- `content-ingest.ts` - parsing and validation for imported study material

### `packages/config`

Shared constants and light config helpers.

- `game.ts` - attack tiers, damage, XP, encounter count, battle type mapping
- `daily.ts` - daily question defaults and seed certification id
- `session.ts` - session config

### `packages/types`

Shared domain types.

- `question.ts` - question/answer shape
- `battle.ts` - battle session and answer result types
- `user.ts` - user profile/stats types
- `encounter.ts` - encounter view/public types

## 5. Database And Content

### `supabase/`

- `supabase/config.toml` - local Supabase config
- `supabase/migrations/001_initial_schema.sql` - initial schema
- `supabase/migrations/002_indexes_and_rls.sql` - indexes and RLS
- `supabase/migrations/003_slack_installations.sql` - Slack installation storage
- `supabase/migrations/004_phase2_engine.sql` - engine/data model expansion
- `supabase/migrations/005_slack_installations_rls.sql` - Slack installation security
- `supabase/migrations/006_schema_deployment.sql` - deployment/schema follow-up
- `supabase/migrations/007_seed_network_plus.sql` - Network+ seed content
- `supabase/migrations/008_difficulty_tier_5.sql` - tier-5 difficulty support
- `supabase/migrations/009_daily_questions.sql` - daily question system tables
- `supabase/migrations/010_battle_encounters.sql` - encounter battle schema
- `supabase/migrations/011_dev_seed_network_plus_questions.sql` - dev question seed
- `supabase/migrations/012_user_topic_continuity.sql` - continuity tracking
- `supabase/migrations/013_content_ingestion.sql` - admin ingestion/staging tables

### Content/admin workflow

The current ingestion path is:

1. Admin uploads PDF or text in `apps/web/src/app/admin/content/page.tsx`
2. `apps/web/src/app/api/admin/content/ingest/route.ts` extracts text and parses it with `packages/core/src/content-ingest.ts`
3. Parsed rows are written to `content_ingests` and `content_staging_items`
4. Promotion helpers in `apps/web/src/lib/content-promotion.ts` move approved staging content into live tables

## 6. Docs Map

Best starting docs by topic:

- `docs/ALIGNMENT_VARIABLES.md` - product and architecture guardrails
- `docs/PHASE0_DESIGN_LOCK.md` - foundational design lock
- `docs/ENCOUNTER_MODEL.md` - encounter flow and battle philosophy
- `docs/SYSTEM_DESIGN_DAILY_QUESTIONS.md` - daily question system design
- `docs/CONTENT_INGEST_FORMAT.md` - required structured ingest format
- `docs/SLACK_SETUP.md` - Slack app setup
- `docs/DECISION_LOG.md` - major design decisions
- `docs/PHASE_COMPLETIONS.md` - chronological implementation history
- `docs/UI_AUDIT_REPORT.md`, `docs/GAMEPLAY_QA_REPORT.md`, `docs/BATTLE_VALIDATION_REPORT.md` - recent QA context

## 7. Reference And External Subtrees

### `legendary-hunts-react-starter/`

Appears to be an earlier starter/reference implementation. It includes its own app, docs, and `INDEX.md`, but it is not part of the active pnpm workspace.

Useful when you want:

- prior UI patterns
- historical docs
- starter component ideas

Do not assume edits here affect the live app.

### `penpot/`

Large separate project with ClojureScript, Clojure, Rust, JS, and package workspaces. It is not referenced by the root pnpm workspace and appears to be external/vendor or adjacent source material rather than part of the Legendary Hunts runtime path.

Engineero-specific Penpot automation scripts live under `scripts/penpot/` (not inside the submodule tree).

Do not start here unless the task is explicitly about `penpot`.

## 8. Where To Look First

For common tasks:

- new game rules or scoring logic -> `packages/core/src/*`
- tweak battle pacing or attack tuning -> `packages/config/src/game.ts`
- change web UX/routes -> `apps/web/src/app/*` and `apps/web/src/components/fantasy/*`
- fix Slack delivery/interaction behavior -> `apps/slack/src/services/*`, `apps/slack/src/listeners/*`
- adjust auth/admin gating -> `apps/web/src/lib/auth.ts`, `apps/web/src/lib/admin-auth.ts`
- change database behavior -> `supabase/migrations/*` and corresponding package/app code
- update ingest parsing -> `packages/core/src/content-ingest.ts`
- investigate continuity/codex/dashboard metrics -> `packages/core/src/knowledge-continuity.ts`

## 9. Notable Quirks

- The workspace root is a folder tree, but it was not initialized as a Git repository at this path when this index was generated.
- The web app currently uses `slack_user_id` query params in several places as a temporary identity bridge.
- There are both `/api/battle/*` and `/api/battles/*` route families in `apps/web`, so check both before changing battle APIs.
- The reference starter has its own index docs; use the root `docs/` folder for the active project first.
