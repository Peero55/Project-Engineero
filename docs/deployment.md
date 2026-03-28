# Deployment

This guide defines **environments** and **release practices** at a high level. Replace placeholders with your hosting provider, CI/CD pipeline, and database host once they are chosen.

## Environments

| Environment | Purpose | Notes |
|-------------|---------|--------|
| **Local** | Day-to-day development | Developers run Next.js and PostgreSQL locally or via containers; uses `.env.local` (or equivalent) — never commit secrets. |
| **Staging** | Pre-production verification | Should mirror production as closely as is practical (data may be anonymized). |
| **Production** | Live users | Protected access; changes land via reviewed PRs and an agreed promotion process. |

Document exact URLs and credentials **outside** the repo (e.g. password manager, cloud console).

## Environment variables

- **Source of truth:** deployment platform (Vercel, Railway, AWS, etc.) or secrets manager — not git.
- **Template only:** `.env.example` lists names and safe placeholders.
- **Promotion:** when adding or renaming variables, update `.env.example`, `docs/getting-started.md`, and notify the team before deploys break.

## Build and deploy (*placeholder*)

Typical steps for a Next.js + Node stack (adjust per provider):

1. Install dependencies (`npm ci` / `pnpm install --frozen-lockfile`, etc.).
2. Run lint/tests when CI exists.
3. Run `next build` (or the team’s build script).
4. Run database migrations against the **target** environment (see below) before or after deploy per your playbook.
5. Deploy the build artifact or trigger the platform’s deploy hook.

Record the **actual** commands and dashboard steps here once finalized.

## Database migrations (*placeholder*)

- **Tool TBD** (e.g. Prisma Migrate, Drizzle Kit, Flyway, raw SQL migrations).
- **Rule of thumb:** migrations are versioned, reviewed in PRs, and applied in a controlled order to staging then production.
- **Backups:** confirm PostgreSQL backups and retention before destructive migrations.

Document the real migration command(s) and who may run them when the toolchain exists.

## Rollback (*placeholder*)

- **Application:** redeploy a known-good build or use your platform’s rollback action.
- **Database:** prefer forward-fix migrations; reversing schema changes may require a planned down migration — avoid ad-hoc production edits.

Capture platform-specific rollback steps when production is live.

## Post-deploy verification

After each production deploy:

- [ ] Smoke-test critical user paths (document the checklist when features exist).
- [ ] Confirm API health / error rates (monitoring TBD).
- [ ] Verify background jobs or queues, if any.
- [ ] Spot-check logs for unexpected errors (redact-sensitive data in shared reports).

## Security reminders

- **No secrets in repo:** keys live in the environment or secrets store only.
- **Least privilege:** database users and service accounts get minimal required permissions.
- **HTTPS** in staging and production; secure cookies and headers per Next.js/hosting docs when auth exists.
- **Dependency updates:** schedule reviews for security advisories when `package.json` is present.

## Related docs

- **`docs/getting-started.md`** — local setup
- **`CONTRIBUTING.md`** — branch and PR workflow
