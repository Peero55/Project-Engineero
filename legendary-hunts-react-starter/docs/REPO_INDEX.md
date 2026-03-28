# Repo Index

> For a full tree, tables, and monorepo relationship, see **[../INDEX.md](../INDEX.md)**.

## app/
- `dashboard/page.tsx` — Screen 3: `PlayerInfoBar` + `MasteryDashboard` + active hunts
- `map/page.tsx` — Screen 4: `HuntMap` preview
- `hunts/page.tsx` — hunt list and progress
- `battle/page.tsx` — Screen 2: `EncounterScreen` (shell + encounter flow)
- `profile/page.tsx` — player progression and weak/strong topics
- `admin/page.tsx` — admin priorities and direction
- `docs/page.tsx` — in-app reading order for the agent and human builder

## components/
- `layout/PageHeader.tsx` — page header shell
- `layout/ScreenShell.tsx` — [ header | main | action bar | feedback ] layout
- `layout/PlayerInfoBar.tsx` — carved player info strip
- `ui/Panel.tsx` — panel variants + rune `glow`
- `ui/Button.tsx` — `StoneButton` tier colors (light / medium / heavy / ultimate)
- `ui/HealthBar.tsx` — HP bar (ember/red)
- `ui/XPBar.tsx` — XP bar (gold / arcane)
- `ui/ProgressBar.tsx` — neutral % bar (hunt progress)
- `ui/Badge.tsx` — simple status badge
- `game/EncounterScreen.tsx` — composed encounter screen
- `game/AttackBar.tsx` — four attack tiers, optional `locked`
- `game/QuestionPanel.tsx` — MCQ + local correct/incorrect feedback
- `game/FeedbackLayer.tsx` — feedback chips container
- `game/NpcDialogue.tsx` — portrait + dialogue + optional action
- `game/MasteryDashboard.tsx` — mastery + `SkillBar`
- `game/HuntMap.tsx` — map nodes + paths

## types/
- `ui-state.ts` — `PlayerUIState`, `BattleUIState`, `AttackTier`

## lib/
- `data.ts` — starter fixture data to visualize the system
- `game-rules.ts` — Phase 0 loop + MVP structure constants
- `env.ts` — Phase 1 server/public environment
- `logger.ts` — Phase 1 structured logging
- `validation.ts` — Phase 1 small validators for future APIs

## docs/
- `PHASE0_FOUNDATION_LOCK.md` — Phase 0 authoritative lock
- `schema/DRAFT_SCHEMA.sql` — Phase 1 draft SQL

## app/api/
- `health/route.ts` — Phase 1 health + config sanity (no secrets)

## prompts/
- `MASTER_AGENT_HANDOFF.md` — the main build prompt for the coding agent
- `CONTENT_GENERATION_PROMPT.md` — prompt for question ingestion and generation
