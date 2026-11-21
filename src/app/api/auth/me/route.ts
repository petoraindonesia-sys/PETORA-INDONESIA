/**
 * GET /api/auth/me — profil sesi saat ini (untuk UI). 401 bila belum login.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  return NextResponse.json({ user: session.user, expiresAt: session.expiresAt });
}
