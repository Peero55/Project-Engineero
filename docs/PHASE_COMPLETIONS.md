# Phase Completions — Coordinator Handoff

When a **plan** or **phase** is completed, append a new section below using this template. This document is the coordinator handoff for continuity across sessions.

**Alignment:** Phases must not violate [ALIGNMENT_VARIABLES.md](ALIGNMENT_VARIABLES.md). See [PHASE0_DESIGN_LOCK.md](PHASE0_DESIGN_LOCK.md) and [.cursor/rules/alignment.mdc](../.cursor/rules/alignment.mdc).

---

## Template (copy for new entries)

```markdown
## [Phase/Plan Name] — [Date]

### Phase completed:
- 

### Files changed:
- 

### Migrations added:
- 

### Contracts added/changed:
- 

### Open questions:
- 

### Known risks:
- 
```

---

## Phase 0 — Design Lock — 2025-03-22

### Phase completed:
- Phase 0 Design Lock (Product & System Definition)

### Files changed:
- `docs/PHASE0_DESIGN_LOCK.md` (created)
- `docs/PHASE_COMPLETIONS.md` (created)
- `supabase/migrations/008_difficulty_tier_5.sql` (created)
- `packages/types/src/question.ts` (DifficultyTier 1-5)
- `packages/config/src/game.ts` (ATTACK_BY_TIER, comments)
- `packages/core/src/question-engine.ts` (includeLabs, tier 1-4 default)
- `apps/web/src/app/api/battle/answer/route.ts` (chosen_attack from tier)
- `apps/web/src/app/api/battles/answer/route.ts` (chosen_attack, damage from tier)
- `.cursor/rules/phase-completion.mdc` (created)

### Migrations added:
- `008_difficulty_tier_5.sql` — allows `difficulty_tier` 1-5 (tier 5 for labs)

### Contracts added/changed:
- `DifficultyTier`: extended to `1 | 2 | 3 | 4 | 5`
- `ATTACK_BY_TIER`: new mapping `1→light, 2→medium, 3→heavy, 4→ultimate`
- `GetQuestionInput.includeLabs`: new optional param for lab question selection

### Open questions:
- Ultimate attacks (tier 4): mastery-level gate not yet implemented
- Lab flow (tier 5): `includeLabs` exists but no lab UI or flow

### Known risks:
- Migration 008: constraint name `questions_difficulty_tier_check` may differ on some Postgres setups; verify before deploy
- Dual battle routes (`/battle/answer` vs `/battles/answer`): `battles/answer` uses simplified logic; consider consolidating

---

## Alignment Docs & Planning Consolidation — 2025-03-22

### Phase completed:
- Created alignment variables docs and aligned all todo lists and planning docs with the plan

### Files changed:
- `docs/ALIGNMENT_VARIABLES.md` (created) — single source for alignment variables
- `config/alignment.variables.json` (created) — machine-readable alignment config
- `TASKLIST.md` (modified) — Phase 3 tasks from SYSTEM_DESIGN, alignment refs, Locked Rules
- `docs/SYSTEM_DESIGN_DAILY_QUESTIONS.md` (modified) — alignment refs, TASKLIST link
- `docs/PHASE_COMPLETIONS.md` (modified) — alignment note, consolidation entry
- `docs/CURSOR_HANDOFF.md` (modified) — alignment docs first in read order
- `README.md` (modified) — Build Rules link to alignment docs

### Migrations added:
- None

### Contracts added/changed:
- None

### Open questions:
- None

### Known risks:
- None

---

## Phase 3 — First functional flow (Slack daily questions) — 2025-03-24

### Phase completed:
- Daily question data model, platform-agnostic core service, Next.js API routes, Slack Block Kit flow (on-demand delivery + answer + web deep link), minimal web dashboard and deep-link landing.

### Files changed:
- `supabase/migrations/009_daily_questions.sql` (created) — `daily_question_config`, `daily_question_deliveries`, seed Network+ + global config
- `packages/config/src/daily.ts` (created), `packages/config/src/index.ts` (modified) — `NETWORK_PLUS_CERTIFICATION_ID`, daily defaults
- `packages/core/src/daily-question.ts` (created), `packages/core/src/index.ts` (modified) — `getNextDailyQuestion`, `recordDailyAnswer`, `canReceiveQuestion`, `setDailyDeliveryMessageTs`
- `apps/web/src/lib/internal-api.ts`, `apps/web/src/lib/platform-user.ts` (created) — optional `INTERNAL_API_SECRET`, Slack user resolution
- `apps/web/src/app/api/daily-question/route.ts`, `answer/route.ts`, `message-ts/route.ts` (created)
- `apps/web/src/app/page.tsx`, `apps/web/src/app/dashboard/page.tsx` (modified/created) — deep link redirect + dashboard shell
- `apps/slack/src/lib/daily-api.ts`, `apps/slack/src/blocks/daily-question.ts`, `apps/slack/src/services/daily-quiz.ts` (created)
- `apps/slack/src/listeners/actions.ts`, `shortcuts.ts` (modified) — real daily quiz + `answer_daily_question`
- `apps/slack/package.json` (modified) — `@slack/types` dependency
- `.env.example` (modified) — `INTERNAL_API_SECRET` note
- `TASKLIST.md` (modified) — Phase 3 marked complete

