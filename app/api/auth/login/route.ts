import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users, sessions, characters } from "../../../../db/schema";
import { verifyPassword, generateSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "../../../lib/auth";

export async function POST(request: NextRequest) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) return NextResponse.json({ error: "Introduce usuario y contraseña." }, { status: 400 });

  const db = await getDb();
  const user = await db.select().from(users).where(eq(users.username, username)).get();
  if (!user || !(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const token = generateSessionToken();
  const now = Date.now();
  await db.insert(sessions).values({ token, username, createdAt: now, expiresAt: now + SESSION_TTL_MS });

  const character = await db.select().from(characters).where(eq(characters.username, username)).get();

  const response = NextResponse.json({ username, character: character ?? null });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return response;
}
