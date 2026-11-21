/**
 * POST /api/portal/auth/logout — logout portal.
 * Hapus cookie & cabut sesi.
 */
import { NextResponse } from "next/server";
import { endPortalSession } from "@/lib/auth/portal-session";

export async function POST() {
  await endPortalSession();
  return NextResponse.json({ ok: true });
}