### Migrations added:
- `009_daily_questions.sql` — daily delivery/config tables, indexes, RLS enabled, seed rows for Network+ (`11111111-1111-4111-8111-111111111101`) and global default (5 questions/day, UTC)

### Contracts added/changed:
- POST `/api/daily-question` — `{ platformUserId, platform, certificationId?, displayName?, avatarUrl? }` → question payload or `{ atQuota, message }`
- POST `/api/daily-question/answer` — `{ platformUserId, platform, questionId, selectedOptionIds, responseMs, ... }` → `{ correct, explanation }`
- POST `/api/daily-question/message-ts` — stores Slack `ts` on delivery row
- Core: `GetNextDailyQuestionResult`, `RecordDailyAnswerOutput`, `DailyPlatform`

### Open questions:
- Full web login (OAuth/session) beyond `getOrCreateUserBySlackId` for browser users not yet implemented
- Scheduled delivery (cron) still optional/future

### Known risks:
- `INTERNAL_API_SECRET` should be set in production for both web and Slack so daily APIs are not open to unauthenticated callers when web is public
- Daily flow still calls `submitAnswer` (updates `user_stats` / history); XP/HP are not surfaced in Slack UI for this phase

---

## Unified Encounter Model — Design Lock — 2025-03-22

### Phase completed:
- Locked unified Encounter model as core principle: one loop, multiple interaction types

### Files changed:
- `docs/ENCOUNTER_MODEL.md` (created) — full spec for encounter types, chains, mix strategy, guardrails
- `docs/DECISION_LOG.md` (modified) — DL-006
- `docs/PHASE0_DESIGN_LOCK.md` (modified) — section 4 Encounter model, checklist
- `docs/ALIGNMENT_VARIABLES.md` (modified) — section 6 Encounter model, updated modularity guards
- `.cursor/rules/alignment.mdc` (modified) — ENCOUNTER_MODEL in read list, Required Architecture
- `config/alignment.variables.json` (modified) — encounterModel, tier5 rules
- `TASKLIST.md` (modified) — Phase 4 encounter ref, docs status

### Migrations added:
- None (design lock only)

### Contracts added/changed:
- `Encounter`, `EncounterType`, `Puzzle`, `Lab` — documented in ENCOUNTER_MODEL.md
- Chain fields: `chain_id`, `chain_position`, `chain_length`

### Open questions:
- Implementation order: Phase 3 (daily questions) stays question-only; Phase 4+ introduces encounter mix

### Known risks:
- Existing battle routes use question-only flow; refactor to encounter engine when Phase 4 starts

---

## Update Cursor Handoff — 2025-03-22

### Phase completed:
- Replaced CURSOR_HANDOFF with streamlined handoff; aligned alignment docs, encounter model, and rules

### Files changed:
- `docs/CURSOR_HANDOFF.md` (modified) — product direction, non-negotiable rules, encounter philosophy, encounter variability rules, working mode
- `docs/ALIGNMENT_VARIABLES.md` (modified) — section 7 Encounter Variability
- `docs/ENCOUNTER_MODEL.md` (modified) — section 12 Encounter Variability Rules
- `.cursor/rules/alignment.mdc` (modified) — read order aligned to CURSOR_HANDOFF; encounter variability in Required Behavior

### Migrations added:
- None

### Contracts added/changed:
- None

### Open questions:
- None

### Known risks:
- None

---

## Master Alignment Integration — 2025-03-22

### Phase completed:
- Integrated MASTER ALIGNMENT PROMPT into alignment rule; expanded ALIGNMENT_VARIABLES with lab requirements and constraints

### Files changed:
- `.cursor/rules/alignment.mdc` (modified) — replaced with full MASTER ALIGNMENT PROMPT (core product, architecture, difficulty, encounter, lab, progression, integration, data tracking, MVP constraints, implementation rules, stop condition)
- `docs/ALIGNMENT_VARIABLES.md` (modified) — added sections 9–12: Hard architecture constraints (forbidden/allowed words), Lab attempt requirements, Data tracking rules, MVP constraints

### Migrations added:
- None

### Contracts added/changed:
- lab_attempts table design documented in alignment docs

### Open questions:
- None

### Known risks:
- None

---

## PRD & TASKLIST reconciliation — 2026-03-25

### Phase completed:
- Compared [.cursor/rules/PRD.md](../.cursor/rules/PRD.md) with `TASKLIST.md`, alignment docs, and current monorepo; reconciled PRD §7 with repository phases; documented Slack stack (Bolt/Node vs Deno), encounter variability vs short/mid/long templates, and core vs theme language

### Files changed:
- `.cursorrules` (created) — root pointer to `.cursor/rules/` and alignment precedence
- `.cursor/rules/PRD.md` (modified) — implementation alignment banner, PRD ↔ repo phase map, encounter-length note, Slack/web phase wording
- `TASKLIST.md` (modified) — PRD crosswalk, Phase 4/6 checklist accuracy (partial completions), variable encounter wording

### Migrations added:
- None

### Contracts added/changed:
- None (documentation-only)

### Open questions:
- Confirm long-term choice: keep Slack Bolt (Node) in monorepo vs migrating to Deno Slack SDK as in original PRD text
- Phase 4–6 implementation scope for next execution pass (pages vs encounter refactor first)

