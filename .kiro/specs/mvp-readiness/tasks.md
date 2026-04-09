# Implementation Plan: MVP Readiness (Phase 2)

## Overview

All original 10 tasks are complete. This phase addresses remaining gaps found by comparing the implemented codebase against the full requirements and design document. Focus areas: env validation hardening, error handling improvements, missing property tests for untested correctness properties, and minor UI/UX gaps.

## Tasks

- [ ] 1. Harden environment variable validation
  - [ ] 1.1 Add `SUPABASE_SERVICE_ROLE_KEY` to required list in `scripts/validate-env.ts`
    - Currently only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in the `required` array
    - Add `SUPABASE_SERVICE_ROLE_KEY` since `apps/web/src/lib/supabase/admin.ts` throws without it
    - _Requirements: 1.1, 1.4_
  - [ ] 1.2 Add runtime env validation to web app startup
    - Create `apps/web/src/lib/env-check.ts` that validates required Supabase env vars and throws with a descriptive error naming the missing variable
    - Import and call it from `apps/web/src/app/layout.tsx` (or `instrumentation.ts` if Next.js 15 supports it) so the app fails fast on startup rather than on first API call
    - _Requirements: 1.4_
  - [ ]\* 1.3 Write property test: missing env var fail-fast (Property 10)
    - **Property 10: Missing env var fail-fast**
    - For any required environment variable that is absent, the validation function must throw an error that includes the name of the missing variable
    - **Validates: Requirement 1.4**

- [ ] 2. Improve error handling for missing migrations in battle routes
  - [ ] 2.1 Add descriptive error detection in battle API routes
    - In the catch block of `apps/web/src/app/api/battle/start/route.ts`, detect Supabase schema errors (e.g. "relation does not exist", "column does not exist") and return a 500 with a message referencing the missing migration
    - Same treatment for `apps/web/src/app/api/battle/answer/route.ts`
    - _Requirements: 6.6, 14.3_

- [ ] 3. Improve hunt page error state for missing `slack_user_id`
  - [ ] 3.1 Add explicit error/info state to `/hunts` page when `slack_user_id` is missing
    - Currently shows a subtle hint; should display a clear, styled error panel explaining the user needs to access via Slack deep link or provide a `slack_user_id` param
    - _Requirements: 5.4_

- [ ] 4. Checkpoint — Validation hardening
  - Ensure `pnpm typecheck` and `pnpm build` pass, `pnpm env:check` catches missing `SUPABASE_SERVICE_ROLE_KEY`. Ask the user if questions arise.

- [ ] 5. Add missing property tests from design document
  - [ ]\* 5.1 Write property test: encounter state transition integrity (Property 2)
    - **Property 2: Encounter state transition integrity**
    - For any battle with N encounters and answer submission for encounter K, `processEncounterResolution` must transition exactly one encounter from `active` to `resolved` and activate the next `pending` encounter (or mark battle complete if K = N)
    - Create `packages/core/src/__tests__/encounter-resolution.prop.test.ts`
    - **Validates: Requirements 7.3, 7.4**
  - [ ]\* 5.2 Write property test: INTERNAL_API_SECRET enforcement (Property 9)
    - **Property 9: INTERNAL_API_SECRET enforcement**
    - For any request to daily-question API routes, when `INTERNAL_API_SECRET` is set, the route must reject requests without a matching secret header
    - Create `packages/core/src/__tests__/internal-api-auth.prop.test.ts` or an integration-level test in `apps/web`
    - **Validates: Requirement 4.5**
  - [ ]\* 5.3 Write property test: admin route authentication enforcement (Property 7)
    - **Property 7: Admin route authentication enforcement**
    - For any request to `/api/admin/*` without a valid session cookie or bearer token, the response must be HTTP 401
    - Test `requireAdmin` from `apps/web/src/lib/admin-auth.ts` with arbitrary invalid tokens
    - **Validates: Requirement 9.4**
  - [ ]\* 5.4 Write property test: deactivated question exclusion (Property 8)
    - **Property 8: Deactivated question exclusion**
    - For any question where `is_active = false`, that question must never appear in daily question selection or encounter generation results
    - **Validates: Requirement 9.5**

- [ ] 6. Checkpoint — Property tests
  - Ensure `pnpm test` runs all tests (existing + new) and they pass. Ask the user if questions arise.

- [ ] 7. Add remote migration push documentation
  - [ ] 7.1 Document `pnpm db:push` workflow for remote Supabase
    - Add a "Remote Deployment" section to `docs/getting-started.md` or a dedicated `docs/REMOTE_SETUP.md`
    - Document that migrations 010-013 must be applied to remote Supabase for battle features to work
    - Include the `pnpm db:push` command and verification steps (check Supabase Studio for `battle_encounters` table)
    - _Requirements: 14.1, 14.2_

- [ ] 8. Final checkpoint — Full validation
  - Ensure all env validation improvements work, error handling is descriptive, `pnpm typecheck` passes, `pnpm build` passes, `pnpm test` passes. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All original Phase 1 tasks (env docs, getting-started rewrite, legacy route cleanup, INTERNAL_API_SECRET verification, vitest/fast-check setup with 8 test files, known limitations docs) are complete
- Property tests 1, 3, 4, 5, 6 already exist from Phase 1; this phase adds the remaining Properties 2, 7, 8, 9, 10
- Each task references specific requirements for traceability
- B-001 (remote migrations) is partially addressed by task 7 (documentation) — the actual `db:push` is an infra operation excluded from coding tasks
