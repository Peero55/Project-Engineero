# Requirements Document

## Introduction

This document defines the requirements for reaching MVP readiness of the Engineero platform — a Slack-first gamified learning platform with a Next.js web companion. The MVP is the smallest demoable vertical slice proving the product works end-to-end: local startup → Slack daily quiz → hunt browsing → battle with encounters → answer submission with progression → admin content management. Requirements are derived from the approved design document and cover environment setup, the 8 critical MVP flows, blocker resolution, testing infrastructure, and documentation hygiene.

## Glossary

- **Web_App**: The Next.js 15 web application at `apps/web`, serving API routes and browser UI
- **Slack_App**: The Bolt-based Slack application at `apps/slack`, handling commands, shortcuts, and Block Kit interactions
- **Core_Engine**: The shared gameplay logic package at `packages/core`, including battle engine, encounter sequence, progression, answer evaluation, and daily question modules
- **Supabase_DB**: The PostgreSQL 15 database managed by Supabase, with 13 migrations defining the schema
- **Env_Config**: The set of environment variables required by Web_App and Slack_App, documented in `.env.example`
- **Blocker_Registry**: The catalog of 10 known issues (B-001 through B-010) that prevent MVP flows from completing
- **MVP_Flow**: One of the 8 critical user paths validated for MVP: local-startup, slack-daily, hunt-detail, battle-start, answer-submission, progression, admin-content, battle-ui
- **Encounter**: A single unit of gameplay within a battle — either a `question` or `puzzle_step` type
- **Hard_Blocker**: A blocker with severity "hard" that must be resolved before MVP demo
- **Soft_Blocker**: A blocker with severity "soft" that must have a documented workaround or deferral rationale
- **Validation_Checklist**: The manual step-by-step test plan for each MVP flow

## Requirements

### Requirement 1: Environment Variable Completeness

**User Story:** As a developer, I want all required environment variables documented in `.env.example`, so that I can set up a local development environment without guessing at missing configuration.

#### Acceptance Criteria

