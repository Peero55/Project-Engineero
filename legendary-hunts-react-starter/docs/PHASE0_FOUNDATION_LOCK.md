# Phase 0 — Foundation lock (source of truth)

This document locks the **core loop**, **combat/defeat expectations**, and **MVP boundaries** for Legendary Hunts. Implementation in code should mirror `lib/game-rules.ts`.

## Core loop (player journey)

```
Daily ritual (Slack) → Encounters (web) → Mini-boss (web) → Legendary hunt (web) → Mastery views (web)
```

- **Daily (Slack):** short, habitual question set; primary habit layer.
- **Encounters:** short runs (see `MVP_STRUCTURE` in `lib/game-rules.ts`) that build toward larger checks.
- **Mini-boss:** validates a **concept cluster** (longer than a single encounter).
- **Legendary:** domain-scale check (longest structured run in MVP).
- **Mastery:** reflects weak/strong topics and readiness—not a separate mini-game loop.

## Combat rules (MVP)

- **Questions map to attacks:** difficulty selects attack tier (light / medium / heavy / ultimate) per product rules.
- **Correct answers:** deal damage to the encounter objective (e.g. enemy HP); award XP toward progression.
- **Wrong answers or timeouts:** player takes damage; may trigger explanation / mentor flows.
- **Resolution:** encounters end in **victory**, **defeat**, or **retreat** where supported; legendary / mini-boss may have stricter completion rules in later phases.

## Defeat rules (MVP)

- **Defeat:** player **HP reaches 0** during an active web battle/hunt run, or a **fail-state** is reached per encounter design (e.g. too many failed steps).
- **Retreat (optional in later phases):** voluntary exit without completing; does not grant full rewards.

## MVP boundaries (locked)

Aligned with `README.md` MVP lock:

- **Certification focus:** Network+ first.
- **Slack:** daily question loop; not the full immersive UI.
- **Web:** encounters, mini-boss structure, legendary structure, mastery-oriented views, explanations, admin direction.
- **Out of scope for MVP:** PvP, advanced labs as primary gameplay, animation-first delivery.

## Drift prevention

- Do not invent alternate primary loops (e.g. “labs-only” as the main path).
- Do not replace fantasy UI language with neutral SaaS copy on primary surfaces without explicit approval.
- Backend and data models must eventually support **server-side answer validation** and **auditability**—UI-only demos are not sufficient for production paths.
