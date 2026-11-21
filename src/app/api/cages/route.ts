/**
 * GET /api/cages — daftar kandang per cabang.
 * POST /api/cages — buat/update kandang (Owner/Supervisor).
 * Body: { branchId, code, name?, size?, ratePerDay, isActive? }
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { listCages, upsertCage } from "@/lib/boarding/service";

export async function GET(request: Request) {
  const actor = await requireActor();
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");

  if (!branchId) {
    return NextResponse.json({ error: "branchId wajib" }, { status: 400 });
  }

  try {
    const cages = await listCages(actor.user.id, branchId);
    return NextResponse.json({ cages });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const actor = await requireActor();
  // Cek apakah Owner (bisa juga cek permission cage.write)
  if (!actor.user.isOwner) {
    return NextResponse.json({ error: "Hanya Owner yang bisa kelola kandang" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const branchId = body.branchId as string;
  const code = body.code as string;
  const name = body.name as string | null;
  const size = body.size as string | null;
  const ratePerDay = body.ratePerDay as number;
  const isActive = body.isActive as boolean | undefined;

  if (!branchId || !code || ratePerDay === undefined) {
    return NextResponse.json({ error: "branchId, code, ratePerDay wajib" }, { status: 400 });
  }

  try {
    const cage = await upsertCage(actor.user.id, {
      branchId,
      code,
      name,
      size,
      ratePerDay,
      isActive,
    });
    return NextResponse.json({ cage }, { status: 201 });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}