/**
 * /api/branches/[id] — ubah / nonaktifkan cabang.
 * PATCH: ubah field (Owner, via RLS). DELETE: nonaktifkan (soft).
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { updateBranch, deactivateBranch } from "@/lib/branches/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  let body: { name?: string; address?: string | null; timezone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  try {
    const branch = await withActor(session.userId, (tx) =>
      updateBranch(tx, id, {
        name: body.name,
        address: body.address,
        timezone: body.timezone,
      }),
    );
    if (!branch) {
      return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ branch });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  const branch = await withActor(session.userId, (tx) => deactivateBranch(tx, id));
  if (!branch) {
    return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ branch });
}
