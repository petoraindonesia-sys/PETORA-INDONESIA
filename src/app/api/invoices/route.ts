/**
 * /api/invoices — daftar & buat tagihan.
 * GET: daftar tagihan (RLS, per cabang aktor). POST: buat tagihan (RLS).
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { listInvoices, createInvoice, type CreateInvoiceInput } from "@/lib/billing/service";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") ?? undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
  const invoices = await withActor(session.userId, (tx) => listInvoices(tx, { branchId, limit }));
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  let body: CreateInvoiceInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  if (!body.branchId || !body.items || body.items.length === 0) {
    return NextResponse.json(
      { error: "branchId dan minimal satu item wajib diisi" },
      { status: 400 },
    );
  }
  if (!body.tax || typeof body.rounding !== "number") {
    return NextResponse.json({ error: "tax dan rounding wajib diisi" }, { status: 400 });
  }
  try {
    const result = await withActor(session.userId, (tx) =>
      createInvoice(tx, { ...body, actorId: session.userId }),
    );
    return NextResponse.json({ invoice: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
