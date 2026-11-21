/**
 * GET /api/products — daftar produk (filter type=vaccine untuk vaksinasi).
 * Query: type (vaccine|medicine|supply|all), limit, branchId (untuk stok)
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { withActor } from "@/lib/db";

export async function GET(request: Request) {
  const actor = await requireActor();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";
  const limit = parseInt(searchParams.get("limit") || "200", 10);

  try {
    const products = await withActor(actor.user.id, async (tx) => {
      let sql = `select id, sku, name, type, unit, price, taxable, vaccine_interval_days, is_active
                 from product
                 where is_active = true`;
      const params: unknown[] = [];

      if (type !== "all") {
        sql += ` and type = $1`;
        params.push(type);
      }

      sql += ` order by name asc limit $${params.length + 1}`;
      params.push(limit);

      const res = await tx.query(sql, params);
      return res.rows;
    });
    return NextResponse.json({ products });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}