1. THE Env_Config SHALL include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as required entries in `.env.example`
2. THE Env_Config SHALL mark `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, and `SLACK_APP_TOKEN` as required entries with setup instructions in `.env.example`
3. WHEN a developer copies `.env.example` to `.env.local` and fills in all values, THE Web_App and Slack_App SHALL start without missing-variable errors
4. IF a required environment variable is missing, THEN THE Web_App SHALL fail fast with a descriptive error naming the missing variable

### Requirement 2: Local Startup Reliability

**User Story:** As a developer, I want the local development environment to start reliably with documented steps, so that I can begin working or demoing without troubleshooting infrastructure.

#### Acceptance Criteria

1. WHEN a developer runs `pnpm install`, THE monorepo SHALL install all dependencies without errors
2. WHEN a developer runs `supabase start`, THE Supabase_DB SHALL launch with PostgreSQL accessible on the configured port
3. WHEN a developer runs `supabase db reset`, THE Supabase_DB SHALL apply all 13 migrations without errors
4. WHEN all migrations are applied, THE Supabase_DB SHALL contain seed data for at least one certification, associated domains, topics, questions, and hunts
5. WHEN a developer runs `pnpm typecheck`, THE monorepo SHALL pass type checking across all packages with zero errors
6. WHEN a developer runs `pnpm build`, THE monorepo SHALL produce successful builds for Web_App and Slack_App
7. WHEN a developer runs `pnpm lint`, THE monorepo SHALL pass linting with zero errors

### Requirement 3: Getting Started Documentation

**User Story:** As a new developer, I want accurate setup documentation, so that I can go from clone to running demo in a single pass through the guide.

#### Acceptance Criteria

1. THE docs/getting-started.md SHALL document the complete local setup sequence: `pnpm install`, `supabase start`, env configuration, `supabase db reset`, and `pnpm dev`
2. THE docs/getting-started.md SHALL reference `pnpm` as the package manager (not `npm` or `yarn`)
3. THE docs/getting-started.md SHALL include instructions for obtaining Supabase local credentials from `supabase start` output
4. THE docs/getting-started.md SHALL include instructions for creating and configuring a Slack app with required tokens
5. IF a developer follows docs/getting-started.md from a fresh clone, THEN THE local environment SHALL reach a running state where all 8 MVP flows can be exercised

### Requirement 4: Slack Daily Question Flow

**User Story:** As a learner using Slack, I want to receive daily quiz questions and get immediate feedback, so that I can build a consistent study habit without leaving my team workspace.

#### Acceptance Criteria

1. WHEN a user triggers `/quiz` or the daily quiz shortcut in Slack, THE Slack_App SHALL call POST `/api/daily-question` and deliver a Block Kit message with the question text and answer options
2. WHEN a user clicks an answer option in the Block Kit message, THE Slack_App SHALL call POST `/api/daily-question/answer` and update the message with correct/incorrect feedback and an explanation
3. WHEN the answer feedback is displayed, THE Slack_App SHALL include a "Study on web" button linking to the relevant explanation page at `/explanations/[domainSlug]/[topicSlug]`
4. WHEN a user has already received the configured daily quota of questions (default 5), THE Core_Engine `canReceiveQuestion` function SHALL return false and THE Slack_App SHALL inform the user that the daily quota is reached
5. WHEN the `INTERNAL_API_SECRET` environment variable is set, THE Web_App daily-question routes SHALL reject requests that do not include a matching secret header
6. WHEN the `INTERNAL_API_SECRET` environment variable is not set, THE Web_App daily-question routes SHALL allow requests without secret validation (development mode)

### Requirement 5: Hunt Detail Flow

**User Story:** As a learner on the web, I want to browse available hunts and view their details, so that I can choose which learning path to pursue.

#### Acceptance Criteria

1. WHEN a user navigates to `/hunts` with a valid `slack_user_id` query parameter, THE Web_App SHALL display a list of available hunts
2. WHEN a user clicks on a hunt in the list, THE Web_App SHALL navigate to `/hunts/[huntId]` and display the hunt name, description, and readiness summary
3. WHEN the hunt detail page loads, THE Web_App SHALL display an enabled "Start Battle" button
4. IF the `slack_user_id` query parameter is missing or does not resolve to a user, THEN THE Web_App SHALL display an appropriate error state rather than crashing

### Requirement 6: Battle Start Flow

**User Story:** As a learner, I want to start a battle from a hunt, so that I can engage in an interactive learning encounter.

#### Acceptance Criteria

1. WHEN a user clicks "Start Battle" on a hunt detail page, THE Web_App SHALL call POST `/api/battle/start` with the `slackUserId` and `huntId`
2. WHEN POST `/api/battle/start` is called, THE Core_Engine SHALL call `getOrCreateUser` to resolve the user identity and create a `battle_session` record in Supabase_DB
3. WHEN a battle session is created, THE Core_Engine `generateAndInsertEncounters` function SHALL produce a number of encounters within the `ENCOUNTER_STEP_RANGE[battleType].min` and `ENCOUNTER_STEP_RANGE[battleType].max` bounds inclusive
4. WHEN encounters are generated, THE Core_Engine SHALL insert them into the `battle_encounters` table with a mix of `question` and `puzzle_step` types based on `ENCOUNTER_PUZZLE_WEIGHT`
5. WHEN the battle state is returned, THE Web_App SHALL navigate to `/battles/[battleId]` and render the first active encounter
6. IF the `battle_encounters` table does not exist (missing migration), THEN THE Web_App SHALL return a 500 error with a descriptive message rather than an unhandled crash

### Requirement 7: Answer Submission Flow

**User Story:** As a learner in a battle, I want to submit answers to encounter questions and receive immediate feedback, so that I can learn from each interaction.

#### Acceptance Criteria

1. WHEN a user selects an answer and submits it, THE Web_App SHALL call POST `/api/battle/answer` with `battleId`, `encounterId`, `questionId`, and `selectedOptionIds`
2. WHEN an answer is submitted, THE Core_Engine SHALL validate the answer server-side and return whether it is correct or incorrect
3. WHEN an answer is processed, THE Core_Engine `processEncounterResolution` function SHALL transition exactly one encounter from `active` to `resolved` status and activate the next `pending` encounter
4. IF no pending encounters remain after resolution, THEN THE Core_Engine SHALL mark the battle session as complete and call `applyHuntProgressAfterBattleEnd`
5. WHEN the encounter has a time limit and the elapsed time exceeds `GAME_CONFIG.timeoutSeconds`, THE Core_Engine SHALL treat the submission as an incorrect answer
6. THE Core_Engine SHALL validate all answers server-side only — client-side answer validation SHALL NOT exist

### Requirement 8: Progression Updates

**User Story:** As a learner, I want my XP, mastery, and continuity to update after every answer, so that I can track my learning progress across battles and sessions.

#### Acceptance Criteria

1. WHEN a correct or incorrect answer is processed, THE Core_Engine `applyProgression` function SHALL update the user's XP based on the `XP_BY_DIFFICULTY` table for the encounter's difficulty tier
2. WHEN a correct or incorrect answer is processed, THE Core_Engine `applyProgression` function SHALL update the user's topic mastery score for the relevant topic
3. WHEN a correct or incorrect answer is processed, THE Core_Engine `applyProgression` function SHALL update the user's knowledge continuity streak
4. THE Core_Engine `applyProgression` function SHALL execute after every answer submission — skipping progression updates for any answer is not permitted
5. WHEN a battle ends, THE Core_Engine `applyHuntProgressAfterBattleEnd` function SHALL update the hunt progress record for the user
6. WHEN the user navigates to the dashboard after a battle, THE Web_App SHALL display the updated XP, level, and domain readiness values

### Requirement 9: Admin Content Management

**User Story:** As an admin, I want to manage question activation status through a web interface, so that I can control which questions appear in battles and daily quizzes.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/login` and submits the correct `ADMIN_API_SECRET`, THE Web_App SHALL set an httpOnly session cookie with 8-hour expiry and redirect to `/admin/questions`
2. WHEN an authenticated admin accesses GET `/api/admin/questions`, THE Web_App SHALL return a paginated list of questions with search and filtering support
3. WHEN an authenticated admin calls PATCH `/api/admin/questions/:id` with `{is_active: true/false}`, THE Web_App SHALL update the question's activation status in Supabase_DB
4. IF an unauthenticated request is made to any `/api/admin/*` route, THEN THE Web_App SHALL return a 401 status code
5. WHEN a question is deactivated via the admin UI, THE Core_Engine question selection functions SHALL exclude that question from battle encounter generation and daily question delivery

