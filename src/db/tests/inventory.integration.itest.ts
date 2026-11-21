/**
 * Tes integrasi inventori (BR-006, BR-007) terhadap Postgres nyata.
 * Termasuk risiko brief: dua transaksi bersamaan tidak boleh membuat stok minus.
 */
import { describe, it, expect } from "vitest";
import { withActor, adminQuery, getPool } from "@/lib/db";
import { receiveStock, deductStockFefo, getStock, adjustStock } from "@/lib/inventory/service";
import { USER, BRANCH } from "./fixtures";

const PRODUCT = "50000000-0000-4000-8000-000000000003"; // Obat Antipiretik

async function freshStock(opts: {
  batches: { qty: number; expiresAt: string | null }[];
  branchId?: string;
  productId?: string;
}) {
  const branchId = opts.branchId ?? BRANCH.B1;
  const productId = opts.productId ?? PRODUCT;
  await adminQuery(`delete from stock_mutation where branch_id=$1 and product_id=$2`, [
    branchId,
    productId,
  ]);
  await adminQuery(`delete from stock_batch where branch_id=$1 and product_id=$2`, [
    branchId,
    productId,
  ]);
  return withActor(USER.SUPERVISOR_A, async (tx) => {
    const ids: string[] = [];
    for (const b of opts.batches) {
      const r = await receiveStock(tx, {
        branchId,
        productId,
        quantity: b.qty,
        costPrice: 1000,
        expiresAt: b.expiresAt,
        actorId: USER.SUPERVISOR_A,
      });
      ids.push(r);
    }
    return { branchId, productId, batchIds: ids };
  });
}

describe("Inventori - terima stok & FEFO (BR-007)", () => {
  it("mengurangi batch paling cepat kedaluwarsa lebih dulu", async () => {
    const { productId } = await freshStock({
      batches: [
        { qty: 10, expiresAt: "2027-01-01" },
        { qty: 5, expiresAt: "2026-12-01" },
      ],
    });
    const allocs = await withActor(USER.STAFF_A, async (tx) =>
      deductStockFefo(tx, {
        branchId: BRANCH.B1,
        productId,
        quantity: 7,
        actorId: USER.STAFF_A,
      }),
    );
    expect(allocs).toHaveLength(2);
    expect(allocs[0].taken).toBe(5); // batch 2026-12-01 habis dulu
    expect(allocs[1].taken).toBe(2);

    const stock = await withActor(USER.STAFF_A, async (tx) => getStock(tx, BRANCH.B1, productId));
    expect(stock.totalQuantity).toBe(8); // 10 - 2 (batch kedua) = 8
  });

  it("menolak bila stok tidak cukup (BR-006)", async () => {
    const { productId } = await freshStock({ batches: [{ qty: 3, expiresAt: null }] });
    await expect(
      withActor(USER.STAFF_A, async (tx) =>
        deductStockFefo(tx, {
          branchId: BRANCH.B1,
          productId,
          quantity: 4,
          actorId: USER.STAFF_A,
        }),
      ),
    ).rejects.toThrow(/Stok tidak cukup/);
  });

  it("dua penjualan unit terakhir bersamaan: hanya satu berhasil, stok tak minus (BR-006)", async () => {
    // Paksսkan balapan nyata di level SERVICE: satu transaksi "pemblokir" memegang
    // kunci baris batch, sehingga kedua panggilan service (deductStockFefo) menumpuk
    // menunggu. Saat kunci dilepas, keduanya benar-benar berlomba.
    const { productId, batchIds } = await freshStock({ batches: [{ qty: 1, expiresAt: null }] });
    const batchId = batchIds[0];
    const pool = getPool();
    const block = await pool.connect();
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    try {
      await block.query("BEGIN");
      await block.query(`select quantity from stock_batch where id=$1 for update`, [batchId]);

      const pA = withActor(USER.STAFF_A, (tx) =>
        deductStockFefo(tx, { branchId: BRANCH.B1, productId, quantity: 1, actorId: USER.STAFF_A }),
      );
      const pB = withActor(USER.SUPERVISOR_A, (tx) =>
        deductStockFefo(tx, {
          branchId: BRANCH.B1,
          productId,
          quantity: 1,
          actorId: USER.SUPERVISOR_A,
        }),
      );

      await sleep(300); // beri waktu keduanya mencapai titik terkunci
      await block.query("COMMIT"); // lepaskan kunci -> keduanya berlomba

      const results = await Promise.allSettled([pA, pB]);
      const fulfilled = results.filter((r) => r.status === "fulfilled").length;
      const rejected = results.filter((r) => r.status === "rejected").length;
      expect(fulfilled).toBe(1); // tepat satu berhasil mengambil unit terakhir
      expect(rejected).toBe(1); // satu ditolak karena stok habis
    } finally {
      await block.query("ROLLBACK").catch(() => undefined);
      block.release();
    }
    const stock = await withActor(USER.OWNER, (tx) => getStock(tx, BRANCH.B1, productId));
    expect(stock.totalQuantity).toBe(0); // tidak minus
  });
});

describe("Inventori - penyesuaian stok (BR-006 pengecualian)", () => {
  it("penyesuaian negatif melebihi stok ditolak", async () => {
    const { productId } = await freshStock({ batches: [{ qty: 2, expiresAt: null }] });
    await expect(
      withActor(USER.SUPERVISOR_A, async (tx) =>
        adjustStock(tx, {
          branchId: BRANCH.B1,
          productId,
          delta: -5,
          reason: "Hapus rusak",
          actorId: USER.SUPERVISOR_A,
        }),
      ),
    ).rejects.toThrow(/Stok tidak cukup/);
  });

  it("penyesuaian tanpa alasan ditolak", async () => {
    const { productId } = await freshStock({ batches: [{ qty: 2, expiresAt: null }] });
    await expect(
      withActor(USER.SUPERVISOR_A, async (tx) =>
        adjustStock(tx, {
          branchId: BRANCH.B1,
          productId,
          delta: 1,
          reason: "   ",
          actorId: USER.SUPERVISOR_A,
        }),
      ),
    ).rejects.toThrow(/Alasan/);
  });
});
