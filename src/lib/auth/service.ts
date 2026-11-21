/**
 * Autentikasi lokal (tanpa Supabase, K-009) — service.
 *
 * Sesi = token opaque acak (random 32 byte, base64url) di cookie HttpOnly peramban.
 * DB hanya menyimpan SHA-256(token) (hex) — token mentah tidak pernah disimpan (BR-014:
 * perlindungan kredensial). Autentikasi route = hash cookie -> cari sesi aktif -> set
 * app.user_id (RLS) -> query sebagai authenticated.
 */
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { adminQuery } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "./constants";

export { SESSION_COOKIE, SESSION_TTL_SECONDS };

const scrypt = promisify(_scrypt);
const SCRYPT_KEYLEN = 64;

/** Hash SHA-256 token -> hex 64 char. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Buat token sesi acak baru (base64url). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash password dengan scrypt + salt acak. Format "scrypt$<salt>$<hash>". */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

/** Verifikasi password terhadap hash tersimpan. */
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

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

/** Buat sesi baru untuk `userId`. Mengembalikan token mentah + metadata. */
export async function createSession(
  userId: string,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<{ token: string; session: Session }> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const rows = await adminQuery<{ id: string; user_id: string; expires_at: Date }>(
    `insert into app_session (user_id, token_hash, expires_at)
     values ($1,$2,$3) returning id, user_id, expires_at`,
    [userId, tokenHash, expiresAt],
  );
  const r = rows[0];
  return { token, session: { id: r.id, userId: r.user_id, expiresAt: r.expires_at } };
}

export interface AuthenticatedSession extends Session {
  user: { id: string; fullName: string; isOwner: boolean; isActive: boolean };
}

/**
 * Autentikasi sebuah token (cookie). Mengembalikan sesi + profil bila valid & aktif,
 * atau null bila tidak valid/kedaluwarsa/dicabut/pengguna nonaktif.
 * Memperbarui last_seen_at (best-effort).
 */
export async function authenticate(
  token: string | undefined | null,
): Promise<AuthenticatedSession | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const rows = await adminQuery<{
    id: string;
    user_id: string;
    expires_at: Date;
    revoked_at: Date | null;
    full_name: string;
    is_owner: boolean;
    is_active: boolean;
  }>(
    `select s.id, s.user_id, s.expires_at, s.revoked_at,
            p.full_name, p.is_owner, p.is_active
       from app_session s
       join profiles p on p.id = s.user_id
      where s.token_hash = $1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at.getTime() <= Date.now()) return null;
  if (!row.is_active) return null;

  await adminQuery(`update app_session set last_seen_at = now() where id = $1`, [row.id]).catch(
    () => undefined,
  );

  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    user: {
      id: row.user_id,
      fullName: row.full_name,
      isOwner: row.is_owner,
      isActive: row.is_active,
    },
  };
}

/** Cabut satu sesi (logout). */
export async function destroySession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await adminQuery(
    `update app_session set revoked_at = now() where token_hash = $1 and revoked_at is null`,
    [hashToken(token)],
  );
}

/** Cabut semua sesi seorang pengguna (logout semua perangkat / saat ganti password). */
export async function destroyAllSessions(userId: string): Promise<void> {
  await adminQuery(
    `update app_session set revoked_at = now() where user_id = $1 and revoked_at is null`,
    [userId],
  );
}

export interface LoginResult {
  user: { id: string; fullName: string; isOwner: boolean };
  token: string;
}

/**
 * Login dengan email + password (lokal). Mengembalikan token sesi baru bila cocok,
 * atau null bila kredensial salah / pengguna nonaktif.
 * Catatan keamanan: pesan error dibuat seragam untuk mencegah user enumeration.
 */
export async function login(email: string, password: string): Promise<LoginResult | null> {
  if (!email || !password) return null;
  const rows = await adminQuery<{
    id: string;
    full_name: string;
    is_owner: boolean;
    is_active: boolean;
    password_hash: string | null;
  }>(
    `select id, full_name, is_owner, is_active, password_hash from profiles where lower(email) = lower($1)`,
    [email],
  );
  const u = rows[0];
  if (!u || !u.is_active) return null;
  const ok = await verifyPassword(password, u.password_hash);
  if (!ok) return null;
  const { token } = await createSession(u.id);
  return {
    user: { id: u.id, fullName: u.full_name, isOwner: u.is_owner },
    token,
  };
}

/** Buat sesi & kembalikan token (dipakai setelah login sukses di route). */
export async function issueSession(userId: string): Promise<string> {
  const { token } = await createSession(userId);
  return token;
}

/** Set password (hash scrypt) untuk pengguna — dipakai seed & ganti password. */
export async function setPassword(userId: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  await adminQuery(`update profiles set password_hash = $1 where id = $2`, [hash, userId]);
}
