-- Phase 0: Allow difficulty_tier 5 for labs (guided_lab only)
-- Tier 5 = labs; regular gameplay uses tiers 1-4
-- See docs/PHASE0_DESIGN_LOCK.md

alter table questions
  drop constraint if exists questions_difficulty_tier_check;

alter table questions
  add constraint questions_difficulty_tier_check
  check (difficulty_tier between 1 and 5);
