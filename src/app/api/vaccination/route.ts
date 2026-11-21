/**
 * POST /api/vaccination — buat record vaksinasi baru.
 * Body: { petId, visitId?, productId, batchId?, administeredAt?, intervalDays?, notes?, status? }
 * RLS akan menolak bila user tidak punya medical.write.
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { createVaccination } from "@/lib/vaccination/service";

export async function POST(request: Request) {
  const actor = await requireActor();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const petId = body.petId as string;
  const visitId = (body.visitId as string) || null;
  const productId = body.productId as string;
  const batchId = (body.batchId as string) || null;
  const administeredAt = body.administeredAt ? new Date(body.administeredAt as string) : null;
  const intervalDays = body.intervalDays as number | null;
  const notes = body.notes as string | null;
  const status = body.status as "scheduled" | "completed" | "cancelled" | undefined;

  if (!petId || !productId) {
    return NextResponse.json({ error: "petId dan productId wajib" }, { status: 400 });
  }

  try {
    const vaccination = await createVaccination(actor.user.id, {
      petId,
      visitId,
      productId,
      batchId,
      administeredAt,
      intervalDays,
      notes,
      status,
    });
    return NextResponse.json({ vaccination }, { status: 201 });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}