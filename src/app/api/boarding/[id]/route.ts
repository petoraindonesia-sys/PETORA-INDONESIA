/**
 * GET /api/boarding/[id] — detail boarding.
 * PATCH /api/boarding/[id] — check-out (action=checkout) atau cancel (action=cancel).
 * Body: { action: "checkout" | "cancel" }
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { getBoarding, checkOutBoarding, cancelBoarding } from "@/lib/boarding/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requireActor();
  const { id } = await params;
  try {
    const boarding = await getBoarding(actor.user.id, id);
    if (!boarding) {
      return NextResponse.json({ error: "Boarding tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ boarding });
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
  let body: { action?: "checkout" | "cancel" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  try {
    let boarding;
    if (body.action === "checkout") {
      boarding = await checkOutBoarding(actor.user.id, id);
    } else if (body.action === "cancel") {
      await cancelBoarding(actor.user.id, id);
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ error: "Action harus checkout atau cancel" }, { status: 400 });
    }
    return NextResponse.json({ boarding });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}