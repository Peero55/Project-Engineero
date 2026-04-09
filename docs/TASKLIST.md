# Legendary Hunts — Task List

> **Before making changes:** Read [ALIGNMENT_VARIABLES.md](ALIGNMENT_VARIABLES.md), [alignment.variables.json](alignment.variables.json), [PHASE0_DESIGN_LOCK.md](PHASE0_DESIGN_LOCK.md), [ENCOUNTER_MODEL.md](ENCOUNTER_MODEL.md).  
> **Sources:** [CURSOR_HANDOFF.md](CURSOR_HANDOFF.md), [SYSTEM_DESIGN_DAILY_QUESTIONS.md](SYSTEM_DESIGN_DAILY_QUESTIONS.md)  
> **Product PRD:** See `.kiro/steering/` for alignment rules; technical conflicts defer to alignment + this file.

---

## PRD ↔ repository map

| PRD §7 (product plan)             | What it means                    | Where it lives in-repo                                                           |
| --------------------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| Phase 1 — Next + Tailwind         | Scaffold + rules                 | `apps/web`, Tailwind; `.kiro/steering/`                                          |
| Phase 2 — Supabase schema + RLS   | Users, questions, answers, stats | `supabase/migrations/*`, RLS in migrations                                       |
| Phase 3 — Edge AI content factory | Import / generate → admin review | **TASKLIST Phase 5** + Edge Functions list below                                 |
| Phase 4 — Slack habit layer       | Daily quiz, Block Kit            | **Phases 2–3 done:** `apps/slack` (Bolt/Node, not Deno-only), APIs in `apps/web` |
| Phase 5 — Web immersive UI        | Hunts, battles, NPC, codex       | **TASKLIST Phases 4–6**                                                          |

**Build:** `pnpm build` (Turborepo: `apps/web` Next.js, `apps/slack` `tsc`). Same as CI/deploy expectation unless overridden per app.

**PRD vs alignment (resolved):** Core engine code avoids theme words (monster, boss, …); web/theme may use Dark Fantasy copy. Encounters are **variable length**; `GAME_CONFIG` defaults (4 / 10 / 20 max questions) are **templates** for short/mid/long hunts, not “every battle is exactly N steps.”

---

## Phase Status Overview

| Phase | Description                                                                                      | Status                                       |
| ----- | ------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| 1     | Scaffold / monorepo structure                                                                    | ✅ Complete                                  |
| 2     | Core infrastructure + Core Engine (schema, auth, Slack, API, question/battle/progression engine) | ✅ Complete                                  |
| 3     | First functional flow (Slack daily questions)                                                    | ✅ Complete                                  |
| 4     | Game core (hunts, battles, question engine)                                                      | ✅ Complete                                  |
| 5     | Admin + content                                                                                  | 🔄 In progress (MVP: /admin question review) |
| 6     | Progression (XP, trophies, badges, cooldowns)                                                    | 🔲 Pending                                   |

---

## Phase 3 — First Functional Flow ✅

_Aligned to:_ [docs/SYSTEM_DESIGN_DAILY_QUESTIONS.md](docs/SYSTEM_DESIGN_DAILY_QUESTIONS.md)

### Data layer

- [x] Migration: `daily_question_deliveries`, `daily_question_config` tables
- [x] Indexes: `delivery_date` + `user_id` (quota); `(user_id, question_id, delivered_at)` for lookups

### Core / API

- [x] `packages/core/src/daily-question.ts`: getNextDailyQuestion, recordDailyAnswer, canReceiveQuestion
- [x] API: POST `/api/daily-question` (platform-agnostic: platformUserId, platform)
- [x] API: POST `/api/daily-question/answer`, POST `/api/daily-question/message-ts`
- [x] Resolve platformUserId → userId via `getOrCreateUserBySlackId` (MVP: Slack only)

### Slack adapter

- [x] Slack listeners: app-home-opened, shortcuts, commands
- [x] Blocks: daily-question, feedback; app-home unchanged except flow
- [x] Actions: `answer_daily_question`, `start_daily_quiz`; deep link button for web dashboard
- [x] Adapter calls HTTP API, renders Block Kit (no Slack types in core)
- [x] Quick answer + short explanation in Slack; "View full explanation on web" → `/dashboard`

### Web app — minimal entry points

- [x] Deep link: `/?slack_user_id=` → `/dashboard` with query preserved
- [x] Slack identity: `getOrCreateUserBySlackId` on API calls from adapter
- [x] Basic dashboard shell (`/dashboard`)

### Config / delivery

- [x] Config: `questions_per_day` default 5, Network+ row + global row in `daily_question_config`
- [x] On-demand first; scheduler (cron) deferred

---

## Phase 4 — Game Core ✅

_Implement per [docs/ENCOUNTER_MODEL.md](docs/ENCOUNTER_MODEL.md): battles operate on encounters, not just questions._

