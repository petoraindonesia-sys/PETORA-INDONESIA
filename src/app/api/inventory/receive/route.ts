/**
 * /api/inventory/receive — terima stok (pengadaan) — BR-006.
 * POST: buat batch baru & catat mutasi receipt.
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { receiveStock, type ReceiveStockInput } from "@/lib/inventory/service";

export async function POST(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }

  let body: ReceiveStockInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  if (!body.branchId || !body.productId || !body.quantity || !body.costPrice) {
    return NextResponse.json({ error: "branchId, productId, quantity, costPrice wajib diisi" }, { status: 400 });
  }

  try {
    const batchId = await withActor(session.userId, (tx) =>
      receiveStock(tx, { ...body, actorId: session.userId }),
    );
    return NextResponse.json({ batchId }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}