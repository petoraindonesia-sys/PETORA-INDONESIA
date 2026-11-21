/**
 * Tes integrasi autentikasi lokal (sesi + password) — tanpa Supabase.
 * Membuktikan: login benar/salah, token hanya hash di DB, sesi valid vs dicabut vs
 * kedaluwarsa, dan RLS tetap berjalan memakai sesi (withActor).
 */
import { describe, it, expect } from "vitest";
import { adminQuery } from "@/lib/db";
import {
  login,
  createSession,
  authenticate,
  destroySession,
  destroyAllSessions,
  hashToken,
  hashPassword,
  verifyPassword,
  issueSession,
} from "@/lib/auth/service";
import { CREDENTIALS, USER } from "./fixtures";

describe("Auth - password", () => {
  it("hash & verifikasi password", async () => {
    const hash = await hashPassword("rahasia123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("rahasia123", hash)).toBe(true);
    expect(await verifyPassword("salah", hash)).toBe(false);
  });

  it("verifyPassword menangani hash null/rusak", async () => {
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", "bukan-hash")).toBe(false);
  });
});

describe("Auth - login", () => {
  it("login dengan email+password benar menghasilkan sesi", async () => {
    const result = await login(CREDENTIALS.OWNER_EMAIL, CREDENTIALS.PASSWORD);
    expect(result).not.toBeNull();
    expect(result!.user.isOwner).toBe(true);
    expect(result!.token).toBeTruthy();
  });

  it("login dengan password salah ditolak", async () => {
    const result = await login(CREDENTIALS.OWNER_EMAIL, CREDENTIALS.WRONG_PASSWORD);
    expect(result).toBeNull();
  });

  it("login email tidak dikenal ditolak", async () => {
    const result = await login("tidak.ada@petora.test", CREDENTIALS.PASSWORD);
    expect(result).toBeNull();
  });

  it("login case-insensitive pada email", async () => {
    const result = await login(CREDENTIALS.OWNER_EMAIL.toUpperCase(), CREDENTIALS.PASSWORD);
    expect(result).not.toBeNull();
  });
});

describe("Auth - sesi (hash, validasi, pencabutan)", () => {
  it("token sesi tidak disimpan mentah di DB (hanya hash)", async () => {
    const { token } = await createSession(USER.STAFF_A);
    const rows = await adminQuery<{ token_hash: string }>(
      `select token_hash from app_session where token_hash = $1`,
      [hashToken(token)],
    );
    expect(rows.length).toBe(1);
    // Token mentah tidak muncul di DB.
    const raw = await adminQuery<{ c: string }>(
      `select count(*)::text as c from app_session where token_hash = $1`,
      [token],
    );
    expect(Number(raw[0].c)).toBe(0);
  });

  it("authenticate menerima token valid", async () => {
    const { token } = await createSession(USER.OWNER);
    const session = await authenticate(token);
    expect(session).not.toBeNull();
    expect(session!.userId).toBe(USER.OWNER);
    expect(session!.user.isOwner).toBe(true);
  });

  it("authenticate menolak token acak/tidak dikenal", async () => {
    expect(await authenticate("token-acak")).toBeNull();
    expect(await authenticate(undefined)).toBeNull();
  });

  it("sesi yang dicabut (logout) tidak lagi valid", async () => {
    const { token } = await createSession(USER.STAFF_A);
    expect(await authenticate(token)).not.toBeNull();
    await destroySession(token);
    expect(await authenticate(token)).toBeNull();
  });

  it("sesi kedaluwarsa tidak valid", async () => {
    // Buat sesi dengan TTL negatif (sudah kedaluwarsa).
    const { token } = await createSession(USER.STAFF_A, -10);
    expect(await authenticate(token)).toBeNull();
  });

  it("destroyAllSessions mencabut semua sesi pengguna", async () => {
    const s1 = await createSession(USER.VET_A);
    const s2 = await createSession(USER.VET_A);
    await destroyAllSessions(USER.VET_A);
    expect(await authenticate(s1.token)).toBeNull();
    expect(await authenticate(s2.token)).toBeNull();
  });
});

describe("Auth - sesi menggerakkan RLS", () => {
  it("withActor sebagai pemilik sesi melihat data perusahaan", async () => {
    const { token } = await createSession(USER.OWNER);
    const session = await authenticate(token);
    expect(session).not.toBeNull();
    // Operator RLS memakai userId dari sesi.
    const { withActor } = await import("@/lib/db");
    const rows = await withActor(session!.userId, async (tx) => {
      const r = await tx.query(`select id from company`);
      return r.rows;
    });
    expect(rows.length).toBe(1);
  });

  it("issueSession membuat token yang dikenali", async () => {
    const token = await issueSession(USER.STAFF_A);
    expect(await authenticate(token)).not.toBeNull();
  });
});
