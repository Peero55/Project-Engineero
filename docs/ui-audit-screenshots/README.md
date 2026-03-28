# UI audit screenshot pack

PNG captures from the MVP UI verification pass (**2026-03-26**). Paths are relative to this folder.

| File | Route |
|------|--------|
| `01-dashboard.png` | `/dashboard?slack_user_id=preacher` |
| `02-codex.png` | `/codex?slack_user_id=preacher` |
| `03-hunt-detail.png` | `/hunts/44444444-4444-4444-4444-444444444401?slack_user_id=preacher` |
| `04-explanation.png` | `/explanations/networking-fundamentals/osi-model?slack_user_id=preacher` |
| `05-battle-gate.png` | `/battles/00000000-0000-4000-8000-000000000001` (no `slack_user_id`) |
| `06-admin-content.png` | `/admin/content` |

See [`../UI_AUDIT_REPORT.md`](../UI_AUDIT_REPORT.md) for findings, fixes, and blockers.

Re-capture: `pnpm dev` in `apps/web`, viewport ~1280×720 or `fullPage` screenshots from browser tooling.
