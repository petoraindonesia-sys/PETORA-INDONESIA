/**
 * /api/invoices/[id]/payments — catat pembayaran (BR-010/018).
 * Idempoten via idempotencyKey (dikirim klien; bila tidak ada, server membuat UUID).
 */
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { recordPayment, type RecordPaymentInput } from "@/lib/billing/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  let body: Omit<RecordPaymentInput, "invoiceId" | "actorId" | "idempotencyKey"> & {
    idempotencyKey?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  if (!body.method || !body.amount) {
    return NextResponse.json({ error: "method dan amount wajib diisi" }, { status: 400 });
  }
  try {
    const result = await withActor(session.userId, (tx) =>
      recordPayment(tx, {
        invoiceId: id,
        method: body.method,
        amount: body.amount,
        cashReceived: body.cashReceived,
        reference: body.reference,
        idempotencyKey: body.idempotencyKey ?? randomUUID(),
        actorId: session.userId,
      }),
    );
    return NextResponse.json({ payment: result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