### Known risks:
- `packages/core/src/battle-engine.ts` still assumes question-sized turns; full encounter model will require schema + API follow-up

---

## Phase 4 — Encounter battle schema + core — 2026-03-25

### Phase completed:
- Supabase `puzzles`, `battle_encounters`; battle pause + activity columns; nullable `battle_turns.question_id` for puzzle turns; encounter generation + resolution in core; puzzle evaluation server-side with client-safe payload stripping; API routes for start/answer/pause/resume; 30m client idle logout (no limit on battle pause)

### Files changed:
- `supabase/migrations/010_battle_encounters.sql` (new)
- `packages/config/src/game.ts`, `session.ts`, `index.ts` — encounter ranges, puzzle mix, `SESSION_CONFIG`
- `packages/types/src/encounter.ts`, `index.ts`
- `packages/core/src/encounter-sequence.ts`, `puzzle-evaluation.ts`, `battle-engine.ts`, `index.ts`
- `apps/web/src/app/api/battle/start/route.ts`, `answer/route.ts`, `pause/route.ts`, `resume/route.ts` — encounter-aware
- `apps/web/src/app/api/battles/start/route.ts` — encounter-aware
- `apps/web/src/components/session-idle-gate.tsx`, `stash-slack-params.tsx`, `app/providers.tsx`, `layout.tsx`, `dashboard/page.tsx`
- `TASKLIST.md` (Phase 4 partial checkboxes)

### Migrations added:
- `010_battle_encounters.sql` — puzzles, battle_encounters, battle_sessions `last_activity_at` / `paused_at`, status `paused`, battle_turns encounter FK + nullable question_id, seed puzzle `osi-layer-order`

### Contracts added/changed:
- `POST /api/battle/start` / `POST /api/battles/start` return `encounters`, `activeEncounter`
- `POST /api/battle/answer` with encounters requires `encounterId`; question path: `questionId` + `selectedOptionIds`; puzzle path: `puzzlePayload` (e.g. `{ order: string[] }`)
- `POST /api/battle/pause`, `POST /api/battle/resume` — body `{ slackUserId, battleId }`

### Open questions:
- GitHub Slack app: create after local QA (user); Bolt remains the integration stack
- Remote `db push` may require certification seed before migration 009 on empty DBs

### Known risks:
- `battles/answer` route still legacy (no encounter wiring); prefer `/api/battle/*` for new work

---

## Phase 4 — Web UI, hunts, timeout, hunt progress — 2026-03-25

### Phase completed:
- Phase 4 game core closed: hunt pages, battle encounter UI (question vs puzzle), topic explanation route, GET APIs for hunts and battle state; server-side per-encounter timeout; hunt progress on battle end; `battle/start` links battles to hunts; resume refreshes encounter timer

### Files changed:
- `packages/core/src/answer-evaluation.ts` — `timedOut` on `submitAnswer`
- `packages/core/src/hunt-progress.ts` (new), `index.ts`
- `packages/core/src/encounter-sequence.ts` — `BattleSessionView`, `fetchBattleSessionForView`, `fetchBattleViewState`, question `options`, `startedAt` on presentations
- `packages/core/src/battle-engine.ts` — `refreshActiveEncounterStartedAt`
- `packages/config/src/game.ts` — `mapHuntTypeToBattleType`
- `apps/web/src/app/api/battle/start/route.ts` — optional `huntId`, hunt progress row creation
- `apps/web/src/app/api/battle/answer/route.ts` — timeout, `applyHuntProgressAfterBattleEnd`, response `encounters` / `activeEncounter` / `timedOut`
- `apps/web/src/app/api/battle/resume/route.ts` — refresh active encounter `started_at`
- `apps/web/src/app/api/hunts/route.ts`, `api/hunts/[huntId]/route.ts`, `api/battle/[battleId]/route.ts` (new)
- `apps/web/src/app/hunts/page.tsx`, `hunts/[huntId]/page.tsx`, `hunts/start-battle-button.tsx`
- `apps/web/src/app/battles/[battleId]/page.tsx`, `battle-client.tsx`
- `apps/web/src/app/explanations/[topicSlug]/page.tsx`
- `apps/web/src/app/page.tsx` — link to Hunts
- `TASKLIST.md` — Phase 4 marked complete

### Migrations added:
- None

### Contracts added/changed:
- `GET /api/hunts`, `GET /api/hunts/[huntId]?slackUserId=`, `GET /api/battle/[battleId]?slackUserId=`
- `POST /api/battle/start` accepts `huntId`; maps `hunt_type` → `battle_type` when `battleType` omitted
- `POST /api/battle/answer` returns `timedOut`, `encounters`, `activeEncounter` (encounter path)

### Open questions:
- Multi-select questions in DB: UI uses single-select radio; extend if `multi_select` becomes common
- Topic slug in `explanations/[topicSlug]`: first match if slug repeats across domains

### Known risks:
- Legacy `POST /api/battles/start` requires explicit `battleType`; does not map hunt type — prefer `/api/battle/start` for hunt-driven battles

---

## Phases 1–4 — QA sweep — 2026-03-25

### Phase completed:
- Automated verification: `pnpm typecheck`, `pnpm build`, and `pnpm lint` (after adding committed ESLint config); documented remote DB / migration gap blocking live battle E2E

