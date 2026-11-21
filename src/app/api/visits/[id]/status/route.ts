/**
 * /api/visits/[id]/status — ubah status kunjungan (transisi divalidasi).
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { updateVisitStatus, type VisitStatus } from "@/lib/visits/service";

const VALID: VisitStatus[] = ["terdaftar", "menunggu", "diperiksa", "selesai", "dibatalkan"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  if (!body.status || !VALID.includes(body.status as VisitStatus)) {
    return NextResponse.json({ error: `status tidak valid: ${VALID.join(", ")}` }, { status: 400 });
  }
  try {
    const visit = await withActor(session.userId, (tx) =>
      updateVisitStatus(tx, id, { status: body.status as VisitStatus }),
    );
    if (!visit) {
      return NextResponse.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ visit });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
