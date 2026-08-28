import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { clans, clanMembers, clanInvites, characters } from "../../../db/schema";
import { getSessionUsername } from "../../lib/session";

/** Returns the logged-in player's clan status in one shot: their clan +
 * roster if they're in one, or the full browsable clan list + any pending
 * invite otherwise. Keeps the client to a single fetch per screen load. */
export async function GET(request: NextRequest) {
    const username = await getSessionUsername(request);
    if (!username) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const db = await getDb();

    const membership = await db.select().from(clanMembers).where(eq(clanMembers.username, username)).get();

    if (membership) {
          const clan = await db.select().from(clans).where(eq(clans.id, membership.clanId)).get();
          const roster = await db.select().from(clanMembers).where(eq(clanMembers.clanId, membership.clanId)).all();
          return NextResponse.json({ clan: clan ?? null, members: roster, myRole: membership.role, clans: [], invite: null });
        }

    const invite = await db.select().from(clanInvites).where(eq(clanInvites.username, username)).get();
    const allClans = await db.select().from(clans).all();
    const allMembers = await db.select().from(clanMembers).all();
    const counts: Record<string, number> = {};
    for (const m of allMembers) counts[m.clanId] = (counts[m.clanId] ?? 0) + 1;
    const list = allClans.map((c) => ({ ...c, memberCount: counts[c.id] ?? 0 }));

    return NextResponse.json({ clan: null, members: [], myRole: null, clans: list, invite: invite ?? null });
  }

type Action =
  | { action: "create"; name: string }
  | { action: "join"; clanId: string }
  | { action: "invite"; username: string }
  | { action: "leave" }
  | { action: "kick"; username: string }
  | { action: "acceptInvite" }
  | { action: "declineInvite" };

function parseAction(body: unknown): Action | null {
    if (!body || typeof body !== "object") return null;
    const b = body as Record<string, unknown>;
    const action = typeof b.action === "string" ? b.action : "";
    if (action === "create") {
          if (typeof b.name !== "string" || !b.name.trim()) return null;
          return { action, name: b.name.trim().slice(0, 24) };
        }
    if (action === "join") {
          if (typeof b.clanId !== "string" || !b.clanId) return null;
          return { action, clanId: b.clanId };
        }
    if (action === "invite" || action === "kick") {
          if (typeof b.username !== "string" || !b.username.trim()) return null;
          return { action, username: b.username.trim() };
        }
    if (action === "leave" || action === "acceptInvite" || action === "declineInvite") return { action };
    return null;
  }

export async function POST(request: NextRequest) {
    const username = await getSessionUsername(request);
    if (!username) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    let rawBody: unknown;
    try {
          rawBody = await request.json();
        } catch {
          return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
        }
    const payload = parseAction(rawBody);
    if (!payload) return NextResponse.json({ error: "Accion de clan no valida." }, { status: 400 });

    const db = await getDb();
    const now = Date.now();
    const membership = await db.select().from(clanMembers).where(eq(clanMembers.username, username)).get();

    if (payload.action === "create") {
          if (membership) return NextResponse.json({ error: "Ya perteneces a un clan." }, { status: 409 });
          const id = crypto.randomUUID();
          await db.insert(clans).values({ id, name: payload.name, leaderUsername: username, createdAt: now });
          await db.insert(clanMembers).values({ username, clanId: id, role: "leader", joinedAt: now });
          await db.delete(clanInvites).where(eq(clanInvites.username, username));
          return NextResponse.json({ ok: true });
        }

    if (payload.action === "join") {
          if (membership) return NextResponse.json({ error: "Ya perteneces a un clan." }, { status: 409 });
          const clan = await db.select().from(clans).where(eq(clans.id, payload.clanId)).get();
          if (!clan) return NextResponse.json({ error: "Ese clan ya no existe." }, { status: 404 });
          await db.insert(clanMembers).values({ username, clanId: clan.id, role: "member", joinedAt: now });
          await db.delete(clanInvites).where(eq(clanInvites.username, username));
          return NextResponse.json({ ok: true });
        }

    if (payload.action === "acceptInvite") {
          if (membership) return NextResponse.json({ error: "Ya perteneces a un clan." }, { status: 409 });
          const invite = await db.select().from(clanInvites).where(eq(clanInvites.username, username)).get();
          if (!invite) return NextResponse.json({ error: "No tienes invitaciones pendientes." }, { status: 404 });
          const clan = await db.select().from(clans).where(eq(clans.id, invite.clanId)).get();
          if (!clan) {
                  await db.delete(clanInvites).where(eq(clanInvites.username, username));
                  return NextResponse.json({ error: "Ese clan ya no existe." }, { status: 404 });
                }
          await db.insert(clanMembers).values({ username, clanId: clan.id, role: "member", joinedAt: now });
          await db.delete(clanInvites).where(eq(clanInvites.username, username));
          return NextResponse.json({ ok: true });
        }

    if (payload.action === "declineInvite") {
          await db.delete(clanInvites).where(eq(clanInvites.username, username));
          return NextResponse.json({ ok: true });
        }

    if (payload.action === "invite") {
          if (!membership) return NextResponse.json({ error: "No perteneces a ningun clan." }, { status: 403 });
          const target = payload.username;
          if (target === username) return NextResponse.json({ error: "No puedes invitarte a ti mismo." }, { status: 400 });
          const targetCharacter = await db.select().from(characters).where(eq(characters.username, target)).get();
          if (!targetCharacter) return NextResponse.json({ error: "Ese jugador no existe." }, { status: 404 });
          const targetMembership = await db.select().from(clanMembers).where(eq(clanMembers.username, target)).get();
          if (targetMembership) return NextResponse.json({ error: "Ese jugador ya esta en un clan." }, { status: 409 });
          await db
            .insert(clanInvites)
            .values({ username: target, clanId: membership.clanId, invitedBy: username, createdAt: now })
            .onConflictDoUpdate({ target: clanInvites.username, set: { clanId: membership.clanId, invitedBy: username, createdAt: now } });
          return NextResponse.json({ ok: true });
        }

    if (payload.action === "leave") {
          if (!membership) return NextResponse.json({ error: "No perteneces a ningun clan." }, { status: 403 });
          await db.delete(clanMembers).where(eq(clanMembers.username, username));
          const remaining = await db.select().from(clanMembers).where(eq(clanMembers.clanId, membership.clanId)).all();
          if (remaining.length === 0) {
                  await db.delete(clans).where(eq(clans.id, membership.clanId));
                } else if (membership.role === "leader") {
                  const next = remaining.slice().sort((a, b) => a.joinedAt - b.joinedAt)[0];
                  await db.update(clanMembers).set({ role: "leader" }).where(eq(clanMembers.username, next.username));
                  await db.update(clans).set({ leaderUsername: next.username }).where(eq(clans.id, membership.clanId));
                }
          return NextResponse.json({ ok: true });
        }

    if (payload.action === "kick") {
          if (!membership || membership.role !== "leader") return NextResponse.json({ error: "Solo el lider puede expulsar." }, { status: 403 });
          if (payload.username === username) return NextResponse.json({ error: "No puedes expulsarte a ti mismo." }, { status: 400 });
          const target = await db.select().from(clanMembers).where(eq(clanMembers.username, payload.username)).get();
          if (!target || target.clanId !== membership.clanId) return NextResponse.json({ error: "Ese jugador no esta en tu clan." }, { status: 404 });
          await db.delete(clanMembers).where(eq(clanMembers.username, payload.username));
          return NextResponse.json({ ok: true });
        }

    return NextResponse.json({ error: "Accion de clan no valida." }, { status: 400 });
  }