### Files changed:
- `apps/web/.eslintrc.json` (new) — `next/core-web-vitals` + `next/typescript` so `next lint` is non-interactive in CI
- `apps/web/package.json` — devDependencies `eslint`, `eslint-config-next`
- `apps/web/src/app/api/battle/start/route.ts` — `prefer-const` for `huntId`
- `pnpm-lock.yaml` — lockfile updated for ESLint packages

### Migrations added:
- None

### Contracts added/changed:
- None

### Open questions:
- None

### Known risks:
- **Remote Supabase must include migration `010_battle_encounters.sql`**. If `battle_sessions.last_activity_at` (and related encounter tables) are missing, `POST /api/battle/start` returns schema-cache errors and battles cannot run. Apply with `pnpm db:push` (or dashboard SQL) against the linked project after resolving any earlier migration ordering issues on empty DBs.
- Full browser E2E (hunt → battle → win/loss) was not re-run after schema fix; re-validate once `010` is applied.
- `next lint` is deprecated in favor of ESLint CLI per Next.js 16 — migrate when upgrading Next.

---

## QA — 2026-03-25 (pre–Phase 5 slice)

### Phase completed:
- Re-ran `pnpm typecheck`, `pnpm build`, `pnpm lint` — all passed before implementing Phase 5 admin MVP.

### Files changed:
- None (verification only)

### Migrations added:
- None

### Contracts added/changed:
- None

### Open questions:
- None

### Known risks:
- Live DB E2E still depends on migrations `010`+ applied on the linked Supabase project.

---

## Phase 5 (partial) — Admin question review MVP — 2026-03-25

### Phase completed:
- Env-gated admin: `ADMIN_API_SECRET`; HTTP-only session cookie (8h) or `Authorization: Bearer`; question list with topic embed, search, active filter, PATCH `is_active` for review-before-activation workflow; `/admin/login` + `/admin/questions`; dev smoke banner + `.env.example` + `env:check` warn

### Files changed:
- `apps/web/src/lib/admin-auth.ts` (new)
- `apps/web/src/app/api/admin/session/route.ts` (new) — POST login, DELETE logout
- `apps/web/src/app/api/admin/questions/route.ts` (new) — GET list
- `apps/web/src/app/api/admin/questions/[id]/route.ts` (new) — PATCH `is_active`
- `apps/web/src/app/admin/layout.tsx`, `admin/page.tsx`, `admin/login/page.tsx`, `admin/questions/layout.tsx`, `admin/questions/page.tsx` (new)
- `apps/web/src/components/dev-api-smoke-banner.tsx` — admin hint
- `.env.example` — `ADMIN_API_SECRET`
- `scripts/validate-env.ts` — optional warn when admin secret unset
- `TASKLIST.md` — Phase 5 overview + checklist partial

### Migrations added:
- None

### Contracts added/changed:
- `POST /api/admin/session` body `{ secret }`; `DELETE /api/admin/session`
- `GET /api/admin/questions?limit=&offset=&active_only=&q=` — `{ questions, total, limit, offset }`
- `PATCH /api/admin/questions/[id]` body `{ is_active: boolean }`

### Open questions:
- Richer editor, import pipeline, Edge Functions, recommendations — remaining Phase 5 scope

### Known risks:
- Admin auth is shared-secret only (no SSO); rotate `ADMIN_API_SECRET` if leaked; do not expose in client bundles (server-only env).

---

## Web fantasy UI port + battle feedback/codex slice — 2026-03-25

### Phase completed:
- Ported locked fantasy/stone encounter shell from starter into `apps/web` (scoped CSS + components under `components/fantasy/`); battle route uses `ScreenShell`, `PlayerInfoBar`, stone `Panel`, bars, `AttackBar`, `FeedbackLayer`.
- Core `fetchBattleViewState` now returns theme-neutral `player` (profile XP/level/display name + `xpToNextLevel`), and encounters include `difficultyTier` + `topicSlug` for strike alignment and study links.
- Battle client consumes `POST /api/battle/answer` JSON for feedback (correct/incorrect flash, damage, XP gain snippet, explanation text, link to `/explanations/[slug]`); strike tier must match `ATTACK_BY_TIER` for the active question.
- Added `/codex` (domains → topics → explanations); enriched `/explanations/[topicSlug]` with fantasy `Panel`, optional sample `short_explanation`, links to codex/hunts/home.

### Files changed:
- `packages/core/src/encounter-sequence.ts` — `BattlePlayerView`, `player` on `fetchBattleViewState`, `difficultyTier`/`topicSlug` on presentations, `xpForLevel` import
- `apps/web/src/app/layout.tsx` — import `fantasy-ui.css` (rules scoped to `.lh-fantasy-ui`)
- `apps/web/src/styles/fantasy-ui.css` (new)
- `apps/web/src/components/fantasy/**` (new) — layout, ui, game components
- `apps/web/src/app/battles/[battleId]/battle-client.tsx`, `page.tsx`
- `apps/web/src/app/codex/page.tsx` (new)
- `apps/web/src/app/explanations/[topicSlug]/page.tsx`

### Migrations added:
- None

### Contracts added/changed:
- `GET /api/battle/[battleId]` JSON adds `player: BattlePlayerView | null`; each encounter may include `difficultyTier`, `topicSlug`
- Consumers of `fetchBattleViewState` must accept `player` (TypeScript)

