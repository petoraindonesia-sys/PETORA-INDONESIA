/**
 * GET /api/portal/auth/me — info sesi portal saat ini.
 */
import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/auth/portal-session";

export async function GET() {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  return NextResponse.json({
    user: session.user,
    expiresAt: session.expiresAt,
  });
}