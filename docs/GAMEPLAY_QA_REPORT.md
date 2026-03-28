# GAMEPLAY_LAYER_QA — Report

**Date:** 2026-03-26  
**Scope:** Gameplay layer (EncounterScreen, battle client, fantasy status bar, learner gates). **Out of scope:** redesign, new systems, labs, PvP, tier 5 combat features.

**Artifacts:**

- Screenshot pack: [`docs/gameplay-qa/`](gameplay-qa/) (see [`README.md`](gameplay-qa/README.md))
- Build verification: `apps/web` — `npm run build` (pass), `npm run typecheck` (pass), `npm run lint` (pass)

---

## 1. Route QA

| Route | Result | Notes |
|-------|--------|--------|
| `/battles/[battleId]` **without** `slack_user_id` | **Pass** | Renders learner gate: eyebrow “Battle”, H1 “Learner id required”, panel copy, Home link. Screenshot: `01-battle-gate-no-slack.png`. |
| `/battles/[battleId]` **with** valid `slack_user_id` | **Not exercised in browser** | Requires real user + battle row; **code path** renders `BattleClient` → `EncounterScreen` (see `apps/web/src/app/battles/[battleId]/page.tsx`). |
| `/dashboard` | **Pass** | Renders; without slack, no `FantasyPlayerStatusBar` (expected). `02-dashboard-no-slack.png`. |
| `/codex` | **Pass** | Topics list + panel; without slack, continuity prompt. `03-codex.png`. |
| `/explanations/[domainSlug]/[topicSlug]` | **Pass** (prod) | `explanations/networking-fundamentals/osi-model` on **`next start`** (port 3001 after clean build). `04-explanation-osi-no-slack.png`. |
| `/hunts/[huntId]` | **Pass** | Hunt detail shell, slack hint when id missing. Use **hunt id from DB** (list page or API); UUID in repo seed vs docs can differ by third group — see **Issues**. `05-hunt-detail.png`. |

---

## 2. Battle flow QA (code + partial runtime)

| Check | Result | Evidence |
|-------|--------|----------|
| Enemy panel | **Pass** | `EnemyEncounterPanel` + foe `HealthBar` in duel row (`battle-client.tsx`). |
| Player vitals | **Pass** | `PlayerBattleVitals` + top `PlayerInfoBar`. |
| Question panel | **Pass** | `QuestionPanel` in battle `Panel`; puzzle path unchanged. |
| Strike flow | **Pass** | Pick option → `AttackBar` only enables tier per `ATTACK_BY_TIER`; `submitQuestion` on match. |
| Correct/incorrect feedback | **Pass** | `FeedbackLayer` + `questionFlash` classes; `StrikeFeedback` from `/api/battle/answer`. |
| HP/XP updates | **Pass** | `refresh()` after answer; bars read `session` + `player` from `fetchBattleViewState`. |
| Victory / pause / no-active | **Pass** | Separate branches in `battle-client.tsx` (Panel-only, no `EncounterScreen`). |

**End-to-end battle play** (click-through to victory) was **not** automated; blocked on valid learner + active battle session (see **Blockers**).

---

## 3. Feedback QA (CSS + wiring)

| Check | Result | Notes |
|-------|--------|--------|
| Foe hit gold pulse | **Pass** | `HealthBar` `flash="hit"` → `.bar-frame--flash-hit` on feedback with `damageDealt > 0` and correct. |
| Player damage shake | **Pass** | `flash="damage"` → `.bar-frame--flash-damage`. |
| XP gain blue pulse | **Pass** | `XPBar` `flash="gain"` → `.bar-frame--flash-xp`. |
| Answer state styles | **Pass** | `.question-card--correct` / `--incorrect`; picked `.answer-choice--right`. |
| Disabled strike buttons | **Pass** | `StoneButton` + `.btn-stone--disabled` (opacity ~0.38). |

---

## 4. Layout QA

