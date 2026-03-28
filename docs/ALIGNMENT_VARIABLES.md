# Alignment Variables — Legendary Hunts

> **Source of truth for alignment.** Referenced by `.cursor/rules/alignment.mdc`.  
> See also: [PHASE0_DESIGN_LOCK.md](PHASE0_DESIGN_LOCK.md), [ENCOUNTER_MODEL.md](ENCOUNTER_MODEL.md), [config/alignment.variables.json](../config/alignment.variables.json), [TASKLIST.md](../TASKLIST.md).

---

## 1. Product Positioning

| Variable | Value | Rationale |
|----------|-------|-----------|
| Primary product surface | Web app | Immersion, hunts, battles, progression |
| Slack / team chat role | Habit + quick study, lead-in to web | Not the main experience |
| MVP scope | Daily Slack quiz, web hunts/battles, admin content, progression | No PvP, labs animations, multi-cert |

---

## 2. Difficulty and Attack Model

| Variable | Value | Notes |
|----------|-------|-------|
| Tiers 1–4 | Regular gameplay (light / medium / heavy / ultimate) | `ATTACK_BY_TIER` in `packages/config` |
| Tier 5 | Labs only (`guided_lab`) | Subject-closing; never in normal battles |
| Battle logic | Exclude tier 5 unless labs explicitly requested | `includeLabs: false` default in question engine |

---

## 3. Architecture Layers

| Layer | Invariant | Themeable / Variable |
|-------|-----------|----------------------|
| Core engine | Question selection, battle resolution, progression | — |
| Game math | XP/level curve, damage/HP rules | — |
| Data model | Schema, relations | — |
| Integrations | Adapter interface (send, receive, resolve user, deep link) | Platform-specific (Slack, Discord, Teams) |
| Presentation | — | Naming, narrative text, UI labels |

---

## 4. Integration Rules

| Variable | Value |
|----------|-------|
| Pattern | Adapter-based; no platform types in core |
| Auth flow | `(platform, platformUserId)` → `user.id` via adapter |
| Messaging | Adapter renders platform-specific format (Block Kit vs Discord vs Teams) |

---

## 5. Content Rules

| Variable | Value |
|----------|-------|
| Question source | Database only; no hardcoded content |
| Import / generation | Admin review required before activation |
| Answer validation | Server-side only |

---

## 6. Encounter Model

| Variable | Value |
|----------|-------|
| Core principle | One loop, multiple interaction types |
| Unit of gameplay | Encounter (`question` \| `puzzle_step` \| `lab_step`) |
| Battle flow | Encounter → Encounter → Encounter (engine decides next) |
| Puzzles | `{ steps: Encounter[] }` — steps are encounters |
| Labs | `{ steps: Encounter[] }` — longer chains; no separate UI mode |
| Tier 5 | Lab depth only; NEVER random; ALWAYS intentional; ALWAYS chain-based |
| Seamless rule | Same UI shell, interaction pattern, feedback — depth increases via chain |

See [ENCOUNTER_MODEL.md](ENCOUNTER_MODEL.md).

---

## 7. Encounter Variability

| Variable | Value |
|----------|-------|
| Encounter length | Variable, not fixed |
| Lower-tier encounters | May be short |
| Higher-tier encounters | May be longer or more layered |
| Topic-dependent steps | Certain topics may require more steps |
| Labs/puzzle chains | Authored and intentional, not random |
| Disruption rule | Challenging and surprising, not disruptive |

---

## 8. Modularity Guards

- **Core:** No Slack/Discord/Teams types in `packages/core`
- **Engine:** Theme-agnostic; use `platform` enum, not `"Slack"` literals
- **Adapter:** Owns Block Kit / embeds / Adaptive Cards; core returns data only
- **Encounter:** Battles operate on encounters, not just questions; no separate puzzle/lab UI modes
- **Tier 5:** Never random; always intentional, chain-based

---

## 9. Hard Architecture Constraints (Language)

Core engine MUST NOT contain theme-specific language.

| Forbidden in core | Allowed |
|-------------------|---------|
| monster, spell, boss, gym | entity, encounter, action, result, progression, mastery |

Slack must not contain business logic. Core must never depend on Slack payloads directly.

---

## 10. Lab Attempt Requirements

Lab attempts must:
- be stored separately from battle sessions
- use a dedicated table (`lab_attempts`)
- track step-by-step progress and partial completion
- track time per step and total time
- track retries per step
- support resuming attempts (if enabled)
- NOT affect battle state (HP, turns, etc.)
- update progression ONLY after evaluation

---

## 11. Data Tracking Rules

| Category | Track |
|----------|-------|
| Gameplay | answers, accuracy, time spent, weak topics, strong topics, repetition history |
| Labs | step results, attempt history, completion status, mastery outcomes |

---

## 12. MVP Constraints (Do Not Build)

- PvP systems
- Full multiplayer battles
- Multi-cert support
- Complex lab simulations (keep simple first)
- Theme switching UI
- Discord/Teams implementation
