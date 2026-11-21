/**
 * /api/branches — daftar & buat cabang.
 * GET: daftar cabang yang terlihat aktor (RLS). POST: buat cabang (Owner, via RLS).
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { listBranches, createBranch } from "@/lib/branches/service";

export async function GET() {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const branches = await withActor(session.userId, (tx) => listBranches(tx));
  return NextResponse.json({ branches });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  let body: { companyId?: string; name?: string; address?: string; timezone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  if (!body.companyId || !body.name || !body.timezone) {
    return NextResponse.json(
      { error: "companyId, name, dan timezone wajib diisi" },
      { status: 400 },
    );
  }
  try {
    const branch = await withActor(session.userId, (tx) =>
      createBranch(tx, {
        companyId: body.companyId!,
        name: body.name!,
        address: body.address ?? null,
        timezone: body.timezone!,
        actorId: session.userId,
      }),
    );
    return NextResponse.json({ branch }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
