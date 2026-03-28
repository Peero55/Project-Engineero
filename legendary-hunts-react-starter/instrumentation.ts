/**
 * Phase 1 — Next.js instrumentation hook (startup signal).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("./lib/logger");
    logger.info("instrumentation.register");
  }
}
