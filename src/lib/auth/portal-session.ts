/**
 * Helper sesi untuk Portal (Next.js App Router).
 *
 * Menggunakan cookie terpisah `petora_portal_session` dari staff auth.
 */
import { cookies } from "next/headers";
import {
  PORTAL_SESSION_COOKIE,
  authenticatePortal,
  createPortalSession,
  destroyPortalSession,
  type AuthenticatedPortalSession,
} from "./portal";

/** Baca & validasi sesi portal dari cookie. */
export async function getPortalSession(): Promise<AuthenticatedPortalSession | null> {
  const store = await cookies();
  const token = store.get(PORTAL_SESSION_COOKIE)?.value;
  return authenticatePortal(token);
}

/** Pastikan ada sesi portal valid; lempar Error bila tidak. */
export async function requirePortalActor(): Promise<AuthenticatedPortalSession> {
  const session = await getPortalSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/** Buat sesi portal baru & set cookie HttpOnly. */
export async function startPortalSession(userId: string): Promise<void> {
  const store = await cookies();
  const { token } = await createPortalSession(userId);
  store.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Hapus sesi portal saat ini (logout) & hapus cookie. */
export async function endPortalSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(PORTAL_SESSION_COOKIE)?.value;
  await destroyPortalSession(token);
  store.delete(PORTAL_SESSION_COOKIE);
}