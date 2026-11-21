/**
 * GET /api/vaccination/[id] — detail vaksinasi.
 * PATCH /api/vaccination/[id] — update (administeredAt, intervalDays, notes, status).
 * DELETE /api/vaccination/[id] — cancel (status = cancelled).
 * RLS akan menolak bila user tidak punya medical.write untuk PATCH/DELETE.
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { getVaccination, updateVaccination, cancelVaccination } from "@/lib/vaccination/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requireActor();
  const { id } = await params;
  try {
    const vaccination = await getVaccination(actor.user.id, id);
    if (!vaccination) {
      return NextResponse.json({ error: "Vaksinasi tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ vaccination });
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
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const administeredAt = body.administeredAt ? new Date(body.administeredAt as string) : undefined;
  const intervalDays = body.intervalDays as number | null | undefined;
  const notes = body.notes as string | null | undefined;
  const status = body.status as "scheduled" | "completed" | "cancelled" | undefined;

  try {
    const vaccination = await updateVaccination(actor.user.id, id, {
      administeredAt,
      intervalDays,
      notes,
      status,
    });
    return NextResponse.json({ vaccination });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requireActor();
  const { id } = await params;
  try {
    await cancelVaccination(actor.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}