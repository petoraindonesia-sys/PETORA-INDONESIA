/**
 * /api/customers/[id] — detail & ubah pelanggan.
 * GET: satu pelanggan. PATCH: ubah field yang diberikan.
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { getCustomer, updateCustomer, type UpdateCustomerInput } from "@/lib/customer/service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  const customer = await withActor(session.userId, (tx) => getCustomer(tx, id));
  if (!customer) {
    return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ customer });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { id } = await params;
  let body: UpdateCustomerInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  try {
    const customer = await withActor(session.userId, (tx) => updateCustomer(tx, id, body));
    if (!customer) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ customer });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