### Open questions:
- Profile HP (`profiles.current_hp`) vs battle HP (`battle_sessions.player_hp_current`): UI shows battle HP only; whether to sync profile vitals after battles is product TBD.
- `/map` and full hunt-map UI from starter not ported (not in existing `apps/web` routes).

### Known risks:
- Global `fantasy-ui.css` is loaded app-wide but selectors require `.lh-fantasy-ui` ancestor so non-battle pages should stay visually unchanged unless wrapped.
- Explanations show one arbitrary active question’s `short_explanation` as “Example note” — adequate for MVP link-out, not a full topic article.

---

## Knowledge continuity + domain-safe explanations — 2026-03-25

### Phase completed:
- Canonical study URL: `/explanations/[domainSlug]/[topicSlug]`; legacy `/explanations/[topicSlug]` redirects when unambiguous or when `?domain=` is present, else 404.
- DB: `user_topic_continuity` + unique `(topics.domain_id, topics.slug)`; RLS aligned with other user tables.
- Core: `topic-mastery` (0–1 score/readiness), `study-explanation` (remediation → exposure → anchor), `knowledge-continuity` (discovery/note unlock, aggregates, domain summaries); `submitAnswer` → continuity refresh; encounter presentations include `domainSlug`.
- Web: explanation page uses real selection + view tracking; codex/dashboard/hunt show mastery/continuity strings without changing the locked fantasy shell layout.

### Files changed:
- `supabase/migrations/012_user_topic_continuity.sql` (new)
- `packages/core/src/topic-mastery.ts`, `study-explanation.ts`, `knowledge-continuity.ts` (new); `index.ts`, `answer-evaluation.ts`, `encounter-sequence.ts`
- `apps/web/src/app/explanations/[domainSlug]/[topicSlug]/page.tsx` (new); `explanations/[topicSlug]/page.tsx` (legacy redirect)
- `apps/web/src/app/codex/page.tsx`, `dashboard/page.tsx`, `hunts/[huntId]/page.tsx`, `battles/[battleId]/battle-client.tsx`

### Migrations added:
- `012_user_topic_continuity.sql` — `idx_topics_domain_id_slug`, `user_topic_continuity` + RLS

### Contracts added/changed:
- `BattleEncounterPresentation.domainSlug` optional
- Study URLs and Slack/deep links should migrate to two-segment paths where possible

### Open questions:
- Composite unique index may fail if existing data has duplicate `(domain_id, slug)` — clean before migrate.

### Known risks:
- `fetchWeakestTopicSummaries` / per-domain fetches are N+1 heavy; acceptable for current scope.
- Hunt “readiness” averages only topics the learner has practiced at least once.

---

## Progression + daily loop integration — 2026-03-25

### Phase completed:
- Confirmed daily answers and web battles both flow through `submitAnswer` → `refreshContinuityAfterQuestionAnswer`; documented on `recordDailyAnswer`.
- `RecordDailyAnswerOutput` + web `POST /api/daily-question/answer` return optional `studyPath` (`domainSlug`, `topicSlug`) for canonical study links.
- Single readiness snapshot in core: `summarizeDomainReadiness`, `fetchUserContinuityCounts`, `fetchDashboardKnowledgeSnapshot` (counts + weakest + per-domain readiness).
- Dashboard surfaces continuity counts, domain readiness lines, weakest topics with `/explanations/[domainSlug]/[topicSlug]` links.
- Codex and hunt detail use `summarizeDomainReadiness` on `fetchDomainTopicSummaries` (same math as dashboard).
- Hunt page copy clarifies alignment with dashboard/codex; JSX fragment fix for alternate readiness sentence.
- Slack daily feedback: blocks + `postDailyAnswer` consume `studyPath`; primary web button uses two-segment explanation URL when present.
- Battle wrong-answer deep link prefers canonical study URL; avoids legacy `/explanations/:topicSlug` when domain slug unknown.

### Files changed:
- `packages/core/src/daily-question.ts` — JSDoc; `studyPath` on output; slug resolution after successful daily record
- `packages/core/src/knowledge-continuity.ts` — `DomainReadinessBreakdown`, `summarizeDomainReadiness`, `UserContinuityCounts`, `fetchUserContinuityCounts`, `DashboardKnowledgeSnapshot`, `fetchDashboardKnowledgeSnapshot`
- `packages/core/src/index.ts` — re-exports as needed
- `apps/web/src/app/api/daily-question/answer/route.ts` — pass through `studyPath`
- `apps/web/src/app/dashboard/page.tsx` — `fetchDashboardKnowledgeSnapshot` only
- `apps/web/src/app/codex/page.tsx` — `summarizeDomainReadiness` per domain
- `apps/web/src/app/hunts/[huntId]/page.tsx` — shared readiness helper + copy + JSX fix
- `apps/web/src/app/battles/[battleId]/battle-client.tsx` — canonical study links
- `apps/slack/src/blocks/daily-question.ts`, `lib/daily-api.ts`, `services/daily-quiz.ts` — `studyPath` wiring (`dist/` updated via `pnpm build`)

### Migrations added:
- None (reuses `user_topic_continuity` / existing topic-domain slug constraints)

