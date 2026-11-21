/**
 * GET /api/portal/medical — riwayat medis hewan milik customer portal user.
 * Hanya record status='final' DAN shared=true (BR-005, BR-019).
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
    `select mr.id, mr.pet_id, mr.visit_id, mr.status, mr.subjective, mr.objective, mr.assessment, mr.plan,
            mr.next_vaccine_due, mr.shared, mr.created_at, mr.updated_at,
            v.code as visit_code, v.branch_id, v.started_at
       from medical_record mr
       join visit v on v.id = mr.visit_id
       join pet p on p.id = mr.pet_id
      where p.customer_id = $1
        and mr.status = 'final'
        and mr.shared = true
      order by mr.created_at desc`,
    [session.user.customerId],
  );
  return NextResponse.json({ records: rows });
}