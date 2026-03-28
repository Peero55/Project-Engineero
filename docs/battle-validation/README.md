# Live battle validation — screenshots

| File | Description |
|------|-------------|
| `01-hunt-detail-ready.png` | Hunt detail with `slack_user_id=preacher`, readiness + path progress, **Begin encounter run** |
| `02-battle-start-blocked-migration.png` | Same page after start attempt — **migration 010** error (Supabase schema) |
| `03-dashboard-learner-context.png` | Dashboard with learner id — global **PlayerInfoBar** (Hunter, Lv.1, XP strip) |

**Not present:** Active encounter (duel row, question, strike feedback, HP/XP pulses, victory/defeat) — blocked until `battle_sessions` / encounter migrations apply cleanly on the target database. See [`../BATTLE_VALIDATION_REPORT.md`](../BATTLE_VALIDATION_REPORT.md).
