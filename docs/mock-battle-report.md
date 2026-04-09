# Mock Battle Report — Engine Validation

**Date:** 2026-04-01
**Certification:** CompTIA Network+ (N10-008)
**Battle Type:** Normal
**Script:** `npx tsx scripts/mock-battle.ts`

## Systems Exercised

| System               | Package                   | Function                                                                                  |
| -------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| Encounter generation | `@legendary-hunts/core`   | `generateAndInsertEncounters()`                                                           |
| Encounter fetch      | `@legendary-hunts/core`   | `fetchEncountersForBattleStart()`                                                         |
| Question selection   | `@legendary-hunts/core`   | `getQuestion()` (called internally)                                                       |
| Answer evaluation    | `@legendary-hunts/core`   | `submitAnswer()`                                                                          |
| Battle state machine | `@legendary-hunts/core`   | `processEncounterResolution()`                                                            |
| Progression / XP     | `@legendary-hunts/core`   | `applyProgression()`                                                                      |
| Game constants       | `@legendary-hunts/config` | `GAME_CONFIG`, `DAMAGE_BY_DIFFICULTY`, `ATTACK_BY_TIER`, `pickEncounterStepCount()`       |
| DB persistence       | Supabase (local)          | `battle_sessions`, `battle_encounters`, `user_stats`, `user_question_history`, `profiles` |

## Battle Configuration

- Player HP: 100 | Enemy HP: 100
- Encounter count: 6 (rolled via `pickEncounterStepCount("normal")`, range 3–6)
- Difficulty cycling: tiers 1→2→3→4 repeating
- Damage per correct: Tier 1 = 15, Tier 2 = 20, Tier 3 = 25, Tier 4 = 30
- Damage per wrong: 25 base + 2/sec slow penalty over 5s

## Encounter Log

| #   | Tier | Topic                       | Domain                  | Result     | Dmg Dealt | Dmg Taken |
| --- | ---- | --------------------------- | ----------------------- | ---------- | --------- | --------- |
| 1   | 1    | Ethernet Standards          | Network Implementations | ✅ Correct | 15        | 0         |
| 2   | 2    | OSI Model                   | Networking Fundamentals | ❌ Wrong   | 0         | 34        |
| 3   | 2    | Troubleshooting Methodology | Network Troubleshooting | ❌ Wrong   | 0         | 25        |
| 4   | 4    | Troubleshooting Methodology | Network Troubleshooting | ❌ Wrong   | 0         | 31        |
| 5   | 1    | Firewalls and ACLs          | Network Security        | ✅ Correct | 15        | 0         |
| 6   | 1    | Ethernet Standards          | Network Implementations | ❌ Wrong   | 0         | 25        |

## Battle Result

| Metric             | Value      |
| ------------------ | ---------- |
| Outcome            | **DEFEAT** |
| Final Player HP    | 0/100      |
| Final Enemy HP     | 70/100     |
| Questions Answered | 6/6        |
| Correct            | 2/6 (33%)  |
| Total Damage Dealt | 30         |
| Total Damage Taken | 115        |
| XP Gained          | 44         |
| Level After        | 1 (44 XP)  |

## User Stats Written (per topic)

| Topic                       | Correct | Incorrect | Avg Response |
| --------------------------- | ------- | --------- | ------------ |
| Ethernet Standards          | 1       | 1         | 5,586 ms     |
| OSI Model                   | 0       | 1         | 9,548 ms     |
| Troubleshooting Methodology | 0       | 2         | 6,770 ms     |
| Firewalls and ACLs          | 1       | 0         | 9,162 ms     |

## Observations

- All 6 production code paths executed without errors.
- Encounter generation correctly cycled difficulty tiers and selected questions from the seeded pool (46 total questions).
- `submitAnswer()` correctly calculated damage including the slow-response penalty (encounter #2: 34 damage = 25 base + 9 penalty for ~4.5s over threshold).
- `processEncounterResolution()` correctly tracked HP, advanced encounters sequentially, and set terminal state to "lost" when player HP hit 0.
- `applyProgression()` awarded 44 XP (2 correct × base XP with difficulty scaling, 4 incorrect × 0.25 multiplier).
- All data persisted to `battle_sessions`, `battle_encounters`, `user_stats`, and `user_question_history` tables.
- Question pool covered 4 of 8 topics and 3 of 5 domains in a single 6-encounter battle — good variety from the 46-question pool.

## Question Pool Summary

| Source                           | Count  |
| -------------------------------- | ------ |
| Migration 007 (initial seed)     | 1      |
| Migration 011 (dev seed)         | 15     |
| Migration 015 (new 30 questions) | 30     |
| **Total**                        | **46** |
