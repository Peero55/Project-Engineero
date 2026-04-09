import { describe, it, expect, vi } from "vitest";
import { canReceiveQuestion } from "../daily-question";

// ---------------------------------------------------------------------------
// Supabase mock — adapted from existing tests to support `count` responses
// needed by canReceiveQuestion's `select("*", { count: "exact", head: true })`
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

/**
 * Build a mock SupabaseClient with per-table data.
 *
 * `daily_question_config` rows are returned via `.maybeSingle()`.
 * `daily_question_deliveries` needs a `count` field for the head query.
 */
function buildSupabaseMock(opts: {
  config?: { questions_per_day: number; delivery_timezone: string } | null;
  deliveryCount?: number;
  deliveryError?: boolean;
}) {
  const configData = opts.config ?? null;
  const deliveryCount = opts.deliveryCount ?? 0;

  return {
    from: vi.fn((table: string) => {
      if (table === "daily_question_config") {
        return mockChain({
          data: configData ? [configData] : null,
          error: null,
        });
      }
      if (table === "daily_question_deliveries") {
        return mockChain({
          data: null,
          error: opts.deliveryError ? { message: "db error" } : null,
          count: opts.deliveryError ? null : deliveryCount,
        });
      }
      return mockChain({ data: null, error: null });
    }),
  } as any;
}

// ---------------------------------------------------------------------------
// Tests — Validates: Requirements 12.6, 4.4
// ---------------------------------------------------------------------------

const USER_ID = "u-daily-001";
const CERT_ID = "cert-001";

const defaultConfig = { questions_per_day: 5, delivery_timezone: "UTC" };

describe("canReceiveQuestion", () => {
  it("returns true when user has received 0 questions today", async () => {
    const supabase = buildSupabaseMock({
      config: defaultConfig,
      deliveryCount: 0,
    });

    const result = await canReceiveQuestion(supabase, USER_ID, CERT_ID);

    expect(result).toBe(true);
  });

  it("returns true when user is under the daily quota", async () => {
    const supabase = buildSupabaseMock({
      config: defaultConfig,
      deliveryCount: 3,
    });

    const result = await canReceiveQuestion(supabase, USER_ID, CERT_ID);

    expect(result).toBe(true);
  });

  it("returns false when user has reached the daily quota", async () => {
    const supabase = buildSupabaseMock({
      config: defaultConfig,
      deliveryCount: 5,
    });

    const result = await canReceiveQuestion(supabase, USER_ID, CERT_ID);

    expect(result).toBe(false);
  });

  it("returns false when user has exceeded the daily quota", async () => {
    const supabase = buildSupabaseMock({
      config: defaultConfig,
      deliveryCount: 7,
    });

    const result = await canReceiveQuestion(supabase, USER_ID, CERT_ID);

    expect(result).toBe(false);
  });

  it("returns false when no daily config exists", async () => {
    const supabase = buildSupabaseMock({
      config: null,
      deliveryCount: 0,
    });

    const result = await canReceiveQuestion(supabase, USER_ID, CERT_ID);

    expect(result).toBe(false);
  });

  it("returns false when the delivery count query errors", async () => {
    const supabase = buildSupabaseMock({
      config: defaultConfig,
      deliveryError: true,
    });

    const result = await canReceiveQuestion(supabase, USER_ID, CERT_ID);

    expect(result).toBe(false);
  });

  it("respects a custom questions_per_day value", async () => {
    const supabase = buildSupabaseMock({
      config: { questions_per_day: 2, delivery_timezone: "UTC" },
      deliveryCount: 1,
    });

    const result = await canReceiveQuestion(supabase, USER_ID, CERT_ID);

    expect(result).toBe(true);

    const supabaseAtQuota = buildSupabaseMock({
      config: { questions_per_day: 2, delivery_timezone: "UTC" },
      deliveryCount: 2,
    });

    const resultAtQuota = await canReceiveQuestion(
      supabaseAtQuota,
      USER_ID,
      CERT_ID,
    );

    expect(resultAtQuota).toBe(false);
  });

  it("passes null certificationId to config lookup", async () => {
    const supabase = buildSupabaseMock({
      config: defaultConfig,
      deliveryCount: 0,
    });

    const result = await canReceiveQuestion(supabase, USER_ID, null);

    expect(result).toBe(true);
    // Verify the config table was queried
    expect(supabase.from).toHaveBeenCalledWith("daily_question_config");
  });
});
