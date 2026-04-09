import { describe, it, expect } from "vitest";
import {
  pickEncounterStepCount,
  ENCOUNTER_STEP_RANGE,
  type BattleTypeKey,
} from "@legendary-hunts/config";

// ---------------------------------------------------------------------------
// Tests — Validates: Requirements 12.4, 6.3
// ---------------------------------------------------------------------------

const BATTLE_TYPES: BattleTypeKey[] = [
  "daily",
  "normal",
  "mini_boss",
  "legendary",
];

describe("pickEncounterStepCount", () => {
  for (const battleType of BATTLE_TYPES) {
    const { min, max } = ENCOUNTER_STEP_RANGE[battleType];

    describe(`battleType="${battleType}" (range ${min}–${max})`, () => {
      it(`returns a value >= ${min} and <= ${max}`, () => {
        // Run multiple times to exercise the random range
        for (let i = 0; i < 50; i++) {
          const count = pickEncounterStepCount(battleType);
          expect(count).toBeGreaterThanOrEqual(min);
          expect(count).toBeLessThanOrEqual(max);
        }
      });

      it("returns an integer", () => {
        for (let i = 0; i < 20; i++) {
          const count = pickEncounterStepCount(battleType);
          expect(Number.isInteger(count)).toBe(true);
        }
      });
    });
  }
});