### Requirement 10: Battle UI Rendering

**User Story:** As a learner in a battle, I want a game-like visual experience with clear feedback, so that the learning feels engaging rather than like a generic quiz.

#### Acceptance Criteria

1. WHEN a battle is active, THE Web_App SHALL render the EncounterScreen with a scene background layer, enemy panel, player vitals, question panel, and feedback layer
2. WHEN an encounter is a question type, THE Web_App SHALL render the question text with radio-button answer options in the QuestionPanel
3. WHEN an encounter is a puzzle_step type with ordering interaction, THE Web_App SHALL render a reorderable list in the QuestionPanel
4. WHEN an answer is submitted, THE Web_App FeedbackLayer SHALL display a correct/incorrect animation before transitioning to the next encounter
5. WHEN a battle ends, THE Web_App SHALL display a win/loss summary screen with a link back to the hunts page
6. WHILE a battle is active, THE Web_App SHALL display enemy HP and player HP bars that update after each answer
7. WHILE a battle is active, THE Web_App SHALL display an XP bar that shows gain animation after each answer

### Requirement 11: Blocker Resolution

**User Story:** As a project lead, I want all hard blockers resolved and soft blockers documented, so that the MVP demo can proceed without unexpected failures.

#### Acceptance Criteria

1. THE Blocker_Registry hard blockers B-001 (missing remote migrations), B-008 (missing Supabase env vars), B-009 (outdated getting-started.md), and B-010 (Slack vars marked optional) SHALL be resolved before MVP demo
2. THE Blocker_Registry soft blocker B-002 (slack_user_id auth gap) SHALL have a documented known-limitation entry explaining it is acceptable for local demo only
3. THE Blocker_Registry soft blocker B-003 (no test suite) SHALL be resolved by adding vitest with at least one smoke test for Core_Engine
4. THE Blocker_Registry soft blocker B-004 (INTERNAL_API_SECRET not enforced) SHALL be resolved by adding middleware that checks the secret when the variable is set
5. THE Blocker_Registry cosmetic blocker B-005 (legacy /api/battles/\* routes) SHALL be resolved by deleting the `apps/web/src/app/api/battles/` directory
6. THE Blocker_Registry soft blocker B-006 (HP cooldown not enforced) SHALL have a documented deferral rationale noting it is deferred to Phase 6
7. THE Blocker_Registry soft blocker B-007 (FileInstallationStore) SHALL have a documented migration path noting it is acceptable for local MVP

