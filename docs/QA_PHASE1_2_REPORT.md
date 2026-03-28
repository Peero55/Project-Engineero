# Phase 1 & 2 QA Report

**Date:** 2026-03-22  
**Scope:** Database structure verification, API route testing, full flow validation

---

## Database Schema Verification ✅

### Migrations (7 total)

| Migration | Purpose | Status |
|-----------|---------|--------|
| 001_initial_schema | Core tables (users, profiles, certifications, domains, topics, questions, answer_options, hunts, hunt_progress, battle_sessions, battle_turns, user_question_history) | ✅ |
| 002_indexes_and_rls | Indexes for query patterns, RLS policies on all user-data tables | ✅ |
| 003_slack_installations | Slack OAuth installations table | ✅ |
| 004_phase2_engine | user_stats, battle columns (enemy_hp_start/current, player_hp_current) | ✅ |
| 005_slack_installations_rls | RLS on slack_installations (service-only) | ✅ |
| 006_schema_deployment | Unique indexes (domains, topics, answer_options) | ✅ |
| 007_seed_network_plus | Network+ certification, 5 domains, 8 topics, 1 hunt, 1 sample question | ✅ |

### Schema Alignment with Phase 2 Spec

- **users + profiles**: Slack auth, level, xp, HP in profiles ✅
- **questions + answer_options**: prompt, difficulty_tier 1–4, explanations ✅
- **user_stats**: topic-level correct/incorrect, total_response_ms ✅
- **battle_sessions**: enemy_hp_*, player_hp_current, status ✅
- **battle_turns**: question_id, was_correct, damage_dealt, damage_taken ✅

---

## Fixes Applied During QA

1. **Env loading**: Created `apps/web/.env.local` → `../../.env.local` symlink so Next.js loads root env vars.
2. **Question route**: `topicId`/`certificationId` optional params failed when `searchParams.get()` returned `null`; switched to `.nullish()` and `?? undefined`.
3. **UUID validation**: Seed IDs (e.g. `55555555-5555-5555-5555-555555555501`) failed Zod’s RFC 4122 check. Added `uuidSchema` in `lib/validations.ts` with a permissive hex regex.
4. **Seed migration**: Updated 007 to use RFC-compliant UUID formats for future deployments (version nibble 4, variant 8).

---

## API Route Test Results

| Route | Method | Auth | Result |
|-------|--------|------|--------|
| `/api/health` | GET | None | ✅ `{status:"ok"}` |
| `/api/slack/deeplink` | GET | None | ✅ Returns deep link URL |
| `/api/battle/start` | POST | slackUserId | ✅ Creates user + battle session |
| `/api/question` | GET | slackUserId | ✅ Returns question + answers |
| `/api/battle/answer` | POST | slackUserId, battleId, questionId | ✅ Correct/incorrect, damage, progression |
| `/api/user/profile` | GET | slackUserId | ✅ Returns profile |
| `/api/hunts/start` | POST | slackUserId, huntId | ✅ Creates hunt progress |
| `/api/battles/start` | POST | slackUserId, battleType | ✅ Creates battle session |
| `/api/battles/answer` | POST | slackUserId, battleSessionId | ✅ Simplified answer flow (no battle engine) |

---

## Route Notes

- **battle/*** (singular): Full Phase 2 implementation using question-engine, answer-evaluation, battle-engine, progression. **Use these for game flow.**
- **battles/*** (plural): Simpler implementation; does not use battle engine or progression. Consider aligning with `battle/*` or deprecating.

---

## Recommended Next Steps

1. Run `pnpm db:push` if you haven’t applied migrations 005–007.
2. For new deployments, 007 seed will use RFC-compliant UUIDs. Existing DBs keep current IDs; `uuidSchema` supports both.
3. Remove the symlink if you move env files (e.g. to `apps/web/.env.local`).
4. Slack app fails without `SLACK_APP_TOKEN` in Socket Mode; this does not affect web API QA.
