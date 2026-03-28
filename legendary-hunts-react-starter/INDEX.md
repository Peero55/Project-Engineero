# legendary-hunts-react-starter — index

Standalone Next.js **UI + docs + prompts** package for Legendary Hunts. It lives beside the main monorepo (`apps/web`, `packages/*`) and is **not** wired into the Turborepo workspace by default—treat it as a **reference starter** and agent handoff bundle.

| Field | Value |
|--------|--------|
| Package name | `legendary-hunts-react-starter` |
| Stack | Next.js 15.2, React 19, TypeScript 5.8 |
| Entry (dev) | `npm run dev` → App Router under `app/` |

---

## Reading order (humans & agents)

1. [README.md](./README.md) — scope, run, MVP lock
2. [docs/PHASE0_FOUNDATION_LOCK.md](./docs/PHASE0_FOUNDATION_LOCK.md) — Phase 0 lock
3. [docs/PROJECT_SYNOPSIS.md](./docs/PROJECT_SYNOPSIS.md) — product thesis
4. [docs/PHASE_TASK_LIST.md](./docs/PHASE_TASK_LIST.md) — phased work
5. [docs/UI_SYSTEM.md](./docs/UI_SYSTEM.md) — layout, tokens, components
6. [docs/REPO_INDEX.md](./docs/REPO_INDEX.md) — short file map (subset of this index)
7. [prompts/MASTER_AGENT_HANDOFF.md](./prompts/MASTER_AGENT_HANDOFF.md) — build prompt
8. [prompts/CONTENT_GENERATION_PROMPT.md](./prompts/CONTENT_GENERATION_PROMPT.md) — content pipeline prompt

---

## Directory tree

```
legendary-hunts-react-starter/
├── INDEX.md                 ← this file
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── next-env.d.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx              # redirects → /dashboard
│   ├── dashboard/page.tsx
│   ├── hunts/page.tsx
│   ├── battle/page.tsx
│   ├── profile/page.tsx
│   ├── admin/page.tsx
│   ├── docs/page.tsx         # in-app doc navigator
│   └── api/health/route.ts   # Phase 1 liveness
├── components/
│   ├── layout/PageHeader.tsx
│   ├── ui/Panel.tsx
│   ├── ui/ProgressBar.tsx
│   ├── ui/Badge.tsx
│   └── game/
│       ├── AttackBar.tsx
│       ├── QuestionPanel.tsx
│       └── NpcDialogue.tsx
├── lib/
│   ├── data.ts               # fixture data (player, hunts, battle mock)
│   ├── env.ts                # Phase 1: server/public env
│   ├── game-rules.ts         # Phase 0: loop + MVP structure constants
│   ├── logger.ts             # Phase 1: structured logging
│   └── validation.ts         # Phase 1: small validators
├── instrumentation.ts
├── .env.example
├── docs/
│   ├── PHASE0_FOUNDATION_LOCK.md
│   ├── PROJECT_SYNOPSIS.md
│   ├── PHASE_TASK_LIST.md
│   ├── UI_SYSTEM.md
│   ├── REPO_INDEX.md
│   └── schema/
│       └── DRAFT_SCHEMA.sql
└── prompts/
    ├── MASTER_AGENT_HANDOFF.md
    └── CONTENT_GENERATION_PROMPT.md
```

---

## App routes (`app/`)

| Path | File | Purpose |
|------|------|---------|
| `/` | `app/page.tsx` | Redirect to `/dashboard` |
| `/dashboard` | `app/dashboard/page.tsx` | Player overview / hunt hub mock |
| `/hunts` | `app/hunts/page.tsx` | Hunt list + progress (fixture-driven) |
| `/battle` | `app/battle/page.tsx` | Battle loop mock (question + attack UI) |
| `/profile` | `app/profile/page.tsx` | Progression / topics mock |
| `/admin` | `app/admin/page.tsx` | Admin priorities placeholder |
| `/docs` | `app/docs/page.tsx` | Links to reading order for builders |

---

## Components

| Path | Role |
|------|------|
| `components/layout/PageHeader.tsx` | Shared page header |
| `components/ui/Panel.tsx` | Card / panel primitive |
| `components/ui/ProgressBar.tsx` | Progress bar |
| `components/ui/Badge.tsx` | Status badge |
| `components/game/AttackBar.tsx` | Attack / difficulty selector |
| `components/game/QuestionPanel.tsx` | Multiple-choice question block |
| `components/game/NpcDialogue.tsx` | Mentor / explanation block |

---

## Data & config

| Path | Role |
|------|------|
| `lib/data.ts` | Exported fixtures: `player`, `hunts`, `battle`, etc. |
| `app/globals.css` | Global styles |
| `app/layout.tsx` | Root layout |
| `next.config.ts` | Next.js config |

---

## Prompts (`prompts/`)

| File | Use |
|------|-----|
| `MASTER_AGENT_HANDOFF.md` | Primary agent build instructions |
| `CONTENT_GENERATION_PROMPT.md` | Question ingestion / generation |

---

## Relationship to the main repo

| Location | Role |
|----------|------|
| `Project Engineero/apps/web` | Production Next app (API routes, Supabase, hunts/battles) |
| `legendary-hunts-react-starter/` | **Reference UI + documentation**; copy patterns or migrate components intentionally |

When aligning with [alignment rules](../.cursor/rules/alignment.mdc) in the monorepo: **core engine** stays theme-agnostic; **this starter** may use fantasy RPG copy in UI—migrate labels via the theme layer when integrating into `apps/web`.

---

## Last indexed

- File count: 28 (including this index)
- Index generated for coordinator handoff and `@legendary-hunts-react-starter` discovery
