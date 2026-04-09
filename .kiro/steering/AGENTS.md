# Engineero Agent Rules

## Project Identity

Engineero is a Slack-first gamified learning platform with a web app companion.

## Repo Shape

- apps/web: Next.js web application (admin, routing, auth — not battle rendering)
- apps/slack: Slack app and handlers
- packages/core: shared gameplay and evaluation logic
- packages/config: shared configuration
- packages/types: shared domain types
- supabase: schema, migrations, data persistence
- docs: requirements, audits, design locks, reports
- Unity project: battle scene rendering and cinematic presentation (managed via Unity MCP)

## Architecture Boundaries

- Supabase stores content, progression, battle state, and semantic metadata.
- Supabase does not own visual presentation.
- Unity owns battle rendering, layout, visual composition, and battle scene display.
- React/Next.js (apps/web) owns non-battle web UI (admin screens, routing, auth).
- Shared logic belongs in packages/core or packages/types.
- Avoid duplicating business logic across apps/web and apps/slack.
- Do not move battle presentation concerns into database schema or content records.

## Delivery Rules

- Prefer smallest safe change.
- Preserve working routes and package boundaries.
- Do not broadly refactor unless asked or clearly required.
- Before changing shared APIs, schema, or env contracts, explain impact.
- When completing a task, report:
  - changed files
  - why they changed
  - risks
  - what should be tested next

## MVP Priorities

1. local startup reliability
2. env and dependency sanity
3. Slack question flow
4. hunt and battle flow
5. progression persistence
6. asset-driven battle presentation
7. admin/content workflows
8. polish

## UI Rules

- The battle experience should feel game-like, not like a generic SaaS dashboard.
- Use semantic asset keys for scene and character lookup.
- Missing assets must fail gracefully.
- Keep cinematic hierarchy:
  - scene
  - enemy/mentor
  - HUD/status
  - question/actions
  - feedback/effects

## Guardrails

- Do not delete working files because they appear unused without proving replacement coverage.
- Do not overwrite docs blindly; validate and refine existing docs first.
- Respect existing repo docs in /docs and extend them instead of recreating them unless necessary.
