/**
 * Web client session: idle logout does not limit paused battles (server-side pause is indefinite).
 */
export const SESSION_CONFIG = {
  /** Log out / clear client session identity after this much UI inactivity */
  idleLogoutMs: 30 * 60 * 1000,
} as const;
