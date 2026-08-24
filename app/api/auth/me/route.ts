import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { characters } from "../../../../db/schema";
import { getSessionUsername } from "../../../lib/session";

export async function GET(request: NextRequest) {
  const username = await getSessionUsername(request);
  if (!username) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const db = getDb();
  const character = await db.select().from(characters).where(eq(characters.username, username)).get();
  return NextResponse.json({ username, character: character ?? null });
}
