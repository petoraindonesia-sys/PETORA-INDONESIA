/**
 * /api/visits — daftar kunjungan per cabang & buat kunjungan.
 * GET: ?branchId=... (RLS membatasi cabang aktor). POST: buat kunjungan.
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { listVisits, createVisit } from "@/lib/visits/service";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  if (!branchId) {
    return NextResponse.json({ error: "branchId wajib diisi" }, { status: 400 });
  }
  const visits = await withActor(session.userId, (tx) => listVisits(tx, { branchId }));
  return NextResponse.json({ visits });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  let body: { branchId?: string; customerId?: string; petId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  if (!body.branchId || !body.customerId || !body.petId) {
    return NextResponse.json(
      { error: "branchId, customerId, dan petId wajib diisi" },
      { status: 400 },
    );
  }
  try {
    const visit = await withActor(session.userId, (tx) =>
      createVisit(tx, {
        branchId: body.branchId!,
        customerId: body.customerId!,
        petId: body.petId!,
        actorId: session.userId,
      }),
    );
    return NextResponse.json({ visit }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