### Requirement 12: Test Infrastructure

**User Story:** As a developer, I want a working test runner with smoke tests for critical core modules, so that CI can catch regressions in the most important gameplay logic.

#### Acceptance Criteria

1. THE monorepo SHALL have `vitest` installed as a root dev dependency with a `test` script in the root `package.json` that runs `vitest --run`
2. THE Core_Engine SHALL have a vitest configuration at `packages/core/vitest.config.ts`
3. THE Core_Engine SHALL have test files covering `answer-evaluation.ts` with correct, incorrect, and timeout scenarios
4. THE Core_Engine SHALL have test files covering `encounter-sequence.ts` validating that generated encounter counts fall within `ENCOUNTER_STEP_RANGE` bounds
5. THE Core_Engine SHALL have test files covering `progression.ts` validating that `applyProgression` updates XP correctly per the `XP_BY_DIFFICULTY` table
6. THE Core_Engine SHALL have test files covering `daily-question.ts` validating that `canReceiveQuestion` enforces the daily quota
7. THE Core_Engine SHALL have `fast-check` installed as a dev dependency for property-based testing of encounter generation and progression math

### Requirement 13: Legacy Route Cleanup

**User Story:** As a developer, I want dead code removed from the API surface, so that the codebase is clear about which routes are active and maintained.

#### Acceptance Criteria

1. THE Web_App SHALL NOT contain the legacy `/api/battles/start` route
2. THE Web_App SHALL NOT contain the legacy `/api/battles/answer` route
3. WHEN the legacy routes are removed, THE Web_App active battle routes at `/api/battle/start` and `/api/battle/answer` SHALL continue to function without regression

### Requirement 14: Database Migration Completeness

**User Story:** As a developer deploying to a remote environment, I want all migrations applied consistently, so that battle and encounter features work on both local and remote Supabase instances.

#### Acceptance Criteria

1. WHEN `pnpm db:push` is run against a linked remote Supabase project, THE Supabase_DB SHALL apply all migrations including 010-013 (battle_encounters, last_activity_at, and related columns)
2. WHEN all migrations are applied, THE Supabase_DB SHALL contain the `battle_encounters` table with all columns required by Core_Engine
3. IF migrations 010-013 are not applied on a remote instance, THEN THE Web_App battle routes SHALL return descriptive 500 errors referencing the missing schema elements
