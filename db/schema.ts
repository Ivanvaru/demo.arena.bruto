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
