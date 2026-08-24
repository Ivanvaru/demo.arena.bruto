import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/** `cloudflare:workers` only exists inside the real Workers runtime (workerd).
 * Importing it statically at module scope breaks vinext's build-time server
 * smoke test, which boots the app under plain Node.js. A dynamic import defers
 * resolution until getDb() is actually called from a real request. */
export async function getDb() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
