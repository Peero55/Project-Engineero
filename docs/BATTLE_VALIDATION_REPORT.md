# LIVE_BATTLE_VALIDATION — Report

**Date:** 2026-03-26  
**Type:** Runtime validation (not a code change phase).  
**Environment:** Local app against **remote Supabase** (`.env.local`), learner id **`preacher`** (`DEV_TEST_SLACK_USER_ID`).  
**App:** `next build` + `next start` on **port 3001** (avoids intermittent `next dev` vendor-chunk issues).

---

## 1. Objective

Run the **full gameplay loop** end-to-end: start battle from an active hunt → answer questions → observe HP/XP and feedback → reach victory or failure → capture encounter screenshots.

---

## 2. What was executed

| Step | Result |
|------|--------|
| Open hunt detail | **OK** — `/hunts/44444444-4444-4444-4444-444444444401?slack_user_id=preacher` (UUID from live DB / hunts list). |
| Learner context | **OK** — Hunt readiness, path progress (0/100 active), **Begin encounter run** visible. Screenshot: `docs/battle-validation/01-hunt-detail-ready.png`. |
| Start battle (`POST /api/battle/start`) | **Blocked** — Supabase schema cache: missing **`last_activity_at`** on `battle_sessions` (migration **010** not applied on remote). |
| UI error handling | **OK** — Inline alert: *“Battle database is out of date — apply migration 010 (battle encounters) to your Supabase project, then retry.”* Screenshot: `02-battle-start-blocked-migration.png`. |
| Dashboard with same learner | **OK** — `FantasyPlayerStatusBar` shows identity + Lv.1 + `0 / 100 XP`. Screenshot: `03-dashboard-learner-context.png`. |

**API check (curl):** `POST /api/battle/start` with `huntId` returns `500` with message containing `last_activity_at` / schema cache — consistent with UI.

---

## 3. Screenshots produced

All under **`docs/battle-validation/`** (see **`README.md`** there).

| Required capture | Status |
|------------------|--------|
| Active duel row | **Not captured** — battle never started. |
| Question interaction | **Not captured** |
| Correct feedback | **Not captured** |
| Incorrect feedback | **Not captured** |
| XP gain | **Not captured** |
| HP loss | **Not captured** |
| Victory or failure | **Not captured** |

**Substitute evidence:** Hunt pre-battle surface + **actionable failure state** when starting the run (migration blocker).

---

## 4. Findings — does it feel like a game?

**Hunt detail (pre-battle):** Yes, at a **lobby / path** level: domain label, hunt title, crossed-swords affordance, progress bar, gold CTA, copy that promises a single continuous flow (“questions and puzzles in one continuous flow”). Pacing is **static** on this screen until the user commits.

**Blocked at combat:** No assessment of in-encounter “game feel” for this run — **blocked by DB**.

---

## 5. Findings — does the user understand what to do?

- **Hunt page:** Clear primary action (**Begin encounter run**) and helper line under the button.  
- **Blocked start:** The red/orange **alert** explains the failure in **product language** (migration 010) — strong for operators; acceptable for a dev/staging learner if they expect infra setup.  
- **Dashboard:** Learner strip (name, level, XP) reinforces identity before hunting again.

---

## 6. Findings — is feedback strong enough?

- **Start failure:** Yes — dedicated `role="alert"` message, not silent failure.  
- **Combat feedback:** **Not exercised** this run (no encounter).

---

## 7. Findings — pacing

- **Hunt → battle:** Single click intended; actual navigation to `/battles/[id]` did not occur due to API error — user remains on hunt page with error. **No infinite spinner** observed; button returns to **Begin encounter run** after failure.

---

## 8. Blockers (P0)

1. **Remote database migrations incomplete for battles**  
   - Symptom: `Could not find the 'last_activity_at' column of 'battle_sessions' in the schema cache`.  
   - Needed: Apply **`010_battle_encounters.sql`** (and dependencies) to the Supabase project backing this app.

2. **`pnpm db:push` did not complete cleanly** (same session)  
   - `009_daily_questions.sql` failed FK to `certifications` — remote DB missing seed certification row expected by migrations.  
   - **Implication:** Migration history / data on remote may diverge from repo seeds; resolve **certification seed + migration order** (or repair migration state) before relying on automated `db push`.

Until **(1)** is resolved (and any prerequisite data for **(2)**), **live encounter validation cannot be finished** on this environment.

---

## 9. UX issues (non-blocking)

| Issue | Severity | Notes |
|-------|----------|--------|
| Technical error surfaced to learner | Low–Med | Message names “migration 010” — fine for internal QA; for production, consider a softer user-facing string with support link. |
| No partial battle preview | N/A | Expected — scope is real session only. |

---

## 10. Remediation checklist (for a complete validation pass)

1. Align remote DB with repo migrations (fix FK on 009 or seed `certifications`, then apply through **010+** as needed).  
2. Confirm `battle_sessions` has **`last_activity_at`**.  
3. Retry **Begin encounter run** → complete at least two question steps (correct + incorrect) → capture duel row, feedback chips, bar flashes, end state.  
4. Append new screenshots to `docs/battle-validation/` with numbered names `04–10` as appropriate.

---

## 11. Alignment

- No gameplay logic or UI redesign in this phase.  
- Tier 5 / labs / PvP out of scope.  
- Validation only; findings are environmental unless product copy changes are requested later.
