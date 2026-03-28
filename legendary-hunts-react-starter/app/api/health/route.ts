import { NextResponse } from "next/server";
import { getPublicEnv, getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Phase 1 — liveness + config sanity (no secrets exposed).
 */
export function GET() {
  const server = getServerEnv();
  const pub = getPublicEnv();
  logger.info("health.check", { hasDatabaseUrl: Boolean(server.databaseUrl) });
  return NextResponse.json({
    ok: true,
    appName: pub.appName,
    nodeEnv: server.nodeEnv,
    databaseConfigured: Boolean(server.databaseUrl),
    schemaDraft: "docs/schema/DRAFT_SCHEMA.sql",
  });
}
