import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { submitAnswer, type SubmitAnswerInput } from "../answer-evaluation";

/**
 * Property 3: Answer evaluation correctness
 *
 * For any question with a defined correct answer set and any user-selected
 * option set, `submitAnswer` returns `correct: true` if and only if the
 * selected options exactly match the correct answer set.
 *
 * **Validates: Requirement 7.2**
 */

// ---------------------------------------------------------------------------
// Supabase mock — reuses the chain-proxy pattern from the unit test file
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
          return Promise.resolve({ data: null, error: null });
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
// Helpers
// ---------------------------------------------------------------------------

const QUESTION_ROW = {
  id: "q-prop",
  difficulty_tier: 2,
  topic_id: "topic-prop",
  short_explanation: "Property test explanation.",
};

function buildInput(selectedOptionIds: string[]): SubmitAnswerInput {
  return {
    userId: "u-prop",
    questionId: "q-prop",
    selectedOptionIds,
    responseMs: 1000,
  };
}

function buildTables(correctIds: string[]) {
  return {
    questions: [QUESTION_ROW],
    answer_options: correctIds.map((id) => ({ id })),
    user_stats: [],
    user_question_history: [],
    user_topic_continuity: [],
  };
}

/** True set-equality check used as the oracle. */
function setsEqual(a: string[], b: string[]): boolean {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Arbitrary generators
// ---------------------------------------------------------------------------

/** Generates a non-empty array of unique option ID strings. */
const uniqueOptionIds = fc
  .uniqueArray(fc.uuid(), { minLength: 1, maxLength: 8 })
  .filter((arr) => arr.length > 0);

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe("Property 3: Answer evaluation correctness", () => {
  it("submitAnswer returns correct: true iff selected options exactly match the correct answer set", async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueOptionIds,
        uniqueOptionIds,
        async (correctIds, selectedIds) => {
          const supabase = buildSupabaseMock(buildTables(correctIds));
          const result = await submitAnswer(supabase, buildInput(selectedIds));

          expect(result).not.toBeNull();

          const expectedCorrect = setsEqual(correctIds, selectedIds);
          expect(result!.correct).toBe(expectedCorrect);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("submitAnswer returns correct: true when selected options are the correct set in any order", async () => {
    await fc.assert(
      fc.asyncProperty(uniqueOptionIds, async (correctIds) => {
        // Shuffle the correct IDs to form the selected set
        const shuffled = [...correctIds].reverse();
        const supabase = buildSupabaseMock(buildTables(correctIds));
        const result = await submitAnswer(supabase, buildInput(shuffled));

        expect(result).not.toBeNull();
        expect(result!.correct).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("submitAnswer returns correct: false when selected is a strict subset of correct", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(fc.uuid(), { minLength: 2, maxLength: 8 }),
        async (correctIds) => {
          // Remove the last element to create a strict subset
          const subset = correctIds.slice(0, -1);
          const supabase = buildSupabaseMock(buildTables(correctIds));
          const result = await submitAnswer(supabase, buildInput(subset));

          expect(result).not.toBeNull();
          expect(result!.correct).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("submitAnswer returns correct: false when selected is a strict superset of correct", async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueOptionIds,
        fc.uuid(),
        async (correctIds, extraId) => {
          // Only test when extraId is not already in correctIds
          fc.pre(!correctIds.includes(extraId));

          const superset = [...correctIds, extraId];
          const supabase = buildSupabaseMock(buildTables(correctIds));
          const result = await submitAnswer(supabase, buildInput(superset));

          expect(result).not.toBeNull();
          expect(result!.correct).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 4: Timeout forces incorrect
 *
 * For any encounter where `timedOut` is true, the answer is evaluated as
 * incorrect regardless of selected options.
 *
 * **Validates: Requirement 7.5**
 */
describe("Property 4: Timeout forces incorrect", () => {
  it("submitAnswer returns correct: false when timedOut is true, even with exact correct options", async () => {
    await fc.assert(
      fc.asyncProperty(uniqueOptionIds, async (correctIds) => {
        const supabase = buildSupabaseMock(buildTables(correctIds));
        const input: SubmitAnswerInput = {
          ...buildInput(correctIds),
          timedOut: true,
        };
        const result = await submitAnswer(supabase, input);

        expect(result).not.toBeNull();
        expect(result!.correct).toBe(false);
        expect(result!.damageDealt).toBe(0);
        expect(result!.damageTaken).toBeGreaterThan(0);
      }),
      { numRuns: 200 },
    );
  });

  it("submitAnswer returns correct: false when timedOut is true with arbitrary selected options", async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueOptionIds,
        uniqueOptionIds,
        async (correctIds, selectedIds) => {
          const supabase = buildSupabaseMock(buildTables(correctIds));
          const input: SubmitAnswerInput = {
            ...buildInput(selectedIds),
            timedOut: true,
          };
          const result = await submitAnswer(supabase, input);

          expect(result).not.toBeNull();
          expect(result!.correct).toBe(false);
          expect(result!.damageDealt).toBe(0);
        },
      ),
      { numRuns: 200 },
    );
  });
});
