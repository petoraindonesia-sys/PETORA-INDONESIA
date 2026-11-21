/**
 * POST /api/auth/logout — cabut sesi saat ini & hapus cookie.
 */
import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth/session";

export async function POST() {
  await endSession();
  return NextResponse.json({ ok: true });
}
