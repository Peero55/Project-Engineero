import { z } from "zod";

/**
 * UUID validation that accepts standard format (Postgres and seed IDs).
 * Stricter than a simple hex check, more permissive than RFC 4122.
 */
export const uuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Invalid UUID"
);