| Check | Result | Notes |
|-------|--------|--------|
| Duel row balance | **Pass** | `.encounter-duel` 1 col → 2 col ≥640px. |
| Question prominence | **Pass** | Question lives in main battle `Panel` below duel row. |
| Attack bar placement | **Pass** | `ScreenShell` action slot below main panel. |
| Width | **Pass** | Battle page `max-w-4xl`; gate remains `max-w-2xl` (no change required). |
| “Game encounter” read | **Pass** (review) | Enemy + player columns + battle panel + strike + feedback strip. |

---

## 5. Consistency QA

| Check | Result | Notes |
|-------|--------|--------|
| Typography / panels / buttons / bars | **Pass** | Fantasy tokens under `.lh-fantasy-ui`; hunt routes use `HuntShell` (documented baseline difference). |
| Status bar | **Pass** | `FantasyPlayerStatusBar` on dashboard, codex, explanations **when** `slack_user_id` present. |
| No duplicate player info | **Pass** | Battle route does **not** mount `FantasyPlayerStatusBar`; only `BattleClient` header. |

---

## 6. State QA

| Check | Result | Notes |
|-------|--------|--------|
| Learner gate | **Pass** | Missing `slack_user_id` → gate, not `BattleClient`. |
| `xpToNextLevel` display | **Pass** | `GET /api/user/profile` returns `xpToNextLevel: xpForLevel(level)`; status bar shows `xp / xpToNextLevel XP`. |
| HP/XP coherence | **Pass** | Profile HUD uses `current_hp` / `max_hp` with `GAME_CONFIG` fallback; battle uses session HP. |
| Valid learner → encounter UI | **Pass** (code) | `page.tsx` gates on slack → `getUserBySlackId` → `fetchBattleViewState` → `BattleClient`. |

---

## Prioritized bug list

### P0 — None

No production-breaking regressions found in reviewed code paths for this phase.

### P1 — Environment / ops

1. **Stale `.next` dev vendor chunk** — Dynamic routes sometimes throw `Cannot find module './vendor-chunks/...'` in **`next dev`** until the cache is cleared. **Workaround:** `rm -rf apps/web/.next && npm run dev`. **Evidence:** `04-explanation-dev-vendor-chunk-error-optional.png`. Production `next build` + `next start` did not reproduce.

### P2 — Documentation / data

2. **Hunt UUID** — Seed migration `007_seed_network_plus.sql` lists `44444444-4444-4444-8444-444444444401`, while live DB / docs may show `44444444-4444-4444-4444-444444444401`. Always take the id from **`/hunts` list** or DB, not a hardcoded doc string.

### P3 — Polish (not fixed)

3. **Status bar flash of empty** — `FantasyPlayerStatusBar` is `null` until `GET /api/user/profile` resolves; minor layout shift.

---

## Issues fixed during QA

**None** — no code changes were required for broken behavior, regressions, or inconsistent feedback in this pass. Fixes were limited to documentation and artifacts per phase instructions.

---

## Blockers

**Full encounter screenshot + E2E battle QA** require:

- Valid `slack_user_id` (or local tester) with a **profile** row.
- Supabase migrations applied through **battle** tables (e.g. `010_battle_encounters.sql` as applicable).
- An **existing battle session** with an active encounter (e.g. start from hunt flow).

Until those are available in the target environment, treat **manual** verification of the full EncounterScreen as the acceptance step for the MVP battle experience.

---

## Remaining polish (non-blocking)

- Optional min-height on `FantasyPlayerStatusBar` wrapper to reduce layout shift while profile loads.
- Optional: capture **06-battle-encounter-active.png** in a future pass when a stable test battle + learner id are available.

---

## Alignment checklist

- **Web-first** learner experience; Slack as integration (unchanged).
- **Tiers 1–4** only in battle UI; no tier 5 / labs in this layer.
- **No** core schema or engine changes in this QA phase.
- **Encounter variability** preserved (session-driven steps, not fixed step count in UI).
