import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users, sessions } from "../../../../db/schema";
import { hashPassword, generateSessionToken, validateUsername, validatePassword, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "../../../lib/auth";

export async function POST(request: NextRequest) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const usernameError = validateUsername(username);
  if (usernameError) return NextResponse.json({ error: usernameError }, { status: 400 });
  const passwordError = validatePassword(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  const db = await getDb();
  const existing = await db.select({ username: users.username }).from(users).where(eq(users.username, username)).get();
  if (existing) return NextResponse.json({ error: "Ese nombre de usuario ya está en uso." }, { status: 409 });

  const { hash, salt } = await hashPassword(password);
  const now = Date.now();
  await db.insert(users).values({ username, passwordHash: hash, passwordSalt: salt, createdAt: now });

  const token = generateSessionToken();
  await db.insert(sessions).values({ token, username, createdAt: now, expiresAt: now + SESSION_TTL_MS });

  const response = NextResponse.json({ username, character: null });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return response;
}
