# Gameplay layer QA — screenshot pack

Captured during **GAMEPLAY_LAYER_QA** (2026-03-26). Viewport: default browser automation size unless noted.

| File | Route / condition | Notes |
|------|-------------------|--------|
| `01-battle-gate-no-slack.png` | `/battles/[battleId]` without `slack_user_id` | Learner gate; fantasy panel + copy |
| `02-dashboard-no-slack.png` | `/dashboard` | No global status bar (expected without learner id) |
| `03-codex.png` | `/codex` | Topics panel; continuity copy when no slack |
| `04-explanation-osi-no-slack.png` | `/explanations/networking-fundamentals/osi-model` | Production server (`next start`); Summary panel |
| `04-explanation-dev-vendor-chunk-error-optional.png` | Same route on stale `next dev` | **Dev artifact:** missing vendor chunk — delete `apps/web/.next` and restart dev |
| `05-hunt-detail.png` | `/hunts/<id>` from live DB (see report) | Hunt shell; slack gate hint |

**Not in pack (manual / env required):**

- Full **EncounterScreen** (duel row, question, AttackBar, FeedbackLayer) with live battle — needs valid `slack_user_id`, existing battle session, and DB through battle migrations. Verify via Slack deep link or local tester id + started hunt battle.
