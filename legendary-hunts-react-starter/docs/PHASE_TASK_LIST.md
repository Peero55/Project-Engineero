# Phase Task List

## Phase 0 — Foundation lock
- [x] Lock core loop: Daily -> Encounter -> Mini Boss -> Legendary Boss -> Mastery (`docs/PHASE0_FOUNDATION_LOCK.md`, `lib/game-rules.ts`)
- [x] Lock combat rules and defeat rules (same)
- [x] Lock MVP boundaries (same)

## Phase 1 — Core infrastructure
- [x] App shell (existing sidebar + routes; Phase 1 adds health API + instrumentation)
- [x] Environment config (`lib/env.ts`, `.env.example`)
- [x] Logging and validation (`lib/logger.ts`, `lib/validation.ts`)
- [x] Database schema drafting (`docs/schema/DRAFT_SCHEMA.sql`)

## Phase 2 — Question engine
- Question retrieval by topic and difficulty
- Repetition avoidance
- Server-side answer validation
- Explanation delivery

## Phase 3 — Slack daily system
- Daily 5-question loop
- Button answers
- Short explanation feedback
- Deep-link to web explanation

## Phase 4 — Encounter system
- 4-question battle loop
- HP, damage, attack selection
- Enemy types by topic and difficulty

## Phase 5 — Progression
- XP and leveling
- Topic mastery scores
- Weak-topic detection
- Unlock attack tiers

## Phase 6 — Basic web app
- Dashboard
- Hunts list
- Battle screen
- Profile summary

## Phase 7 — Content ingestion
- PDF / DOCX / CSV import jobs
- Concept extraction
- Question family generation
- Review and publish queue

## Phase 8 — Boss systems
- Mini-boss checks
- Legendary sequence
- Cooldowns and rewards

## Phase 9 — Team layer
- Teams and memberships
- Weekly challenge model
- Leaderboards