### Contracts added/changed:
- `RecordDailyAnswerOutput.studyPath?: { domainSlug, topicSlug }`
- Daily answer API JSON: optional `studyPath`
- Core: `summarizeDomainReadiness`, `fetchDashboardKnowledgeSnapshot`, related types

### Open questions:
- Whether to remove or further narrow legacy `/explanations/[topicSlug]` once all inbound links are migrated (per product).

### Known risks:
- `studyPath` omitted if topic/domain row or slug missing after answer — Slack falls back to dashboard link as before.
- Repos that commit `apps/slack/dist` must rebuild Slack after TS changes so runtime matches `src`.

---

## Content + admin ingestion — 2026-03-25

### Phase completed:
- DB staging pipeline: `content_ingests`, `content_staging_items`, `question_concept_groups`; `questions.concept_group_id`; `source_type` adds `ingested`.
- Core (`content-ingest.ts`): structured markdown parser, plain-text fallback + heuristic MCQ variants, slugify/validation helpers (logic-only, no I/O).
- Web: PDF/text extraction (`pdf-parse` `PDFParse` Node runtime), ingest API, staging PATCH/promote, certification listing; admin pages `/admin/content`, `/admin/content/[ingestId]` (same zinc patterns as existing admin).
- Promotion creates/updates domains and topics by slug, inserts questions as **inactive** with `short_explanation` + `long_explanation` and answer options; questions require existing topic in DB (approve topic rows first).

### Files changed:
- `supabase/migrations/013_content_ingestion.sql` (new)
- `docs/CONTENT_INGEST_FORMAT.md` (new)
- `packages/core/src/content-ingest.ts`, `packages/core/src/index.ts`
- `apps/web/next.config.ts` — `serverExternalPackages: ['pdf-parse']`
- `apps/web/package.json` — `pdf-parse`, `@types/pdf-parse`
- `apps/web/src/lib/content-promotion.ts` (new)
- `apps/web/src/app/api/admin/certifications/route.ts`, `content/ingest/route.ts`, `content/ingests/route.ts`, `content/ingest/[ingestId]/route.ts`, `content/staging/[itemId]/route.ts`, `content/staging/[itemId]/promote/route.ts`
- `apps/web/src/app/admin/layout.tsx`, `admin/content/page.tsx`, `admin/content/[ingestId]/page.tsx`

### Migrations added:
- `013_content_ingestion.sql` — concept groups, ingest + staging tables/enums, `questions.concept_group_id`, `source_type` check extended

### Contracts added/changed:
- Admin JSON/multipart ingest; staging row shape; promote response `{ ok, domainId?, topicId?, questionId? }`
- Structured format documented in `docs/CONTENT_INGEST_FORMAT.md`

### Open questions:
- Whether to add rich form editors instead of JSON patch for staging edits.
- PDF quality depends on source; scanned PDFs may need OCR (not included).

### Known risks:
- `pdf-parse` / `pdfjs` + `@napi-rs/canvas` may fail in some serverless footprints — deploy target must support native canvas; ingest route uses `runtime = "nodejs"`.
- Heuristic variants are template MCQs — human review expected before activation.
- Staging `guided_lab` excluded; tier 5 not created through this path.

---

## UI verification + MVP playability — 2026-03-26

### Phase completed:
- Audited learner routes (dashboard, codex, hunts, battles, explanations, admin content) against `lh-fantasy-ui` / `HuntShell` patterns; documented in `docs/UI_AUDIT_REPORT.md`.
- Screenshot pack: `docs/ui-audit-screenshots/01-dashboard.png` … `06-admin-content.png`.
- **Consistency fixes:** dashboard uses `Panel` + fantasy shell like codex/explanations; cross-route footer/links preserve `slack_user_id`; battle “no learner id” gate uses fantasy panel; battle feedback shows explanation in `.feedback-explanation`; hunt start maps schema-cache errors to migration 010 hint.
- **Routing:** removed conflicting `explanations/[topicSlug]/page.tsx`; legacy single-segment URLs handled via `src/middleware.ts` rewrite to `explanations/legacy/[topicSlug]`.

### Files changed:
- `apps/web/src/app/dashboard/page.tsx`, `codex/page.tsx`, `hunts/[huntId]/page.tsx`, `hunts/start-battle-button.tsx`
- `apps/web/src/app/battles/[battleId]/page.tsx`, `battles/[battleId]/battle-client.tsx`
- `apps/web/src/app/explanations/[domainSlug]/[topicSlug]/page.tsx`
- `apps/web/src/app/explanations/legacy/[topicSlug]/page.tsx` (new)
- `apps/web/src/middleware.ts` (new)
- `apps/web/src/app/explanations/[topicSlug]/page.tsx` (removed)
- `apps/web/src/styles/fantasy-ui.css`
- `docs/UI_AUDIT_REPORT.md`, `docs/ui-audit-screenshots/*`, `docs/ui-audit-screenshots/README.md`

### Migrations added:
- None

### Contracts added/changed:
- Public URL `/explanations/:topicSlug` (one segment) still works; internally rewritten to legacy handler (redirect to canonical two-segment path).

### Open questions:
- Optional future pass: put hunt detail under `lh-fantasy-ui` for a single shell everywhere (vs current `HuntShell` for hunt/marketing).

### Known risks:
- Full **hunt → battle** playability requires Supabase through **`010_battle_encounters.sql`** (`last_activity_at`, etc.) — see `UI_AUDIT_REPORT.md`.

