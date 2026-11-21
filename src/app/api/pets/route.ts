/**
 * /api/pets — daftar hewan per pelanggan & buat hewan.
 * GET: ?customerId=... daftar hewan milik pelanggan (RLS). POST: buat hewan.
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { listPetsByCustomer, createPet } from "@/lib/pet/service";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId wajib diisi" }, { status: 400 });
  }
  const pets = await withActor(session.userId, (tx) => listPetsByCustomer(tx, customerId));
  return NextResponse.json({ pets });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  let body: {
    customerId?: string;
    name?: string;
    species?: string;
    breed?: string;
    sex?: "male" | "female" | "unknown";
    birthDate?: string;
    weightGrams?: number;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  if (!body.customerId || !body.name || !body.species) {
    return NextResponse.json(
      { error: "customerId, name, dan species wajib diisi" },
      { status: 400 },
    );
  }
  try {
    const pet = await withActor(session.userId, (tx) =>
      createPet(tx, {
        customerId: body.customerId!,
        name: body.name!,
        species: body.species!,
        breed: body.breed ?? null,
        sex: body.sex ?? "unknown",
        birthDate: body.birthDate ?? null,
        weightGrams: body.weightGrams ?? null,
        notes: body.notes ?? null,
        actorId: session.userId,
      }),
    );
    return NextResponse.json({ pet }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
