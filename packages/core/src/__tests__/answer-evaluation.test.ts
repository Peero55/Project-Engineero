import { describe, it, expect, vi } from "vitest";
import { submitAnswer, type SubmitAnswerInput } from "../answer-evaluation";
import { DAMAGE_BY_DIFFICULTY } from "@legendary-hunts/config";

// ---------------------------------------------------------------------------
// Supabase mock — every chain method returns the same proxy so arbitrary
// .select().eq().eq().single() / .maybeSingle() / .in() chains all resolve.
// ---------------------------------------------------------------------------

type ResolvedData = { data: unknown; error: unknown };

function mockChain(resolved: ResolvedData) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") {
        // Make the chain awaitable — returns the array/raw data
        return (
          onFulfilled: (v: ResolvedData) => void,
          onRejected: (e: unknown) => void,
        ) => Promise.resolve(resolved).then(onFulfilled, onRejected);
      }
      // Any method call (.select, .eq, .single, .maybeSingle, .in, .upsert, …)
      return (..._args: unknown[]) => {
        if (prop === "single" || prop === "maybeSingle") {
          // .single() extracts first element when data is an array
          const d = Array.isArray(resolved.data)
            ? (resolved.data[0] ?? null)
            : resolved.data;
          return Promise.resolve({ data: d, error: resolved.error });
        }
        if (prop === "insert" || prop === "upsert") {
          return Promise.resolve({ data: null, error: null });
        }
        return new Proxy({}, handler);
      };
    },
  };
  return new Proxy({}, handler);
}

/**
 * Build a mock SupabaseClient where `from(table)` returns a chain that
 * resolves to the data configured for that table.
 */
function buildSupabaseMock(tableData: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => {
      const data = table in tableData ? tableData[table] : null;
      return mockChain({ data, error: null });
    }),
  } as any;
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const QUESTION_ID = "q-001";
const USER_ID = "u-001";
const TOPIC_ID = "topic-abc";

const questionRow = {
  id: QUESTION_ID,
  difficulty_tier: 3,
  topic_id: TOPIC_ID,
  short_explanation: "Because TCP uses a three-way handshake.",
};

function baseInput(overrides?: Partial<SubmitAnswerInput>): SubmitAnswerInput {
  return {
    userId: USER_ID,
    questionId: QUESTION_ID,
    selectedOptionIds: ["opt-a", "opt-b"],
    responseMs: 3000,
    ...overrides,
  };
}

/** Standard table data where the correct options are opt-a and opt-b. */
function tables(correctIds: string[] = ["opt-a", "opt-b"]) {
  return {
    // Array so non-.single() calls get an iterable; .single() extracts [0]
    questions: [questionRow],
    answer_options: correctIds.map((id) => ({ id })),
    user_stats: [],
    user_question_history: [],
    user_topic_continuity: [],
  };
}

// ---------------------------------------------------------------------------
// Tests — Validates: Requirements 7.2, 7.5, 12.3
// ---------------------------------------------------------------------------

describe("submitAnswer", () => {
  it("returns correct: true when selected options exactly match the correct set", async () => {
    const supabase = buildSupabaseMock(tables(["opt-a", "opt-b"]));

    const result = await submitAnswer(supabase, baseInput());

    expect(result).not.toBeNull();
    expect(result!.correct).toBe(true);
    expect(result!.damageDealt).toBe(DAMAGE_BY_DIFFICULTY[3]); // 25
    expect(result!.damageTaken).toBe(0);
    expect(result!.explanation).toBe(questionRow.short_explanation);
    expect(result!.updatedStats.topicId).toBe(TOPIC_ID);
    expect(result!.updatedStats.correctCount).toBe(1);
    expect(result!.updatedStats.incorrectCount).toBe(0);
  });

  it("returns correct: false when selected options do not match the correct set", async () => {
    const supabase = buildSupabaseMock(tables(["opt-a", "opt-b"]));

    const result = await submitAnswer(
      supabase,
      baseInput({ selectedOptionIds: ["opt-a", "opt-c"] }),
    );

    expect(result).not.toBeNull();
    expect(result!.correct).toBe(false);
    expect(result!.damageDealt).toBe(0);
    expect(result!.damageTaken).toBeGreaterThanOrEqual(25);
  });

  it("returns correct: false when timedOut is true, even if options match", async () => {
    const supabase = buildSupabaseMock(tables(["opt-a", "opt-b"]));

    const result = await submitAnswer(supabase, baseInput({ timedOut: true }));

    expect(result).not.toBeNull();
    expect(result!.correct).toBe(false);
    expect(result!.damageDealt).toBe(0);
    // timedOut skips the slow-response penalty branch
    expect(result!.damageTaken).toBe(25);
  });

  it("returns correct: false when selectedOptionIds is empty", async () => {
    const supabase = buildSupabaseMock(tables(["opt-a", "opt-b"]));

    const result = await submitAnswer(
      supabase,
      baseInput({ selectedOptionIds: [] }),
    );

    expect(result).not.toBeNull();
    expect(result!.correct).toBe(false);
    expect(result!.damageDealt).toBe(0);
  });

  it("returns null when the question does not exist", async () => {
    const supabase = buildSupabaseMock({ ...tables(), questions: [] });

    const result = await submitAnswer(supabase, baseInput());

    expect(result).toBeNull();
  });

  it("adds slow penalty to damageTaken for incorrect answers with slow response", async () => {
    const supabase = buildSupabaseMock(tables(["opt-a"]));

    // 8000ms → 3 extra seconds beyond 5000ms threshold → floor(3 * 2) = 6
    const result = await submitAnswer(
      supabase,
      baseInput({ selectedOptionIds: ["opt-wrong"], responseMs: 8000 }),
    );

    expect(result).not.toBeNull();
    expect(result!.correct).toBe(false);
    // BASE_DAMAGE_TAKEN (25) + 6 = 31
    expect(result!.damageTaken).toBe(31);
  });
});
