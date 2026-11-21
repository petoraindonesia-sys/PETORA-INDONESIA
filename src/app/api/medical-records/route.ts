/**
 * /api/medical-records — daftar per pasien & buat draft.
 * GET: ?petId=... (RLS: hanya pemegang medical.read). POST: buat draft (medical.write).
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { listMedicalRecordsByPet, createMedicalDraft } from "@/lib/medical/service";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("petId");
  if (!petId) {
    return NextResponse.json({ error: "petId wajib diisi" }, { status: 400 });
  }
  const records = await withActor(session.userId, (tx) => listMedicalRecordsByPet(tx, petId));
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  let body: {
    branchId?: string;
    petId?: string;
    visitId?: string | null;
    anamnesis?: string;
    examination?: string;
    diagnosis?: string;
    treatment?: string;
    prescription?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  if (!body.branchId || !body.petId) {
    return NextResponse.json({ error: "branchId dan petId wajib diisi" }, { status: 400 });
  }
  try {
    const record = await withActor(session.userId, (tx) =>
      createMedicalDraft(tx, {
        branchId: body.branchId!,
        petId: body.petId!,
        visitId: body.visitId ?? null,
        actorId: session.userId,
        anamnesis: body.anamnesis ?? null,
        examination: body.examination ?? null,
        diagnosis: body.diagnosis ?? null,
        treatment: body.treatment ?? null,
        prescription: body.prescription ?? null,
      }),
    );
    return NextResponse.json({ record }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
