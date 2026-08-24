import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { characters } from "../../../db/schema";
import { getSessionUsername } from "../../lib/session";

export async function GET(request: NextRequest) {
  const username = await getSessionUsername(request);
  if (!username) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const db = getDb();
  const character = await db.select().from(characters).where(eq(characters.username, username)).get();
  return NextResponse.json({ character: character ?? null });
}

type CharacterPayload = {
  name: string;
  className: string;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  hairStyle: string;
  hairColor: string;
  skinToneId: string;
  eyeStyleId: string;
  eyeColor: string;
  eyebrowStyleId: string;
};

function parsePayload(body: unknown): CharacterPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || !b.name.trim()) return null;
  if (typeof b.className !== "string") return null;
  const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
  const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
  return {
    name: b.name.trim().slice(0, 18),
    className: b.className,
    level: Math.max(1, Math.round(num(b.level, 1))),
    xp: Math.max(0, Math.round(num(b.xp, 0))),
    wins: Math.max(0, Math.round(num(b.wins, 0))),
    losses: Math.max(0, Math.round(num(b.losses, 0))),
    hairStyle: str(b.hairStyle, "corto"),
    hairColor: str(b.hairColor, "#3b2313"),
    skinToneId: str(b.skinToneId, "clara"),
    eyeStyleId: str(b.eyeStyleId, "estandar"),
    eyeColor: str(b.eyeColor, "#3b2313"),
    eyebrowStyleId: str(b.eyebrowStyleId, "pobladas"),
  };
}

export async function POST(request: NextRequest) {
  const username = await getSessionUsername(request);
  if (!username) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const payload = parsePayload(rawBody);
  if (!payload) return NextResponse.json({ error: "Datos de personaje incompletos." }, { status: 400 });

  const db = getDb();
  const now = Date.now();
  await db
    .insert(characters)
    .values({ username, ...payload, updatedAt: now })
    .onConflictDoUpdate({ target: characters.username, set: { ...payload, updatedAt: now } });

  const character = await db.select().from(characters).where(eq(characters.username, username)).get();
  return NextResponse.json({ character });
}