- [x] Hunt system: `/hunts`, `/hunts/[huntId]` (list + detail + `Start battle` → `POST /api/battle/start` with `huntId`); `hunt_progress` updated on battle end via `applyHuntProgressAfterBattleEnd`; `POST /api/hunts/start` unchanged for adapter use
- [x] Battle system: **variable-length** encounter rows (`battle_encounters`); mix `question` \| `puzzle_step` generated per battle (`ENCOUNTER_STEP_RANGE`, `ENCOUNTER_PUZZLE_WEIGHT`). `lab_step` / tier 5 labs: **Phase 6+ / labs track** (not Phase 4).
- [x] Question engine: select by difficulty, avoid repetition, pull from DB (`packages/core/src/question-engine.ts`)
- [x] Result handling: `processEncounterResolution` + `processBattleTurn` (legacy); HP + pause (`paused`, `paused_at`, `last_activity_at`); resume resets active encounter `started_at` (`refreshActiveEncounterStartedAt`)
- [x] Per-encounter time limit: server uses `started_at` vs `GAME_CONFIG.timeoutSeconds` (wrong answer / puzzle fail); pause has no cap; client shows countdown on `/battles/[battleId]`
- [x] Server-side answer validation (never client)
- [x] Client session idle: **30 min** inactivity → redirect home + clear `sessionStorage` (`SessionIdleGate`, `SESSION_CONFIG.idleLogoutMs`)
- [x] Pages: `hunts`, `hunts/[huntId]`, `battles/[battleId]` (question = radio MC layout; puzzle `ordering` = reorder list); `explanations/[topicSlug]`; APIs `GET /api/hunts`, `GET /api/hunts/[huntId]`, `GET /api/battle/[battleId]`

---

## Phase 5 — Admin + Content

- [x] Admin question management UI (minimal): `GET/PATCH /api/admin/questions`, `/admin/login` session cookie + Bearer, `/admin/questions` list/search + activate/deactivate (`ADMIN_API_SECRET`)
- [ ] Import system (PDF / docs / CSV)
- [ ] Concept extraction, question generation
- [ ] Admin review before activation
- [ ] API: admin/import, questions/recommendations
- [ ] Edge functions: import-questions, generate-explanations

---

## Phase 6 — Progression

- [x] XP and level system (partial: `packages/core/src/progression.ts`, `applyProgression`; wire fully to all battle paths + UI)
- [ ] Trophies (knowledge-based)
- [ ] Badges (achievement-based)
- [ ] Items (mitigate loss)
- [ ] HP loss → cooldown timer (`GAME_CONFIG.cooldowns` present; not fully enforced in product flows)
- [x] Mastery tracking (partial: `user_stats`, weak-topic weighting in `getQuestion`)
- [x] Question selection driven by mastery data (partial: weak-topic bias in question engine)

---

## Supporting / Cross-Cutting

### Docs status

- [x] `docs/ALIGNMENT_VARIABLES.md` — alignment variables
- [x] `docs/alignment.variables.json` — machine-readable alignment
- [x] `docs/PHASE0_DESIGN_LOCK.md` — design lock
- [x] `docs/ENCOUNTER_MODEL.md` — unified encounter model (design lock)
- [x] `docs/SYSTEM_DESIGN_DAILY_QUESTIONS.md` — Phase 3 system design
- [ ] `docs/GOLDEN_BUILD_PROMPT.md` (handoff reference)
- [ ] `docs/PRODUCT_BLUEPRINT.md` (handoff reference)
- [ ] `docs/MVP_SCOPE.md` (handoff reference; README has MVP summary)
- [ ] `docs/ARCHITECTURE.md` (handoff reference)
- [ ] `docs/CONTENT_PIPELINE.md` (handoff reference)

### Slack dev references (used during phases 3–6)

- **https://docs.slack.dev** — primary reference; use its best practices before project docs.

### Schema / seeds

- [ ] Supabase seed: Network+ certification, domains, topics
- [ ] Migration 004: scoring functions
- [ ] Migration 005: battle functions
- [ ] Migration 006: admin views

### Packages

- [ ] `packages/types`: battle.ts, hunt.ts, rewards.ts, user.ts (extend beyond question.ts)
- [ ] `packages/config`: mastery.ts, slack.ts
- [ ] `packages/ui` (battle-card, progress-bar, npc-dialog, stat-chip) — optional, can live in apps/web

### Supabase Edge Functions

- [ ] `slack-events` — handle Slack events
- [ ] `daily-quiz-scheduler` — schedule daily questions
- [ ] `import-questions` — content import
- [ ] `generate-explanations` — AI-generated explanations

### Web app structure (from scaffolding)

- [ ] middleware.ts (auth, redirects)
- [ ] login, dashboard, profile, codex pages
- [ ] lib: battle-engine, hunt-engine, mastery, rewards, validations

### Slack app structure (from scaffolding)

- [ ] Full listener/block/service/client layout per Starting_Scaffolding
- [ ] Supabase client in Slack app for questions/progress

---

## Locked Rules

_See [.cursor/rules/alignment.mdc](.cursor/rules/alignment.mdc) for full alignment rules._

- Do not violate alignment variables ([docs/ALIGNMENT_VARIABLES.md](docs/ALIGNMENT_VARIABLES.md))
- Do not invent features outside MVP/blueprint unless explicitly asked
- Do not change MVP scope without calling it out
- Do not skip database design
- Do not hardcode question content
- Do not place theme-specific language in core engine
- Do not make Slack the primary product surface
- Do not bypass adapter pattern for integrations
- Do not bypass admin review for imported/generated questions
- Validate answers server-side only
- Slack = habit + quick study; web app = immersion + deeper learning

---

## How to Use This File

1. **Before any phase:** Read alignment docs (ALIGNMENT_VARIABLES, PHASE0_DESIGN_LOCK).
2. **Before Phase 3:** See [docs/SYSTEM_DESIGN_DAILY_QUESTIONS.md](docs/SYSTEM_DESIGN_DAILY_QUESTIONS.md) for implementation details.
3. **After each phase:** Check off completed items, append to [docs/PHASE_COMPLETIONS.md](docs/PHASE_COMPLETIONS.md).
4. **Scope changes:** Call them out and update the list explicitly.
