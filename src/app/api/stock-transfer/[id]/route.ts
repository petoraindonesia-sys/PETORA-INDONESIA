/**
 * GET /api/stock-transfer/[id] — detail transfer.
 * PATCH /api/stock-transfer/[id] — aksi: send (kirim), receive (terima), cancel (batalkan).
 * Body: { action: "send" | "receive" | "cancel", receivedQuantity?, discrepancyNotes? }
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { getTransfer, sendTransfer, receiveTransfer, cancelTransfer } from "@/lib/stock_transfer/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requireActor();
  const { id } = await params;
  try {
    const transfer = await getTransfer(actor.user.id, id);
    if (!transfer) {
      return NextResponse.json({ error: "Transfer tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ transfer });
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
  let body: { action?: "send" | "receive" | "cancel"; receivedQuantity?: number; discrepancyNotes?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  try {
    let transfer;
    if (body.action === "send") {
      transfer = await sendTransfer(actor.user.id, id);
    } else if (body.action === "receive") {
      if (body.receivedQuantity === undefined) {
        return NextResponse.json({ error: "receivedQuantity wajib untuk receive" }, { status: 400 });
      }
      transfer = await receiveTransfer(actor.user.id, id, body.receivedQuantity, body.discrepancyNotes ?? null);
    } else if (body.action === "cancel") {
      await cancelTransfer(actor.user.id, id);
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ error: "Action harus send, receive, atau cancel" }, { status: 400 });
    }
    return NextResponse.json({ transfer });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}