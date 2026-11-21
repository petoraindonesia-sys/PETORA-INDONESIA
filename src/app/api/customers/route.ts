/**
 * /api/customers — daftar & buat pelanggan.
 * GET: daftar pelanggan (RLS). POST: buat pelanggan.
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { listCustomers, createCustomer } from "@/lib/customer/service";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const customers = await withActor(session.userId, (tx) => listCustomers(tx, { search, limit }));
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  let body: { fullName?: string; phone?: string; email?: string; address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  if (!body.fullName || !body.fullName.trim()) {
    return NextResponse.json({ error: "Nama pelanggan wajib diisi" }, { status: 400 });
  }
  try {
    const customer = await withActor(session.userId, (tx) =>
      createCustomer(tx, {
        fullName: body.fullName!,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
        actorId: session.userId,
      }),
    );
    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
