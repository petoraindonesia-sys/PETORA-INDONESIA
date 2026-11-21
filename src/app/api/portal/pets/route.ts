/**
 * GET /api/portal/pets — daftar hewan milik customer portal user.
 * Read-only per BR-019.
 */
import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/auth/portal-session";
import { adminQuery } from "@/lib/db";

export async function GET() {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  const rows = await adminQuery(
    `select id, customer_id, name, species, breed, birth_date, weight_kg, color, microchip, is_active, created_at
       from pet
      where customer_id = $1
      order by created_at desc`,
    [session.user.customerId],
  );
  return NextResponse.json({ pets: rows });
}