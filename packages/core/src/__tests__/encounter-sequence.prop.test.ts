import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  pickEncounterStepCount,
  ENCOUNTER_STEP_RANGE,
  type BattleTypeKey,
} from "@legendary-hunts/config";

/**
 * Property 1: Encounter generation produces valid counts
 *
 * For all valid `BattleTypeKey` values, `pickEncounterStepCount` returns a
 * value in `[ENCOUNTER_STEP_RANGE[battleType].min, ENCOUNTER_STEP_RANGE[battleType].max]`.
 *
 * **Validates: Requirements 6.3, 6.4**
 */

const battleTypeArb = fc.constantFrom<BattleTypeKey>(
  "daily",
  "normal",
  "mini_boss",
  "legendary",
);

describe("Property 1: Encounter generation produces valid counts", () => {
  it("pickEncounterStepCount returns a value within the configured [min, max] range for any battle type", () => {
    fc.assert(
      fc.property(battleTypeArb, (battleType) => {
        const count = pickEncounterStepCount(battleType);
        const { min, max } = ENCOUNTER_STEP_RANGE[battleType];

        expect(count).toBeGreaterThanOrEqual(min);
        expect(count).toBeLessThanOrEqual(max);
      }),
      { numRuns: 500 },
    );
  });

  it("pickEncounterStepCount always returns an integer for any battle type", () => {
    fc.assert(
      fc.property(battleTypeArb, (battleType) => {
        const count = pickEncounterStepCount(battleType);
        expect(Number.isInteger(count)).toBe(true);
      }),
      { numRuns: 500 },
    );
  });
});
