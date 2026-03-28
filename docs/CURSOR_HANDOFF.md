# Cursor Handoff

Legendary Hunts is a modular gamified learning engine.

## Read first
1. docs/PHASE0_DESIGN_LOCK.md
2. docs/ALIGNMENT_VARIABLES.md
3. docs/DECISION_LOG.md
4. TASKLIST.md

## Product direction
- Web app is the primary product experience
- Chat platforms are integrations
- Slack is the first adapter, not the core product
- Core engine is theme-agnostic
- Themes and lore must be swappable without engine rewrite

## Non-negotiable rules
- Tiers 1–4 are combat/gameplay
- Tier 5 is labs only
- Tier 5 never enters normal battle selection
- Labs are separate from battle sessions
- No theme-specific language in core engine
- Integrations must use adapter pattern
- No hardcoded question content
- Do not add non-MVP features unless explicitly requested

## Encounter philosophy
Legendary Hunts uses a continuous encounter model.

Encounters may be:
- question
- puzzle_step
- lab_step

The learner should experience them as one continuous gameplay loop.

Do NOT design the system as:
- questions first
- then puzzles
- then labs

Instead, design:
- mixed encounter flows
- interleaved question/puzzle/lab patterns
- variable step counts
- escalating complexity without changing the overall feel

## Encounter variability rules
- Encounter length must be variable, not fixed
- Lower-tier encounters may be short
- Higher-tier encounters may be longer or more layered
- Certain topics may require more steps than others
- Labs and puzzle chains should feel authored and intentional, not random pop-ups
- Encounters should be challenging and somewhat surprising, but not disruptive

## Working mode
- Implement one phase at a time
- Do not skip architecture for convenience
- If a task conflicts with alignment variables, stop and flag it
- When changing code, explain how modularity and encounter variability are preserved

---

## References
- `docs/SYSTEM_DESIGN_DAILY_QUESTIONS.md` — Phase 3 system design
- https://docs.slack.dev — Slack development reference (phases 3–6)