---

## Battle / gameplay UI layer (EncounterScreen + global status) — 2026-03-25

### Phase completed:
- Added **`EncounterScreen`** composition (duel row + battle `Panel` + action + feedback) and extracted **`EnemyEncounterPanel`**, **`PlayerBattleVitals`**, **`QuestionPanel`** for the combat loop (answer → strike; wrong/timeout reflected via existing API + feedback).
- **Enemy vs player duel row:** creature icon + foe HP; player HP + XP bars with **flash** states on hit / damage / XP gain.
- **Global `FantasyPlayerStatusBar`** on fantasy learner routes (dashboard, codex, topic explanations) when `slack_user_id` is present; battle page uses `BattleClient`’s `PlayerInfoBar` only (no duplicate HUD).
- **`GET /api/user/profile`** now includes **`xpToNextLevel`** (`xpForLevel(level)` from `@legendary-hunts/config`) for consistent XP labels.
- Battle route layout widened to **`max-w-4xl`** for the encounter surface.

### Files changed:
- `apps/web/src/components/fantasy/game/EncounterScreen.tsx` (new)
- `apps/web/src/components/fantasy/game/EnemyEncounterPanel.tsx` (new)
- `apps/web/src/components/fantasy/game/PlayerBattleVitals.tsx` (new)
- `apps/web/src/components/fantasy/game/QuestionPanel.tsx` (new)
- `apps/web/src/components/fantasy/layout/FantasyPlayerStatusBar.tsx` (new)
- `apps/web/src/app/battles/[battleId]/battle-client.tsx` (refactor onto EncounterScreen + duel + flashes)
- `apps/web/src/app/battles/[battleId]/page.tsx` (max width + spacing)
- `apps/web/src/app/dashboard/page.tsx`, `codex/page.tsx`, `explanations/[domainSlug]/[topicSlug]/page.tsx` (FantasyPlayerStatusBar)
- `apps/web/src/components/fantasy/ui/HealthBar.tsx`, `XPBar.tsx` (optional `flash` props)
- `apps/web/src/app/api/user/profile/route.ts` (`xpToNextLevel`)
- `apps/web/src/styles/fantasy-ui.css` (encounter duel, enemy panel, player vitals, bar flash keyframes, status bar shell)
- `docs/PHASE_COMPLETIONS.md` (this entry)

### Migrations added:
- None

### Contracts added/changed:
- **`GET /api/user/profile`**: response shape adds **`xpToNextLevel`** (number).

### Open questions:
- None

### Known risks:
- None beyond existing battle DB migration requirements for live encounters.

---

## GAMEPLAY_LAYER_QA — 2026-03-26

### Phase completed:
- Route, battle-flow (code review + partial browser), feedback, layout, consistency, and state checks for the gameplay layer; **`docs/GAMEPLAY_QA_REPORT.md`** + screenshot pack **`docs/gameplay-qa/`**; prioritized bug list and blockers documented.
- **Runtime verification:** `next build` / `next start` on port 3001 for explanations + hunts; **`next dev`** dynamic route occasionally hit stale vendor-chunk error until **`rm -rf apps/web/.next`** (documented P1).
- **No product code changes** in this phase (QA + documentation only).

### Files changed:
- `docs/GAMEPLAY_QA_REPORT.md` (new)
- `docs/gameplay-qa/README.md` (new)
- `docs/gameplay-qa/*.png` (screenshots)
- `docs/PHASE_COMPLETIONS.md` (this entry)

### Migrations added:
- None

### Contracts added/changed:
- None

### Open questions:
- Full EncounterScreen E2E screenshot when stable test `battleId` + `slack_user_id` + DB are available.

### Known risks:
- Hunt UUID in docs vs `007_seed_network_plus.sql` may differ by segment — use list page / DB as source of truth (P2 in QA report).

---

## LIVE_BATTLE_VALIDATION — 2026-03-26

### Phase completed:
- **Validation-only** run: attempted real battle start from **Networking Fundamentals Hunt** with learner **`preacher`** against remote Supabase.
- **Blocked at `POST /api/battle/start`:** remote schema missing **`battle_sessions.last_activity_at`** (migration **010** not applied); UI shows actionable migration alert.
- **Artifacts:** [`docs/BATTLE_VALIDATION_REPORT.md`](BATTLE_VALIDATION_REPORT.md), screenshots [`docs/battle-validation/`](battle-validation/) (hunt ready, start blocked, dashboard context).
- **No code or gameplay logic changes** in this phase.

### Files changed:
- `docs/BATTLE_VALIDATION_REPORT.md` (new)
- `docs/battle-validation/README.md` (new)
- `docs/battle-validation/*.png` (screenshots)
- `docs/PHASE_COMPLETIONS.md` (this entry)

### Migrations added:
- None

### Contracts added/changed:
- None

### Open questions:
- Resolve remote migration chain (`009` FK vs certifications seed, then `010+`) so E2E encounter screenshots can be captured in a follow-up validation pass.

### Known risks:
- **`pnpm db:push`** may fail mid-chain on partially seeded remotes — coordinate DBA / seed alignment before push.

---

## MVP blocker closure (DB + progression + hunts shell) — 2026-03-27

