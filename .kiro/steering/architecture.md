# Architecture Steering

## Separation of Concerns

- apps/web owns non-battle web UI, web routes, admin screens, auth.
- Unity project owns battle presentation, scene rendering, and cinematic visuals.
- apps/slack owns Slack commands, shortcuts, listeners, and Slack-specific flows.
- packages/core owns reusable gameplay logic and content evaluation logic.
- packages/types owns shared types.
- packages/config owns shared constants and configuration.

## Data and Rendering Rule

- Supabase is the system of record for content, progression, and semantic metadata.
- Unity owns battle scene rendering and cinematic presentation.
- React/Next.js (apps/web) owns non-battle web UI (admin, routing, auth screens).
- Do not push UI styling responsibility into Supabase.

## Type Ownership

- Prefer shared types from packages/types.
- Do not redefine the same core models in multiple apps.
- Prefer exported constants/enums/maps over repeated magic strings.

## Change Safety

- Shared package changes must be evaluated for downstream breakage.
- Schema changes must be documented with migration impact.
