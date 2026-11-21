/**
 * /api/medical-records/[id] — ubah draft & finalisasi.
 * PATCH: ubah field draft (RLS: hanya draft milik sendiri). POST: finalisasi draft.
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import {
  updateMedicalDraft,
  finalizeMedical,
  getMedicalRecord,
  type UpdateMedicalDraftInput,
} from "@/lib/medical/service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  const record = await withActor(session.userId, (tx) => getMedicalRecord(tx, id));
  if (!record) {
    return NextResponse.json({ error: "Rekam medis tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ record });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  let body: UpdateMedicalDraftInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  try {
    const record = await withActor(session.userId, (tx) => updateMedicalDraft(tx, id, body));
    if (!record) {
      return NextResponse.json(
        { error: "Tidak dapat mengubah: entri tidak ditemukan atau sudah final" },
        { status: 404 },
      );
    }
    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const record = await withActor(session.userId, (tx) => finalizeMedical(tx, id));
    if (!record) {
      return NextResponse.json(
        { error: "Tidak dapat finalisasi: entri tidak ditemukan" },
        { status: 404 },
      );
    }
    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
