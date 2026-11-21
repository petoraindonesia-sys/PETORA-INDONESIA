/**
 * /api/inventory/adjust — penyesuaian stok (Supervisor) — BR-006.
 * POST: delta positif/negatif, wajib alasan.
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { adjustStock } from "@/lib/inventory/service";

export async function POST(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }

  let body: { branchId?: string; productId?: string; delta?: number; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  if (!body.branchId || !body.productId || !body.delta || !body.reason?.trim()) {
    return NextResponse.json({ error: "branchId, productId, delta, reason wajib diisi" }, { status: 400 });
  }

  try {
    await withActor(session.userId, (tx) =>
      adjustStock(tx, {
        branchId: body.branchId!,
        productId: body.productId!,
        delta: body.delta!,
        reason: body.reason!,
        actorId: session.userId,
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}