# Legendary Hunts — Penpot handoff (post–token foundations)

**Audience:** Other agents / implementers working in Penpot with the Color Tokens plugin.

**Status:** Token foundations phase **accepted**. Tokens, aliases, and rules are the **visual baseline**.

---

## Baseline constraints (do not violate)

| Rule | Detail |
|------|--------|
| **Do not rename tokens** | Use the existing **Legendary Hunts** token set names as authored (e.g. `bg.base`, `accent.gold`). |
| **Do not introduce new colors** | Only tokens already in the set; use aliases (`glow.*`) and references where defined. |
| **No raw hex in components** | All fills, strokes, text, and shadows/glows must be bound via the **Color Tokens plugin UI** (or equivalent token binding), not ad-hoc `#RRGGBB` on layers. |

**Note:** Penpot’s token API uses **dot-separated** names (e.g. `bg.base`), not slashes (`bg/base`). Do not rename to slashes if the file already uses dots.

---

## Next task: Component library + screens

### 1. Page `02 — Components` — build real components

Create **named component instances** (library components or clearly grouped boards) for:

| Component | Variants / notes |
|-----------|------------------|
| **StoneFrame** | Single variant unless design system already specifies multiples. |
| **Panel** | `default`, `battle`, `glow` |
| **StrikeButton** | `light`, `medium`, `heavy`, `ultimate`, `disabled` |
| **HealthBar** | `player`, `enemy` |
| **XPBar** | Default |
| **BattleHeader** | Default |
| **EnemyCard** | Default |
| **PlayerVitals** | Default |
| **QuestionPanel** | Default |
| **AnswerOption** | `default`, `selected`, `correct`, `incorrect`, `disabled` |

### 2. Manual token binding (mandatory)

In Penpot UI, bind **Legendary Hunts** tokens to:

- Fills  
- Strokes  
- Text colors  
- Shadows / glows **where the plugin supports token binding**

### 3. Hex cleanup

- Remove **all** raw hex values from component layers (including nested text and borders).  
- If a color is not in the set, **stop** and escalate — do not invent a hex.

### 4. Page `03 — Battle Screens` — assemble from components only

Assemble these **screens** using **only** components from `02` (no one-off primitives except inside component definitions):

| Screen |
|--------|
| Encounter Gate |
| Battle Idle |
| Battle Correct |
| Battle Wrong |
| Victory |

### 5. Page `04 — Dashboard / Codex / Hunts` — assemble from components only

| Screen |
|--------|
| Dashboard |
| Codex topic |
| Explanation |
| Hunt detail |

---

## Rules (alignment)

- Use **only** the **Legendary Hunts** token set.  
- **No new colors.**  
- **No redesign of structure** — match existing **React UI structure** (layout hierarchy, component boundaries).  
- **All screens** = compositions of **components**, not loose rectangles/text.  

---

## Return format (required “after coding” report)

When work is complete, return:

1. **List of components created** (exact names as in Penpot).  
2. **List of variants created** (per component).  
3. **Confirmation of token binding** (fills / strokes / text / shadow-glow — note any property that cannot be tokenized in Penpot).  
4. **Remaining raw hex values** — list layer path + hex, or state **none found**.  
5. **Screenshots** of pages **02**, **03**, and **04** (full page or clear artboard exports).

---

## Token reference (no new values)

**Core neutrals:** `bg.base`, `bg.elevated`, `surface.stone-dark`, `surface.stone-mid`, `border.default`, `border.strong`, `text.primary`, `text.muted`

**Accents:** `accent.ember`, `accent.gold`, `accent.arcane-blue`, `accent.crimson`, `accent.success`

**Feedback:** `feedback.correct`, `feedback.damage`, `feedback.xp`, `feedback.warning`, `feedback.disabled`

**Effects:** `glow.ember`, `glow.gold`, `glow.arcane`, `shadow.stone`

**Semantic rules (Foundations):**

- **Ember** — battle action, danger, pressure  
- **Gold** — reward, progression, mastery  
- **Arcane Blue** — knowledge, XP, codex  
- **Crimson** — failure, ultimate, threat  
- **Stone neutrals** — base UI only  

---

## React alignment (reference only)

Map Penpot tokens to app CSS variables conceptually (do **not** change React as part of this Penpot task unless explicitly requested):

```css
/* Example mapping — names align by semantic role */
--lh-bg-base → bg.base
--lh-bg-elevated → bg.elevated
--lh-surface-stone-dark → surface.stone-dark
--lh-surface-stone-mid → surface.stone-mid
--lh-border-default → border.default
--lh-text-primary → text.primary
--lh-text-muted → text.muted
--lh-accent-ember → accent.ember
--lh-accent-gold → accent.gold
--lh-accent-arcane-blue → accent.arcane-blue
--lh-accent-crimson → accent.crimson
```

---

## Known technical notes (from prior Penpot API session)

- Scripted `shape.applyToken()` may reject library `Token` objects; **UI binding** is the source of truth for token links.  
- Token names with **`/`** may fail to create in script; the **Legendary Hunts** set uses **dot** names — keep them stable.

---

*Generated for coordinator handoff. Update this file when the component phase is complete (see `docs/PHASE_COMPLETIONS.md` if applicable).*
