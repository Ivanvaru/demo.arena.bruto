import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** One row per account. `username` is the login handle and the primary key —
 * there's no email yet, so it's also how a character is looked up. Passwords
 * are never stored in plain text: only a PBKDF2 hash + its salt (see app/lib/auth.ts). */
export const users = sqliteTable("users", {
  username: text("username").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: integer("created_at").notNull(),
});

/** Opaque session tokens issued on login/register, sent back as an httpOnly cookie.
 * A row here is the only thing that proves a request belongs to a logged-in user. */
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  username: text("username").notNull(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

/** One saved brute per account. Mirrors the identity/outfit fields the creator
 * screen already collects, plus the leveling fields (level/xp) and a simple
 * win/loss counter. `username` is the primary key: one character per account for now. */
export const characters = sqliteTable("characters", {
  username: text("username").primaryKey(),
  name: text("name").notNull(),
  className: text("class_name").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  hairStyle: text("hair_style").notNull(),
  hairColor: text("hair_color").notNull(),
  skinToneId: text("skin_tone_id").notNull(),
  eyeStyleId: text("eye_style_id").notNull(),
  eyeColor: text("eye_color").notNull(),
  eyebrowStyleId: text("eyebrow_style_id").notNull(),
  updatedAt: integer("updated_at").notNull(),
});


/** A player-created clan. `id` is a random token minted at creation time —
 * kept as a plain string (no autoincrement) to match this schema's style. */
export const clans = sqliteTable("clans", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    leaderUsername: text("leader_username").notNull(),
    createdAt: integer("created_at").notNull(),
});

/** Clan roster. `username` is the primary key so a player can belong to at
 * most one clan at a time — joining a new clan simply overwrites the row. */
export const clanMembers = sqliteTable("clan_members", {
    username: text("username").primaryKey(),
    clanId: text("clan_id").notNull(),
    role: text("role").notNull().default("member"),
    joinedAt: integer("joined_at").notNull(),
});

/** Pending clan invites. `username` is the primary key: a player can only
 * have one open invite at a time (a newer invite replaces an older one). */
export const clanInvites = sqliteTable("clan_invites", {
    username: text("username").primaryKey(),
    clanId: text("clan_id").notNull(),
    invitedBy: text("invited_by").notNull(),
    createdAt: integer("created_at").notNull(),
});
