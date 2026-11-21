/**
 * GET /api/portal/invoices — tagihan milik customer/hewan portal user.
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
    `select i.id, i.invoice_no, i.customer_id, i.pet_id, i.visit_id, i.status, i.subtotal,
            i.discount, i.tax, i.rounding, i.total, i.paid, i.due_date, i.notes, i.created_at, i.updated_at,
            c.name as customer_name, p.name as pet_name, v.code as visit_code
       from invoice i
       join customer c on c.id = i.customer_id
       left join pet p on p.id = i.pet_id
       left join visit v on v.id = i.visit_id
      where i.customer_id = $1
         or i.pet_id in (select id from pet where customer_id = $1)
      order by i.created_at desc`,
    [session.user.customerId],
  );
  return NextResponse.json({ invoices: rows });
}