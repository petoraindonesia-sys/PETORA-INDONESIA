/**
 * GET /api/boarding — daftar boarding (filter petId, status=active, branchId).
 * POST /api/boarding — check-in hewan baru.
 * Body: { petId, visitId?, cageId?, branchId, cageRatePerDay?, notes? }
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { checkInBoarding, listActiveBoarding, listBoardingByPet } from "@/lib/boarding/service";

export async function GET(request: Request) {
  const actor = await requireActor();
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("petId");
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId");

  try {
    let result;
    if (petId) {
      result = await listBoardingByPet(actor.user.id, petId);
    } else if (status === "active") {
      result = await listActiveBoarding(actor.user.id, branchId ?? undefined);
    } else {
      return NextResponse.json({ error: "petId atau status=active wajib" }, { status: 400 });
    }
    return NextResponse.json({ boarding: result });
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
  const petId = body.petId as string;
  const visitId = (body.visitId as string) || null;
  const cageId = (body.cageId as string) || null;
  const branchId = body.branchId as string;
  const cageRatePerDay = body.cageRatePerDay as number | null;
  const notes = body.notes as string | null;

  if (!petId || !branchId) {
    return NextResponse.json({ error: "petId dan branchId wajib" }, { status: 400 });
  }

  try {
    const boarding = await checkInBoarding(actor.user.id, {
      petId,
      visitId,
      cageId,
      branchId,
      cageRatePerDay: cageRatePerDay ?? undefined,
      notes,
    });
    return NextResponse.json({ boarding }, { status: 201 });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}