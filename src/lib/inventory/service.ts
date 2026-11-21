/**
 * Inventori (BR-006, BR-007, BR-014) — service.
 *
 * Dijalankan di dalam `withActor` (RLS aktif sebagai pengguna). Semua pengurangan
 * stok memakai FEFO dan atomik: baris batch dikunci (SELECT ... FOR UPDATE) lalu
 * dikurangi dengan syarat quantity >= jumlah yang diambil (BR-006). Bila tidak cukup,
 * melempar error sehingga transaksi rollback (tidak ada stok negatif).
 */
import type { PoolClient } from "@/lib/db";
import { allocateFefo } from "@/lib/domain/fefo";

export interface ReceiveStockInput {
  branchId: string;
  productId: string;
  quantity: number;
  costPrice: number;
  batchCode?: string;
  expiresAt?: string | null; // ISO date (YYYY-MM-DD) atau null
  reason?: string;
  ref?: string;
  actorId: string;
}

/** Menerima stok (pengadaan): menambah batch & mencatat mutasi 'receipt'. */
export async function receiveStock(tx: PoolClient, input: ReceiveStockInput): Promise<string> {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new RangeError(`Jumlah terima harus bulat positif: ${input.quantity}`);
  }
  const batchRes = await tx.query<{ id: string }>(
    `insert into stock_batch (branch_id, product_id, batch_code, quantity, cost_price, expires_at)
     values ($1,$2,$3,$4,$5,$6) returning id`,
    [
      input.branchId,
      input.productId,
      input.batchCode ?? null,
      input.quantity,
      input.costPrice,
      input.expiresAt ?? null,
    ],
  );
  const batchId = batchRes.rows[0].id;
  await tx.query(
    `insert into stock_mutation (branch_id, product_id, batch_id, delta, kind, reason, ref, created_by)
     values ($1,$2,$3,$4,'receipt',$5,$6,$7)`,
    [
      input.branchId,
      input.productId,
      batchId,
      input.quantity,
      input.reason ?? "Penerimaan barang",
      input.ref ?? null,
      input.actorId,
    ],
  );
  return batchId;
}

export interface FefoAllocation {
  batchId: string;
  taken: number;
}

/**
 * Mengurangi stok secara FEFO & atomik (BR-006/007).
 * Mengembalikan alokasi per batch. Melempar bila stok tidak cukup.
 * Menulis satu mutasi 'sale' per batch yang diambil.
 */
export async function deductStockFefo(
  tx: PoolClient,
  input: {
    branchId: string;
    productId: string;
    quantity: number;
    kind?: "sale" | "usage" | "transfer_out" | "return" | "adjustment";
    reason?: string;
    ref?: string;
    actorId: string;
  },
): Promise<FefoAllocation[]> {
  const { branchId, productId, quantity } = input;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new RangeError(`Jumlah kurang harus bulat positif: ${quantity}`);
  }

  // Kunci baris batch (FEFO: kedaluwarsa terdekat dulu, NULLS LAST) untuk mencegah
  // dua transaksi bersamaan mengambil stok yang sama (BR-006).
  const batchRes = await tx.query<{
    id: string;
    quantity: number;
    expires_at: string | null;
  }>(
    `select id, quantity, expires_at
       from stock_batch
      where branch_id = $1 and product_id = $2
      order by expires_at asc nulls last, created_at asc
        for update`,
    [branchId, productId],
  );

  const allocations = allocateFefo(
    quantity,
    batchRes.rows.map((b) => ({
      batchId: b.id,
      available: b.quantity,
      expiresAt: b.expires_at,
    })),
  );

  for (const alloc of allocations) {
    // Kurangi dengan syarat quantity >= diambil ( BR-006 ), lalu catat mutasi.
    const upd = await tx.query(
      `update stock_batch set quantity = quantity - $1
        where id = $2 and quantity >= $1`,
      [alloc.taken, alloc.batchId],
    );
    if (upd.rowCount !== 1) {
      throw new Error(`Stok tidak cukup untuk batch ${alloc.batchId}`);
    }
    await tx.query(
      `insert into stock_mutation (branch_id, product_id, batch_id, delta, kind, reason, ref, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        branchId,
        productId,
        alloc.batchId,
        -alloc.taken,
        input.kind ?? "sale",
        input.reason ?? null,
        input.ref ?? null,
        input.actorId,
      ],
    );
  }

  return allocations;
}

export interface StockRow {
  productId: string;
  totalQuantity: number;
  batches: { batchId: string; quantity: number; expiresAt: string | null }[];
}

/** Total stok sebuah produk di satu cabang (agregat batch). */
export async function getStock(
  tx: PoolClient,
  branchId: string,
  productId: string,
): Promise<StockRow> {
  const res = await tx.query<{ id: string; quantity: number; expires_at: string | null }>(
    `select id, quantity, expires_at from stock_batch
      where branch_id = $1 and product_id = $2
      order by expires_at asc nulls last`,
    [branchId, productId],
  );
  return {
    productId,
    totalQuantity: res.rows.reduce((a, b) => a + b.quantity, 0),
    batches: res.rows.map((b) => ({
      batchId: b.id,
      quantity: b.quantity,
      expiresAt: b.expires_at,
    })),
  };
}

/**
 * Penyesuaian stok oleh Supervisor (BR-006 pengecualian).
 * delta boleh positif atau negatif; untuk negatif, kurangi FEFO; untuk positif,
 * buat batch penyesuaian. Mencatat mutasi 'adjustment' dengan alasan wajib.
 */
export async function adjustStock(
  tx: PoolClient,
  input: {
    branchId: string;
    productId: string;
    delta: number;
    reason: string;
    actorId: string;
  },
): Promise<void> {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new RangeError(`Delta penyesuaian harus bulat non-nol: ${input.delta}`);
  }
  if (!input.reason.trim()) {
    throw new Error("Alasan penyesuaian wajib diisi");
  }
  if (input.delta > 0) {
    await receiveStock(tx, {
      branchId: input.branchId,
      productId: input.productId,
      quantity: input.delta,
      costPrice: 0,
      reason: `Penyesuaian: ${input.reason}`,
      actorId: input.actorId,
    });
    return;
  }
  const allocations = await deductStockFefo(tx, {
    branchId: input.branchId,
    productId: input.productId,
    quantity: -input.delta,
    kind: "adjustment",
    reason: `Penyesuaian: ${input.reason}`,
    actorId: input.actorId,
  });
  void allocations;
}
