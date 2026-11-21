/**
 * /api/invoices/[id] — detail tagihan (item + pembayaran). RLS membatasi per cabang.
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { getInvoice } from "@/lib/billing/service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  const invoice = await withActor(session.userId, (tx) => getInvoice(tx, id));
  if (!invoice) {
    return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ invoice });
}
