/**
 * /api/inventory — daftar stok per cabang & produk.
 * GET: ?branchId=... — stok agregat per produk (RLS batasi cabang).
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { listBranches } from "@/lib/branches/service";
import { getStock } from "@/lib/inventory/service";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");

  if (!branchId) {
    return NextResponse.json({ error: "branchId wajib diisi" }, { status: 400 });
  }

  try {
    // Verify user has access to this branch via branches service (RLS)
    const branches = await withActor(session.userId, (tx) => listBranches(tx));
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) {
      return NextResponse.json({ error: "Cabang tidak ditemukan atau akses ditolak" }, { status: 403 });
    }

    const products = await withActor(session.userId, (tx) => {
      // Get all products with stock for this branch
      return tx.query<{
        id: string;
        sku: string;
        name: string;
        kind: string;
        price: number;
        taxable: boolean;
      }>(
        `select p.id, p.sku, p.name, p.kind, p.price, p.taxable
         from product p
         where p.kind in ('product', 'medicine')
         order by p.name`,
      );
    });

    // Get stock for each product
    const stockData = await Promise.all(
      products.rows.map(async (p) => {
        const stock = await withActor(session.userId, (tx) => getStock(tx, branchId, p.id));
        return { product: p, stock };
      }),
    );

    return NextResponse.json({ branch: { id: branch.id, name: branch.name }, products: stockData });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}