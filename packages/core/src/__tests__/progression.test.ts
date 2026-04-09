import { describe, it, expect, vi } from "vitest";
import {
  applyProgression,
  type BattleResultForProgression,
} from "../progression";
import { XP_BY_DIFFICULTY, xpForLevel } from "@legendary-hunts/config";

// ---------------------------------------------------------------------------
// Supabase mock — reuses the proxy-chain pattern from answer-evaluation tests
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
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = "u-prog-001";

function makeResult(
  overrides?: Partial<BattleResultForProgression>,
): BattleResultForProgression {
  return {
    correct: true,
    difficulty: 2,
    questionId: "q-001",
    timesSeenBefore: 0,
    ...overrides,
  };
}

function profileTables(level = 1, xp = 0) {
  return {
    profiles: [{ level, xp }],
  };
}

// ---------------------------------------------------------------------------
// Tests — Validates: Requirements 12.5, 8.1
// ---------------------------------------------------------------------------

describe("applyProgression", () => {
  // --- XP by difficulty tier ---

  it.each([
    [1, XP_BY_DIFFICULTY[1]],
    [2, XP_BY_DIFFICULTY[2]],
    [3, XP_BY_DIFFICULTY[3]],
    [4, XP_BY_DIFFICULTY[4]],
  ])(
    "awards %i-tier base XP (%i) for a correct answer",
    async (tier, expectedXp) => {
      const supabase = buildSupabaseMock(profileTables(1, 0));

      const result = await applyProgression(supabase, USER_ID, [
        makeResult({ difficulty: tier, correct: true }),
      ]);

      expect(result.xpGained).toBe(expectedXp);
    },
  );

  // --- Incorrect answer reduced XP (0.25 multiplier) ---

  it.each([
    [1, Math.floor(XP_BY_DIFFICULTY[1] * 0.25)],
    [2, Math.floor(XP_BY_DIFFICULTY[2] * 0.25)],
    [3, Math.floor(XP_BY_DIFFICULTY[3] * 0.25)],
    [4, Math.floor(XP_BY_DIFFICULTY[4] * 0.25)],
  ])(
    "awards reduced XP (0.25×) for incorrect answer at tier %i → %i XP",
    async (tier, expectedXp) => {
      const supabase = buildSupabaseMock(profileTables(1, 0));

      const result = await applyProgression(supabase, USER_ID, [
        makeResult({ difficulty: tier, correct: false }),
      ]);

      expect(result.xpGained).toBe(expectedXp);
    },
  );

  // --- Repetition penalty ---

  it("applies repetition penalty (0.7^n) for repeated questions", async () => {
    const supabase = buildSupabaseMock(profileTables(1, 0));
    const baseXp = XP_BY_DIFFICULTY[2]; // 20

    // First time seen → full XP
    const fresh = await applyProgression(supabase, USER_ID, [
      makeResult({ timesSeenBefore: 0 }),
    ]);
    expect(fresh.xpGained).toBe(baseXp);

    // Seen once before → 0.7 multiplier
    const once = await applyProgression(supabase, USER_ID, [
      makeResult({ timesSeenBefore: 1 }),
    ]);
    expect(once.xpGained).toBe(Math.floor(baseXp * 0.7));

    // Seen twice before → 0.7^2 multiplier
    const twice = await applyProgression(supabase, USER_ID, [
      makeResult({ timesSeenBefore: 2 }),
    ]);
    expect(twice.xpGained).toBe(Math.floor(baseXp * 0.49));
  });

  it("stacks repetition penalty with incorrect multiplier", async () => {
    const supabase = buildSupabaseMock(profileTables(1, 0));
    const baseXp = XP_BY_DIFFICULTY[3]; // 35

    const result = await applyProgression(supabase, USER_ID, [
      makeResult({ difficulty: 3, correct: false, timesSeenBefore: 1 }),
    ]);

    // 35 * 0.25 (incorrect) * 0.7 (seen once) = floor(6.125) = 6
    expect(result.xpGained).toBe(Math.floor(baseXp * 0.25 * 0.7));
  });

  // --- Multiple results summed ---

  it("sums XP across multiple battle results", async () => {
    const supabase = buildSupabaseMock(profileTables(1, 0));

    const result = await applyProgression(supabase, USER_ID, [
      makeResult({ difficulty: 1, correct: true }),
      makeResult({ difficulty: 3, correct: false }),
    ]);

    const expected =
      XP_BY_DIFFICULTY[1] + Math.floor(XP_BY_DIFFICULTY[3] * 0.25);
    expect(result.xpGained).toBe(expected);
  });

  // --- Level-up ---

  it("levels up when accumulated XP exceeds threshold", async () => {
    // xpForLevel(1) = 100, so starting at xp=95 and gaining 10 should level up
    const supabase = buildSupabaseMock(profileTables(1, 95));

    const result = await applyProgression(supabase, USER_ID, [
      makeResult({ difficulty: 1, correct: true }), // +10 XP
    ]);

    expect(result.level).toBe(2);
    // 95 + 10 = 105, minus xpForLevel(1)=100 → 5 remaining
    expect(result.xp).toBe(5);
    expect(result.xpGained).toBe(XP_BY_DIFFICULTY[1]);
  });

  // --- Missing profile fallback ---

  it("returns default values when profile is not found", async () => {
    const supabase = buildSupabaseMock({ profiles: [] });

    const result = await applyProgression(supabase, USER_ID, [
      makeResult({ difficulty: 2, correct: true }),
    ]);

    expect(result).toEqual({ level: 1, xp: 0, xpGained: XP_BY_DIFFICULTY[2] });
  });
});
