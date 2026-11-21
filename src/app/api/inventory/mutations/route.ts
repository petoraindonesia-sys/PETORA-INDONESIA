/**
 * /api/inventory/mutations — riwayat mutasi stok.
 * GET: ?branchId=...&productId=...&limit=...
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { listBranches } from "@/lib/branches/service";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const productId = searchParams.get("productId") ?? undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

  if (!branchId) {
    return NextResponse.json({ error: "branchId wajib diisi" }, { status: 400 });
  }

  try {
    const branches = await withActor(session.userId, (tx) => listBranches(tx));
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) {
      return NextResponse.json({ error: "Cabang tidak ditemukan atau akses ditolak" }, { status: 403 });
    }

    const mutations = await withActor(session.userId, (tx) =>
      tx.query<{
        id: string;
        branch_id: string;
        product_id: string;
        batch_id: string | null;
        delta: number;
        kind: string;
        reason: string | null;
        ref: string | null;
        created_by: string;
        created_at: Date;
      }>(
        `select m.id, m.branch_id, m.product_id, m.batch_id, m.delta, m.kind, m.reason, m.ref, m.created_by, m.created_at
         from stock_mutation m
         where m.branch_id = $1
         ${productId ? "and m.product_id = $2" : ""}
         order by m.created_at desc
         limit $${productId ? 3 : 2}`,
        productId ? [branchId, productId, limit] : [branchId, limit],
      ),
    );

    return NextResponse.json({ mutations: mutations.rows });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}