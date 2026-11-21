/**
 * GET /api/procurement — daftar PO (filter branchId, status).
 * POST /api/procurement — buat PO baru (draft).
 * Body: { supplierId, branchId, items: [{productId, quantity, costPrice, notes?}], notes?, expectedAt? }
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { createPO, listPOs } from "@/lib/procurement/service";

export async function GET(request: Request) {
  const actor = await requireActor();
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    const pos = await listPOs(actor.user.id, { branchId, status });
    return NextResponse.json({ purchaseOrders: pos });
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
  const supplierId = body.supplierId as string;
  const branchId = body.branchId as string;
  const items = body.items as { productId: string; quantity: number; costPrice: number; notes?: string | null }[];
  const notes = body.notes as string | null;
  const expectedAt = body.expectedAt ? new Date(body.expectedAt as string) : null;

  if (!supplierId || !branchId || !items || items.length === 0) {
    return NextResponse.json({ error: "supplierId, branchId, items wajib" }, { status: 400 });
  }

  try {
    const po = await createPO(actor.user.id, {
      supplierId,
      branchId,
      items,
      notes,
      expectedAt,
    });
    return NextResponse.json({ purchaseOrder: po }, { status: 201 });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}