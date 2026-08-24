/** Password hashing + session token helpers, built on the Web Crypto API that's
 * natively available in the Workers runtime (no extra dependency, no native addon). */
export const PBKDF2_ITERATIONS = 120_000;

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view).map(b => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** Derives a PBKDF2-SHA256 hash for `password`. Generates a fresh random salt unless
 * `saltHex` is given (used when re-checking a password against a stored hash). */
export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, keyMaterial, 256);
  return { hash: toHex(bits), salt: toHex(salt) };
}

export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt);
  if (hash.length !== storedHash.length) return false;
  // Constant-time-ish comparison to avoid trivial timing side-channels.
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  return diff === 0;
}

export function generateSessionToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export const SESSION_COOKIE_NAME = "liga_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function validateUsername(username: string): string | null {
  if (!USERNAME_PATTERN.test(username)) return "El nombre de usuario debe tener entre 3 y 20 caracteres (letras, números o guión bajo).";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  if (password.length > 72) return "La contraseña es demasiado larga.";
  return null;
}
