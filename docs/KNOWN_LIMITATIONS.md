# Known Limitations

This document catalogs known limitations and deferred items in the current MVP build. Each entry references the blocker ID from the MVP Readiness spec and notes the expected resolution path.

---

## B-002: Web Authentication Uses `slack_user_id` Query Parameter

**Severity:** Soft blocker
**Affected flows:** Hunt detail, battle start, answer submission, progression, battle UI

Web flows identify users via a `slack_user_id` query parameter passed through URLs (e.g. `/hunts?slack_user_id=U12345`). There is no session, OAuth, or token-based authentication on the web side.

- `apps/slack` constructs web URLs with `slack_user_id` as a query param (see `listeners/commands.ts`, `listeners/shortcuts.ts`, `listeners/app-home.ts`, `blocks/daily-question.ts`).
- `apps/web/src/lib/auth.ts` resolves user identity by looking up `slack_user_id` in the `users` table.
- Any user who knows a valid `slack_user_id` can impersonate that user on the web.

**Acceptable for:** Local demo and development only.
**Must not ship to production** without replacing this with proper authentication (e.g. Slack OAuth flow with session cookies or JWT).

---

## B-006: HP Cooldown Not Enforced

**Severity:** Soft blocker
**Affected flows:** Battle start, progression

`GAME_CONFIG.cooldowns` is defined in `packages/config/src/game.ts` (`[5, 15, 60]` minutes) but is **not enforced** in battle start or progression flows. Players can start battles and submit answers without any cooldown delay between attempts.

**Deferred to:** Phase 6 (progression trophies, badges, items, cooldowns).
**Impact on MVP:** None — cooldown enforcement is a balancing feature, not a correctness requirement for the demo.

---

## B-007: Slack `FileInstallationStore` (Disk-Based)

**Severity:** Soft blocker
**Affected flows:** Slack daily question (deployment path)

`apps/slack/src/app.ts` uses `FileInstallationStore` from `@slack/oauth`, which writes installation data to `.slack-installations/` on disk.

```typescript
const installationStore = new FileInstallationStore({
  baseDir: path.join(process.cwd(), ".slack-installations"),
});
```

This works for local development but **will not work** in serverless or containerized deployments where the filesystem is ephemeral.

**Migration path:** Replace `FileInstallationStore` with a Supabase-backed installation store that persists installation records in the database. This should be done before any non-local deployment.
