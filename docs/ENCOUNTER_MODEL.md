# Unified Encounter Model — Design Lock

> **Core Principle:** One loop, multiple interaction types.  
> **Source:** Design lock (2025-03-22). Referenced by [PHASE0_DESIGN_LOCK.md](PHASE0_DESIGN_LOCK.md), [ALIGNMENT_VARIABLES.md](ALIGNMENT_VARIABLES.md).

---

## 1. Core Principle (Locked)

**One loop, multiple interaction types.**

Not: questions → then puzzles → then labs  

But: **encounters** that can be:
- quick (question)
- multi-step (puzzle step)
- chained (lab step)

---

## 2. Encounter Abstraction

Everything the user "does" becomes an encounter.

```ts
type EncounterType = "question" | "puzzle_step" | "lab_step"

interface Encounter {
  id: string
  type: EncounterType
  topic: string
  difficulty_tier: 1 | 2 | 3 | 4 | 5
  payload: unknown
}
```

---

## 3. Unified Flow

Instead of separate systems:

```
battle → puzzle → lab
```

Run:

```
Encounter → Encounter → Encounter → Encounter
```

The engine decides what comes next.

---

## 4. Encounter Mix Strategy

### During normal play (battle / hunt)

| %     | Type                             |
|-------|----------------------------------|
| 60–70% | question                         |
| 20–30% | puzzle_step                      |
| 5–10%  | chain starter (mini-lab entry)    |

### During advanced play (mini-boss / legendary)

| %     | Type        |
|-------|-------------|
| 40–50% | question    |
| 30–40% | puzzle_step |
| 10–20% | lab_step    |

---

## 5. Puzzle and Lab Definitions

### Puzzle

A puzzle is NOT a separate system. It is:

```ts
type Puzzle = {
  id: string
  steps: Encounter[]
}
```

Each step is an encounter.

### Lab

```ts
type Lab = {
  id: string
  steps: Encounter[]
  completion_condition: "all_steps_correct" | "threshold_score"
}
```

- No special UI mode
- No "switching systems" feeling

---

## 6. Chain System

```ts
chain_id?: string
chain_position?: number
chain_length?: number
```

Allows mini puzzles inside battles and labs emerging naturally.

---

## 7. Damage + Feedback Model

| Type        | Damage Logic     |
|-------------|------------------|
| question    | immediate        |
| puzzle_step | partial / staged  |
| lab_step    | cumulative        |

---

## 8. Seamless Experience Rule

**The player must never feel like they left gameplay.**

- Same UI shell
- Same interaction pattern
- Same feedback loop
- Only difference: **depth increases**

---

## 9. Where Labs Trigger

Instead of "enter lab mode":

**Lab is just a longer encounter chain.**

Triggered by:
- mastery threshold
- boss encounter
- user choice

---

## 10. Critical Guardrails

### 1. Tier 5 still = lab depth

- NEVER random
- ALWAYS intentional
- ALWAYS chain-based

### 2. No hard mode switching

❌ Don't: "Entering Lab Mode…"  
✅ Do: "Encounter chain increases in complexity"

### 3. UI stays consistent

- Same buttons
- Same flow
- Same feedback style

---

## 11. Refactor Requirements (for implementation)

When refactoring to the Encounter model:

- Encounters can be `question`, `puzzle_step`, or `lab_step`
- Battle system must operate on encounters, not just questions
- Introduce encounter chaining (`chain_id`, `chain_position`, `chain_length`)
- Puzzles and labs reuse the same encounter structure
- Do NOT create separate UI modes for puzzles or labs
- Maintain tier 5 isolation for lab-level depth

**Goal:** A seamless experience where questions, puzzles, and labs are intermingled.

---

## 12. Encounter Variability Rules

- Encounter length must be variable, not fixed
- Lower-tier encounters may be short
- Higher-tier encounters may be longer or more layered
- Certain topics may require more steps than others
- Labs and puzzle chains should feel authored and intentional, not random pop-ups
- Encounters should be challenging and somewhat surprising, but not disruptive
