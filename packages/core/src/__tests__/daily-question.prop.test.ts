import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { canReceiveQuestion } from "../daily-question";

/**
 * Property 6: Daily question quota enforcement
 *
 * For any user who has received N >= `questions_per_day` questions on a given
 * day, `canReceiveQuestion` returns false.
 *
 * **Validates: Requirement 4.4**
 */

// ---------------------------------------------------------------------------
// Supabase mock — reuses the chain-proxy pattern from the unit test file,
// extended with `count` support for the head query used by canReceiveQuestion.
// ---------------------------------------------------------------------------

type ResolvedData = { data: unknown; error: unknown; count?: number | null };

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
        return new Proxy({}, handler);
      };
    },
  };
  return new Proxy({}, handler);
}

function buildSupabaseMock(opts: {
  questionsPerDay: number;
  deliveryCount: number;
}) {
  return {
    from: vi.fn((table: string) => {
      if (table === "daily_question_config") {
        return mockChain({
          data: [
            {
              questions_per_day: opts.questionsPerDay,
              delivery_timezone: "UTC",
            },
          ],
          error: null,
        });
      }
      if (table === "daily_question_deliveries") {
        return mockChain({
          data: null,
          error: null,
          count: opts.deliveryCount,
        });
      }
      return mockChain({ data: null, error: null });
    }),
  } as any;
}

// ---------------------------------------------------------------------------
// Arbitrary generators
// ---------------------------------------------------------------------------

/** Quota between 1 and 50 (reasonable daily limits). */
const quotaArb = fc.integer({ min: 1, max: 50 });

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

const USER_ID = "u-prop-daily";
const CERT_ID = "cert-prop";

describe("Property 6: Daily question quota enforcement", () => {
  it("canReceiveQuestion returns false when deliveryCount >= questions_per_day", async () => {
    await fc.assert(
      fc.asyncProperty(
        quotaArb,
        fc.integer({ min: 0, max: 100 }),
        async (questionsPerDay, extra) => {
          // deliveryCount is at or above the quota
          const deliveryCount = questionsPerDay + extra;

          const supabase = buildSupabaseMock({
            questionsPerDay,
            deliveryCount,
          });
          const result = await canReceiveQuestion(supabase, USER_ID, CERT_ID);

          expect(result).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("canReceiveQuestion returns true when deliveryCount < questions_per_day", async () => {
    await fc.assert(
      fc.asyncProperty(quotaArb, async (questionsPerDay) => {
        // Pick a delivery count strictly below the quota
        const deliveryCount = fc.sample(
          fc.integer({ min: 0, max: questionsPerDay - 1 }),
          1,
        )[0]!;

        const supabase = buildSupabaseMock({ questionsPerDay, deliveryCount });
        const result = await canReceiveQuestion(supabase, USER_ID, CERT_ID);

        expect(result).toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});
