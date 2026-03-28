/**
 * Phase 1 — environment config (server-safe).
 * Client components must only use NEXT_PUBLIC_* via getPublicEnv().
 */

export type ServerEnv = {
  nodeEnv: "development" | "production" | "test";
  /** Optional until a database is attached in a later phase */
  databaseUrl: string | undefined;
  logLevel: "debug" | "info" | "warn" | "error";
};

function parseNodeEnv(): ServerEnv["nodeEnv"] {
  const v = process.env.NODE_ENV;
  if (v === "production" || v === "test") return v;
  return "development";
}

function parseLogLevel(): ServerEnv["logLevel"] {
  const v = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  if (v === "debug" || v === "warn" || v === "error") return v;
  return "info";
}

/** Read once per process; safe in Server Components and Route Handlers. */
export function getServerEnv(): ServerEnv {
  return {
    nodeEnv: parseNodeEnv(),
    databaseUrl: process.env.DATABASE_URL?.trim() || undefined,
    logLevel: parseLogLevel(),
  };
}

export type PublicEnv = {
  appName: string;
};

/** Safe to expose to the browser (NEXT_PUBLIC_* only). */
export function getPublicEnv(): PublicEnv {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Legendary Hunts",
  };
}
