/**
 * GET /api/procurement/[id] — detail PO dengan items.
 * PATCH /api/procurement/[id] — aksi: order (kirim ke supplier), receive (terima), cancel (batalkan), update (hanya draft).
 * Body untuk update: { supplierId?, expectedAt?, notes?, items? }
 * Body untuk receive: { action: "receive", itemReceipts: [{itemId, quantity, batchCode?, expiresAt?}], notes? }
 * Body untuk order: { action: "order" }
 * Body untuk cancel: { action: "cancel" }
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { getPO, updatePO, orderPO, receivePO, cancelPO } from "@/lib/procurement/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requireActor();
  const { id } = await params;
  try {
    const po = await getPO(actor.user.id, id);
    if (!po) {
      return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ purchaseOrder: po });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requireActor();
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const action = body.action as "order" | "receive" | "cancel" | "update" | undefined;

  try {
    let po;
    if (action === "order") {
      po = await orderPO(actor.user.id, id);
    } else if (action === "receive") {
      const itemReceipts = body.itemReceipts as { itemId: string; quantity: number; batchCode?: string; expiresAt?: string | null }[];
      const notes = body.notes as string | null;
      if (!itemReceipts || itemReceipts.length === 0) {
        return NextResponse.json({ error: "itemReceipts wajib untuk receive" }, { status: 400 });
      }
      po = await receivePO(actor.user.id, { poId: id, itemReceipts, notes });
    } else if (action === "cancel") {
      await cancelPO(actor.user.id, id);
      return NextResponse.json({ ok: true });
    } else if (action === "update") {
      const supplierId = body.supplierId as string | undefined;
      const expectedAt = body.expectedAt ? new Date(body.expectedAt as string) : undefined;
      const notes = body.notes as string | null | undefined;
      const items = body.items as { productId: string; quantity: number; costPrice: number; notes?: string | null }[] | undefined;
      po = await updatePO(actor.user.id, id, { supplierId, expectedAt, notes, items });
    } else {
      return NextResponse.json({ error: "Action harus order, receive, cancel, atau update" }, { status: 400 });
    }
    return NextResponse.json({ purchaseOrder: po });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}