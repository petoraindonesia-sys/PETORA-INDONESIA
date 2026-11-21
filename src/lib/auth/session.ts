/**
 * Helper sesi untuk Route Handler Next.js (App Router).
 *
 * `getSession()` membaca cookie & memvalidasi. `requireActor()` melempar bila tidak
 * ada sesi valid (dipakai route yang wajib login). `withActor` di lapisan db
 * (`src/lib/db`) tetap dipakai untuk menjalankan operasi sebagai aktor (RLS).
 */
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  authenticate,
  createSession,
  destroySession,
  type AuthenticatedSession,
} from "./service";

/** Baca & validasi sesi dari cookie. Mengembalikan null bila tidak ada/tidak valid. */
export async function getSession(): Promise<AuthenticatedSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return authenticate(token);
}

/** Pastikan ada sesi valid; lempar Error bila tidak (untuk route terproteksi). */
export async function requireActor(): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/** Buat sesi baru & set cookie HttpOnly. Mengembalikan token (untuk klien yang perlu). */
export async function startSession(userId: string): Promise<void> {
  const store = await cookies();
  const { token } = await createSession(userId);
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** Hapus sesi saat ini (logout) & hapus cookie. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  await destroySession(token);
  store.delete(SESSION_COOKIE);
}
