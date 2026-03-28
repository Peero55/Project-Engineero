/**
 * Phase 1 — minimal structured logging (no external deps).
 * Prefer passing context objects; never log secrets.
 */

import { getServerEnv } from "./env";

type LogMeta = Record<string, unknown> | undefined;

function baseRecord(level: string, msg: string, meta?: LogMeta) {
  const env = getServerEnv();
  return {
    ts: new Date().toISOString(),
    level,
    msg,
    nodeEnv: env.nodeEnv,
    logLevel: env.logLevel,
    ...meta,
  };
}

function shouldLog(level: "debug" | "info" | "warn" | "error"): boolean {
  const order = { debug: 0, info: 1, warn: 2, error: 3 };
  const min = getServerEnv().logLevel;
  return order[level] >= order[min];
}

export const logger = {
  debug(msg: string, meta?: LogMeta) {
    if (!shouldLog("debug")) return;
    console.debug(JSON.stringify(baseRecord("debug", msg, meta)));
  },
  info(msg: string, meta?: LogMeta) {
    if (!shouldLog("info")) return;
    console.info(JSON.stringify(baseRecord("info", msg, meta)));
  },
  warn(msg: string, meta?: LogMeta) {
    if (!shouldLog("warn")) return;
    console.warn(JSON.stringify(baseRecord("warn", msg, meta)));
  },
  error(msg: string, meta?: LogMeta) {
    console.error(JSON.stringify(baseRecord("error", msg, meta)));
  },
};
