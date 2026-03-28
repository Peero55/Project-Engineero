# Decision Log

## DL-001
Web app is primary product experience.
Reason: richer hunts, labs, explanations, and progression require a dedicated interface.

## DL-002
Slack is an adapter/integration, not the main product.
Reason: future support for Discord, Teams, and other messengers.

## DL-003
Difficulty tiers 1–4 are combat only.
Reason: these map directly to attack choices and battle pacing.

## DL-004
Difficulty tier 5 is labs only.
Reason: labs are capstone validation, not battle content.

## DL-005
Theme is modular and must not affect engine logic.
Reason: support fantasy, cyberpunk, naval, enterprise, and future themes without rewrite.

## DL-006
Unified Encounter model: one loop, multiple interaction types.
Reason: seamless experience where questions, puzzles, and labs are intermingled as encounters. Battles operate on encounters, not just questions. Labs are encounter chains; no separate UI modes. Tier 5 = lab depth, always intentional and chain-based. See `docs/ENCOUNTER_MODEL.md`.
