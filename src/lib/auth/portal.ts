/**
 * Autentikasi portal pemilik hewan (BR-015, BR-019) — service.
 *
 * Mirip auth staff tapi terpisah: portal_user, portal_session, cookie terpisah.
 * Klinik membuat akun via admin (undangan/verifikasi).
 */
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { adminQuery } from "@/lib/db";

const scrypt = promisify(_scrypt);
const SCRYPT_KEYLEN = 64;

export const PORTAL_SESSION_COOKIE = "petora_portal_session";
export const PORTAL_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 hari

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export interface PortalUser {
  id: string;
  customerId: string;
  email: string;
  isActive: boolean;
  emailVerifiedAt: Date | null;
}

export interface PortalSession {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface AuthenticatedPortalSession extends PortalSession {
  user: PortalUser;
}

/** Buat sesi portal baru. */
export async function createPortalSession(
  userId: string,
  ttlSeconds: number = PORTAL_SESSION_TTL_SECONDS,
): Promise<{ token: string; session: PortalSession }> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const rows = await adminQuery<{ id: string; user_id: string; expires_at: Date }>(
    `insert into portal_session (user_id, token_hash, expires_at)
     values ($1,$2,$3) returning id, user_id, expires_at`,
    [userId, tokenHash, expiresAt],
  );
  const r = rows[0];
  return { token, session: { id: r.id, userId: r.user_id, expiresAt: r.expires_at } };
}

/** Autentikasi token portal. */
export async function authenticatePortal(
  token: string | undefined | null,
): Promise<AuthenticatedPortalSession | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const rows = await adminQuery<{
    id: string;
    user_id: string;
    expires_at: Date;
    revoked_at: Date | null;
    customer_id: string;
    email: string;
    is_active: boolean;
    email_verified_at: Date | null;
  }>(
    `select s.id, s.user_id, s.expires_at, s.revoked_at,
            pu.customer_id, pu.email, pu.is_active, pu.email_verified_at
       from portal_session s
       join portal_user pu on pu.id = s.user_id
      where s.token_hash = $1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at.getTime() <= Date.now()) return null;
  if (!row.is_active) return null;

  await adminQuery(`update portal_session set last_seen_at = now() where id = $1`, [row.id]).catch(
    () => undefined,
  );

  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    user: {
      id: row.user_id,
      customerId: row.customer_id,
      email: row.email,
      isActive: row.is_active,
      emailVerifiedAt: row.email_verified_at,
    },
  };
}

/** Cabut sesi portal (logout). */
export async function destroyPortalSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await adminQuery(
    `update portal_session set revoked_at = now() where token_hash = $1 and revoked_at is null`,
    [hashToken(token)],
  );
}

/** Login portal (email + password). */
export async function loginPortal(email: string, password: string): Promise<{ user: PortalUser; token: string } | null> {
  if (!email || !password) return null;
  const rows = await adminQuery<{
    id: string;
    customer_id: string;
    email: string;
    is_active: boolean;
    password_hash: string;
  }>(
    `select id, customer_id, email, is_active, password_hash from portal_user where lower(email) = lower($1)`,
    [email],
  );
  const u = rows[0];
  if (!u || !u.is_active) return null;
  const ok = await verifyPassword(password, u.password_hash);
  if (!ok) return null;
  const { token } = await createPortalSession(u.id);
  return {
    user: { id: u.id, customerId: u.customer_id, email: u.email, isActive: u.is_active, emailVerifiedAt: null },
    token,
  };
}

/** Buat akun portal untuk customer (dipakai admin/klinik). */
export async function createPortalAccount(
  customerId: string,
  email: string,
  password: string,
): Promise<PortalUser> {
  const passwordHash = await hashPassword(password);
  const rows = await adminQuery<{ id: string; customer_id: string; email: string; is_active: boolean }>(
    `insert into portal_user (customer_id, email, password_hash)
     values ($1,$2,$3) returning id, customer_id, email, is_active`,
    [customerId, email.toLowerCase(), passwordHash],
  );
  const r = rows[0];
  return { id: r.id, customerId: r.customer_id, email: r.email, isActive: r.is_active, emailVerifiedAt: null };
}

/** Set password portal (untuk ganti password). */
export async function setPortalPassword(userId: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  await adminQuery(`update portal_user set password_hash = $1 where id = $2`, [hash, userId]);
}