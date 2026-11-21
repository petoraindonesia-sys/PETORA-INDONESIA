/**
 * GET /api/stock-transfer — daftar transfer (filter fromBranchId, toBranchId, status).
 * POST /api/stock-transfer — buat transfer baru (draft).
 * Body: { fromBranchId, toBranchId, productId, batchId?, quantity, notes? }
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { createTransfer, listTransfers } from "@/lib/stock_transfer/service";

export async function GET(request: Request) {
  const actor = await requireActor();
  const { searchParams } = new URL(request.url);
  const fromBranchId = searchParams.get("fromBranchId") || undefined;
  const toBranchId = searchParams.get("toBranchId") || undefined;
  const status = searchParams.get("status") as "draft" | "sent" | "received" | "cancelled" | null;

  try {
    const transfers = await listTransfers(actor.user.id, { fromBranchId, toBranchId, status: status ?? undefined });
    return NextResponse.json({ transfers });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const actor = await requireActor();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const fromBranchId = body.fromBranchId as string;
  const toBranchId = body.toBranchId as string;
  const productId = body.productId as string;
  const batchId = (body.batchId as string) || null;
  const quantity = body.quantity as number;
  const notes = body.notes as string | null;

  if (!fromBranchId || !toBranchId || !productId || quantity === undefined) {
    return NextResponse.json({ error: "fromBranchId, toBranchId, productId, quantity wajib" }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "Quantity harus bulat positif" }, { status: 400 });
  }

  try {
    const transfer = await createTransfer(actor.user.id, {
      fromBranchId,
      toBranchId,
      productId,
      batchId,
      quantity,
      notes,
    });
    return NextResponse.json({ transfer }, { status: 201 });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}