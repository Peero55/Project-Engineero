# UI audit + MVP playability — 2026-03-26

Purpose: verify learner and admin surfaces are visually consistent with the established fantasy shell (`lh-fantasy-ui`, Cinzel + DM Sans, gold/ink palette) without redesigning the product.

## 1. Routes audited

| Route | Shell | Notes |
|-------|--------|------|
| `/dashboard` | `lh-fantasy-ui` | **Updated** to match codex/explanation/battle: `Panel` sections, `fantasy-stone-link` nav, eyebrow + `font-display` title. |
| `/codex` | `lh-fantasy-ui` | **Updated** footer: Home, Dashboard, Hunts (slack query preserved). |
| `/hunts/[huntId]` | `HuntShell` (`lh-page-bg`) | **Updated** footer: Codex + Dashboard when `slack_user_id` present. Intentionally keeps map/marketing gradient shell; typography still `font-display` + amber accents (aligned with home/hunts list). |
| `/battles/[battleId]` | `lh-fantasy-ui` | **Updated** missing-id gate to fantasy panel + stone link; footer adds Dashboard link. |
| `/explanations/[domainSlug]/[topicSlug]` | `lh-fantasy-ui` | **Updated** nav: Dashboard added between codex and hunts. |
| `/explanations/:topicSlug` (legacy) | Middleware → `/explanations/legacy/...` | **Fixed** Next.js dynamic param clash (see below). |
| `/admin/content`, `/admin/content/[ingestId]` | Zinc admin shell | Correctly separate from player fantasy skin; no redesign. |

### Screenshot pack

PNGs in [`docs/ui-audit-screenshots/`](ui-audit-screenshots/):

1. `01-dashboard.png`
2. `02-codex.png`
3. `03-hunt-detail.png` — hunt UUID `44444444-4444-4444-4444-444444444401`
4. `04-explanation.png` — `networking-fundamentals` / `osi-model`
5. `05-battle-gate.png` — battle without `slack_user_id`
6. `06-admin-content.png`

`[ingestId]` admin capture omitted when admin session / ingest list empty.

## 2. Components audited

| Component | Location | Finding |
|-----------|----------|---------|
| **ScreenShell** | `battle-client.tsx` | Encounters use header / main / action / feedback slots consistently. |
| **PlayerInfoBar** | Battle | Present in header; HP/XP from `BattlePlayerView`. |
| **Panel** | Battle, codex, explanations, **dashboard** | Shared `panel--dashboard` / battle variants; dashboard now uses same primitive. |
| **Button** | `StoneButton`, hunt CTA | Strike stones + hunt gradient CTA are distinct but both readable; no change. |
| **AttackBar** | Battle action bar | Tier locks respected; label copy present for puzzle vs question. |
| **HealthBar** / **XPBar** | Battle panel | Framed bars match fantasy-ui.css tracks. |
| **FeedbackLayer** | Battle | **Updated**: short explanation uses `.feedback-explanation` (muted panel) instead of mis-typed `xp` chip; longer snippet allowance. |
| **NpcDialogue** | — | **Not implemented** as a named component; encounter copy is inline (`question-card`, `action-bar-wrap__label`). No change. |
| **MasteryDashboard** | — | **Not a standalone component**; mastery/continuity appears on dashboard sections, codex list, explanation header. |

## 3. Verification summary

- **Visual / spacing**: Learner surfaces under `lh-fantasy-ui` share panel radius, borders, and gold accents. Hunt detail remains on `HuntShell` for continuity with home/hunts list (documented dual-shell pattern).
- **State / feedback**: Battle feedback layer covers correct/incorrect, damage, XP, study link, and explanation note. Hunt start surfaces API errors in-page (`role="alert"`).
- **Route alignment**: Cross-links now carry `slack_user_id` between dashboard ↔ codex ↔ hunts ↔ explanation ↔ battle where applicable.
- **Fantasy fidelity**: No art-direction change; only alignment of previously plain zinc dashboard/gate with existing fantasy tokens.

## 4. MVP playability pass

Expected flow: **daily (Slack) → explanation → hunt → battle → codex → dashboard**.

**Verified in dev (2026-03-26):**

- Home redirect with `slack_user_id` → dashboard works.
- Codex and explanation routes render with fantasy shell.
- Hunt list and hunt detail render; **Begin encounter run** currently fails if remote DB lacks `battle_sessions.last_activity_at` (migration **010**).

**Blocker:** Apply **`010_battle_encounters.sql`** (and dependent migrations) to the linked Supabase project so `POST /api/battle/start` succeeds. See `docs/PHASE_COMPLETIONS.md` / `TASKLIST.md`.

**Local test id:** `slack_user_id=preacher` only resolves continuity if a matching `users.slack_user_id` row exists; otherwise dashboard shows “Unknown user” while codex still lists catalog topics.

## 5. Prioritized fix list

### Done (this pass)

1. **P0** — Next dev/prod build: conflicting `[topicSlug]` vs `[domainSlug]` under `explanations/` → **middleware rewrite** + `explanations/legacy/[topicSlug]`.
2. **P0** — Dashboard fantasy inconsistency → wrap in `lh-fantasy-ui` + `Panel`.
3. **P1** — Cross-route nav + query preservation (dashboard, codex, hunt detail, battle footer, explanation).
4. **P1** — Battle gate styling aligned with fantasy shell.
5. **P1** — Wrong-answer explanation presentation in feedback layer (`.feedback-explanation`).
6. **P2** — Hunt start: map schema-cache error to actionable migration hint.

### Remaining / product

1. **P0** — Run DB migrations through **010+** on deployment target for playable battles.
2. **P2** — Unify **HuntShell** vs **lh-fantasy-ui** for hunt detail only if product wants one gradient system everywhere (optional; would be a larger visual pass).
3. **P3** — Replace dev-only footer hint bar noise in screenshots (environment concern, not product UI).

## 6. Files changed (this phase)

- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/codex/page.tsx`
- `apps/web/src/app/hunts/[huntId]/page.tsx`
- `apps/web/src/app/hunts/start-battle-button.tsx`
- `apps/web/src/app/battles/[battleId]/page.tsx`
- `apps/web/src/app/battles/[battleId]/battle-client.tsx`
- `apps/web/src/app/explanations/[domainSlug]/[topicSlug]/page.tsx`
- `apps/web/src/app/explanations/legacy/[topicSlug]/page.tsx` (new; legacy handler)
- `apps/web/src/middleware.ts` (new)
- `apps/web/src/styles/fantasy-ui.css`
- `apps/web/src/app/explanations/[topicSlug]/page.tsx` (removed)
- `docs/UI_AUDIT_REPORT.md` (this file)
- `docs/ui-audit-screenshots/*` + `README.md`
- `docs/PHASE_COMPLETIONS.md` (entry appended)

`packages/core`: **no changes** (theme-free preserved).
