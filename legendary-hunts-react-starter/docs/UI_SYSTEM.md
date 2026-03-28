# UI System

## Identity

- Dark fantasy
- No cyberpunk
- No sci-fi hologram feel
- UI should feel **carved**, **embedded**, **arcane**, and **physical**
- **Design principle:** UI is **not** floating — it is part of the world

## Palette

- Background: deep blue, charcoal, stone gray
- Accents: ember orange, gold, arcane blue, crimson

## 1. Global screen structure

All screens follow:

1. **Header / Player info** — `PlayerInfoBar`, route `PageHeader` where needed
2. **Main panel (primary interaction)** — `Panel` + core content
3. **Action bar** — `AttackBar`, primary CTAs (`StoneButton`)
4. **Feedback layer** — `FeedbackLayer` + `Feedback` chips

Composer: `ScreenShell` (`components/layout/ScreenShell.tsx`).

## 2. Core components

| # | Component | Path | Notes |
|---|-----------|------|--------|
| 1 | **Panel** | `components/ui/Panel.tsx` | `title`, `variant`: `default` \| `battle` \| `dashboard`, `glow` |
| 2 | **Button** | `components/ui/Button.tsx` | `StoneButton` — `light` (gold), `medium` (blue), `heavy` (orange), `ultimate` (crimson) |
| 3 | **Attack bar** | `components/game/AttackBar.tsx` | Four tiers; `locked[]` dims stone |
| 4 | **Health / XP** | `HealthBar`, `XPBar`, `ProgressBar` | HP = ember/red glow; XP = gold/arcane |
| 5 | **Question panel** | `components/game/QuestionPanel.tsx` | MCQ; local correct/incorrect flash |
| 6 | **Feedback** | `FeedbackLayer`, `Feedback` | `correct`, `damage`, `xp`, `failure` |
| 7 | **NPC dialog** | `components/game/NpcDialogue.tsx` | Portrait slot + dialogue + optional action |
| 8 | **Mastery** | `MasteryDashboard`, `SkillBar` | Topic bars + weak areas |
| 9 | **Map** | `HuntMap`, `MapNode` | Nodes + paths; done/current/locked states |

## 3. Screen system

| Screen | Route | Layout |
|--------|-------|--------|
| Slack | External | — |
| Encounter | `/battle` | `EncounterScreen` → enemy/HP, question, attack bar, feedback |
| Dashboard | `/dashboard` | Profile strip + `MasteryDashboard` + hunts |
| Map | `/map` | `HuntMap` + zone placeholder |

## 4. State shapes (reference)

See `types/ui-state.ts`: `PlayerUIState`, `BattleUIState`, `AttackTier`.

## 5. Rules

- Reuse components above
- No random modern flat UI
- Do not drift from the fantasy look
- Keep summary screens simple first; deeper analytics later

## 6. Stitch / asset prompts (optional)

- **Panel:** Dark fantasy UI panel of carved stone and aged metal, faint glowing runes along inner edges.
- **Button:** Stone button with engraved symbols; tier-specific glow (gold / blue / orange / crimson).
- **Bars:** HP and XP bars in a stone frame, magical energy filling the channels.
