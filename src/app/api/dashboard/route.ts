/**
 * /api/dashboard — ringkasan operasional harian.
 * GET: ringkasan per cabang yang terlihat aktor (RLS).
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { getDashboard } from "@/lib/dashboard/service";

export async function GET() {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const dashboard = await withActor(session.userId, (tx) => getDashboard(tx));
  return NextResponse.json({ dashboard });
}
