import type { NextRequest } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "../../db";
import { sessions } from "../../db/schema";
import { SESSION_COOKIE_NAME } from "./auth";

/** Resolves the logged-in username for a request, or null if there's no valid,
 * non-expired session cookie. Route handlers call this first thing and bail out
 * with 401 when it returns null — see app/api/character/route.ts for the pattern. */
export async function getSessionUsername(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const db = getDb();
  const session = await db
    .select({ username: sessions.username })
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, Date.now())))
    .get();
  return session?.username ?? null;
}
