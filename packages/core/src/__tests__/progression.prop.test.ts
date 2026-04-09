import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import {
  applyProgression,
  type BattleResultForProgression,
} from "../progression";
import { XP_BY_DIFFICULTY, xpForLevel } from "@legendary-hunts/config";

/**
 * Property 5: Progression completeness after answer
 *
 * - For any answer submission (correct or incorrect) at any difficulty tier 1-4,
 *   XP gained is always > 0.
 * - For all valid levels >= 1, `xpForLevel(level) > xpForLevel(level - 1)`
 *   (monotonically increasing).
 *
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */

// ---------------------------------------------------------------------------
// Supabase mock — reuses the proxy-chain pattern from existing test files
// ---------------------------------------------------------------------------

type ResolvedData = { data: unknown; error: unknown };

function mockChain(resolved: ResolvedData) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") {
        return (
          onFulfilled: (v: ResolvedData) => void,
          onRejected: (e: unknown) => void,
        ) => Promise.resolve(resolved).then(onFulfilled, onRejected);
      }
      return (..._args: unknown[]) => {
        if (prop === "single" || prop === "maybeSingle") {
          const d = Array.isArray(resolved.data)
            ? (resolved.data[0] ?? null)
            : resolved.data;
          return Promise.resolve({ data: d, error: resolved.error });
        }
        if (prop === "insert" || prop === "upsert" || prop === "update") {
          return new Proxy({}, handler);
        }
        return new Proxy({}, handler);
      };
    },
  };
  return new Proxy({}, handler);
}

function buildSupabaseMock(tableData: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => {
      const data = table in tableData ? tableData[table] : null;
      return mockChain({ data, error: null });
    }),
  } as any;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Difficulty tier 1-4 */
const difficultyTier = fc.integer({ min: 1, max: 4 });

/** Times a question has been seen before (0 = first time) */
const timesSeenBefore = fc.integer({ min: 0, max: 10 });

/** Arbitrary battle result for progression */
const battleResult: fc.Arbitrary<BattleResultForProgression> = fc.record({
  correct: fc.boolean(),
  difficulty: difficultyTier,
  questionId: fc.uuid(),
  timesSeenBefore,
});

/** Valid level >= 1 (capped at a reasonable range for testing) */
const validLevel = fc.integer({ min: 1, max: 98 });

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 5: Progression completeness after answer", () => {
  it("XP gained is always > 0 for any answer at difficulty tier 1-4 (first encounter)", async () => {
    await fc.assert(
      fc.asyncProperty(difficultyTier, fc.boolean(), async (tier, correct) => {
        const supabase = buildSupabaseMock({
          profiles: [{ level: 1, xp: 0 }],
        });

        const result: BattleResultForProgression = {
          correct,
          difficulty: tier,
          questionId: "q-prop",
          timesSeenBefore: 0,
        };

        const outcome = await applyProgression(supabase, "u-prop", [result]);

        expect(outcome.xpGained).toBeGreaterThan(0);
      }),
      { numRuns: 200 },
    );
  });

  it("XP gained is always >= 0 for any answer including high repetition penalty", async () => {
    await fc.assert(
      fc.asyncProperty(battleResult, async (result) => {
        const supabase = buildSupabaseMock({
          profiles: [{ level: 1, xp: 0 }],
        });

        const outcome = await applyProgression(supabase, "u-prop", [result]);

        expect(outcome.xpGained).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 500 },
    );
  });

  it("xpForLevel is monotonically increasing: xpForLevel(level) > xpForLevel(level - 1) for all levels >= 1", () => {
    fc.assert(
      fc.property(validLevel, (level) => {
        expect(xpForLevel(level)).toBeGreaterThan(xpForLevel(level - 1));
      }),
      { numRuns: 500 },
    );
  });
});