### Phase completed:
- **Database:** Hardened migrations **009** (daily config insert when cert exists), **010** (sample puzzle when topic exists), **011** (Network+ question seed wrapped in `DO` block when certification exists); pushed **011–013** to remote successfully after prior **`db:push`** fixes.
- **Progression:** `recordDailyAnswer` in core now calls **`applyProgression`** with the same **`times_seen` / difficulty inputs** as battle question encounters; **`POST /api/daily-question/answer`** returns **`progression`** for clients.
- **Hunts UI:** Scoped **`.lh-fantasy-ui .lh-panel`** to fantasy tokens; hunts list/detail use **`lh-hunt-*`** helpers (badges, hero, progress track, list row hover) instead of raw zinc/amber Tailwind.

### Files changed:
- `supabase/migrations/009_daily_questions.sql` — cert FK guard on per-cert daily config insert
- `supabase/migrations/010_battle_encounters.sql` — topic FK guard on sample puzzle insert
- `supabase/migrations/011_dev_seed_network_plus_questions.sql` — seed block skipped when Network+ cert missing
- `packages/core/src/daily-question.ts` — `applyProgression` after daily answer
- `apps/web/src/app/api/daily-question/answer/route.ts` — JSON includes `progression`
- `apps/web/src/styles/fantasy-ui.css` — fantasy `.lh-panel` override + hunt token classes
- `apps/web/src/app/hunts/page.tsx`, `apps/web/src/app/hunts/[huntId]/page.tsx` — token classes for panels/badges/progress
- `docs/PHASE_COMPLETIONS.md` (this entry)

### Migrations added:
- None (edits to existing migration files for idempotent remote push)

### Contracts added/changed:
- **`POST /api/daily-question/answer`:** response may include **`progression: { level, xp, xpGained }`**
- **`RecordDailyAnswerOutput`:** optional **`progression`**

### Open questions:
- Remote projects without **007** still get schema through **013** but empty Network+ seeds until **007** is applied or data is inserted manually.

### Known risks:
- Editing historical migration files can confuse environments that already applied older versions of those files; new clones and the fixed remote benefit from the guards.

---

## GitHub repo automation (CI, Dependabot, CODEOWNERS) — 2026-03-28

### Phase completed:
- Added **GitHub Actions** workflows: **CI** (Node 22, pnpm 10 frozen lockfile, Turbo `lint` / `typecheck` / `test` / `build` with `--if-present`) on `pull_request` and `push` to `main` and `dev`; **Secret Scan** (TruffleHog `v3.90.2`).
- Added **Dependabot** for npm and github-actions (weekly, PR limit 5).
- Added **CODEOWNERS** default owner `@Najm557` (team can replace with `@org/team`).
- Replaced **pull request template** with What/Why/How to test/Checklist (npm wording per spec).
- Extended **README** with **Required GitHub settings** (branch protection, required checks, Dependabot, secret scanning, CODEOWNERS note, GitHub-first editing).

### Files changed:
- `.github/workflows/ci.yml` (new)
- `.github/workflows/secret-scan.yml` (new)
- `.github/dependabot.yml` (new)
- `.github/CODEOWNERS` (new)
- `.github/pull_request_template.md` (replaced)
- `README.md` — Required GitHub settings section
- `docs/PHASE_COMPLETIONS.md` (this entry)

### Migrations added:
- None

### Contracts added/changed:
- None

### Open questions:
- Turn on **required status checks** in GitHub *Settings → Branches* after first successful Actions runs so check names are visible.
- Replace `CODEOWNERS` `*` entry with org team when available.

### Known risks:
- **CI build** may need env vars or secrets for some packages on GitHub if Next/Slack builds start failing; add repository/environment secrets and document in `docs/deployment.md` if required.

---

## GitHub automation v2 (split CI jobs, pnpm PR template, branch docs) — 2026-03-28

### Phase completed:
- **CI** workflow split into four jobs (`lint`, `typecheck`, `build`, `test`) with stable names for branch protection; **pnpm** + frozen lockfile everywhere; **test** job runs `pnpm run test` only when root `package.json` defines `scripts.test`, otherwise logs and exits success.
- **Secret Scan** aligned triggers with `main`/`dev` pushes + PRs; job id **secret-scan** for check naming.
- **Dependabot** — GitHub Actions updates grouped weekly under `groups.actions`; npm unchanged.
- **CODEOWNERS** minimal single line `* @Najm557`.
- **PR template** — pnpm-oriented checklist, no npm commands.
- **README** — expanded **Required GitHub settings**: `main` vs future `dev`, no approval minimum for now, squash-merge rationale, secret scanning, Dependabot + **auto-merge** documented as GitHub UI (not repo-file enforced).

### Files changed:
- `.github/workflows/ci.yml`
- `.github/workflows/secret-scan.yml`
- `.github/dependabot.yml`
- `.github/CODEOWNERS`
- `.github/pull_request_template.md`
- `README.md`
- `docs/PHASE_COMPLETIONS.md` (this entry)

### Migrations added:
- None

### Contracts added/changed:
- None

### Open questions:
- Confirm exact **required check** strings in *Settings → Branches* after first run (GitHub prefixes with workflow name).

### Known risks:
- **Dependabot auto-merge** for patch/minor only is policy + PR triage on GitHub; major bumps may still need manual handling.
