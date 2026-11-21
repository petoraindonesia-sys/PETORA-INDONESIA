/**
 * Service Transfer Stok antar Cabang (BR-017).
 *
 * Alur: draft → dikirim → diterima, atau dibatalkan (hanya sebelum dikirim).
 * Stok asal berkurang saat dikirim (FEFO), tujuan bertambah saat diterima.
 * Batch & kedaluwarsa terbawa. Selisih dicatat & ditinjau Supervisor.
 */
import { withActor } from "@/lib/db";
import type { PoolClient } from "pg";
import { deductStockFefo } from "@/lib/inventory/service";

export interface StockTransfer {
  id: string;
  fromBranchId: string;
  toBranchId: string;
  productId: string;
  batchId: string | null;
  quantity: number;
  status: "draft" | "sent" | "received" | "cancelled";
  notes: string | null;
  requestedBy: string | null;
  sentAt: Date | null;
  sentBy: string | null;
  receivedAt: Date | null;
  receivedBy: string | null;
  receivedQuantity: number | null;
  discrepancyNotes: string | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransferWithDetails extends StockTransfer {
  fromBranchName: string;
  toBranchName: string;
  productName: string;
  productSku: string;
  batchCode: string | null;
  expiresAt: string | null;
}

export interface CreateTransferInput {
  fromBranchId: string;
  toBranchId: string;
  productId: string;
  batchId?: string | null;
  quantity: number;
  notes?: string | null;
}

/** Buat transfer baru (status draft). */
export async function createTransfer(
  actorId: string,
  input: CreateTransferInput,
): Promise<StockTransfer> {
  return withActor(actorId, async (tx: PoolClient) => {
    if (input.fromBranchId === input.toBranchId) {
      throw new Error("Cabang asal dan tujuan tidak boleh sama");
    }
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new Error("Quantity harus bulat positif");
    }

    // Validasi stok cukup di cabang asal (FEFO)
    if (input.batchId) {
      const batchRes = await tx.query<{ quantity: number }>(
        `select quantity from stock_batch where id = $1 and branch_id = $2`,
        [input.batchId, input.fromBranchId],
      );
      if (batchRes.rows.length === 0) {
        throw new Error("Batch tidak ditemukan di cabang asal");
      }
      if (batchRes.rows[0].quantity < input.quantity) {
        throw new Error(`Stok batch tidak cukup: tersedia ${batchRes.rows[0].quantity}`);
      }
    } else {
      // Cek total stok FEFO
      const batchesRes = await tx.query<{ id: string; quantity: number }>(
        `select id, quantity from stock_batch
         where branch_id = $1 and product_id = $2
         order by expires_at asc nulls last, created_at asc`,
        [input.fromBranchId, input.productId],
      );
      const totalAvail = batchesRes.rows.reduce((a, b) => a + b.quantity, 0);
      if (totalAvail < input.quantity) {
        throw new Error(`Total stok tidak cukup: tersedia ${totalAvail}`);
      }
    }

    const rows = await tx.query(
      `insert into stock_transfer (from_branch_id, to_branch_id, product_id, batch_id, quantity, notes, requested_by)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning id, from_branch_id, to_branch_id, product_id, batch_id, quantity,
                 status, notes, requested_by, sent_at, sent_by, received_at, received_by,
                 received_quantity, discrepancy_notes, cancelled_at, cancelled_by,
                 created_at, updated_at`,
      [
        input.fromBranchId,
        input.toBranchId,
        input.productId,
        input.batchId ?? null,
        input.quantity,
        input.notes ?? null,
        actorId,
      ],
    );
    return mapRow(rows.rows[0]);
  });
}

/** Kirim transfer (dari cabang asal) - kurangi stok FEFO. */
export async function sendTransfer(
  actorId: string,
  transferId: string,
): Promise<StockTransfer> {
  return withActor(actorId, async (tx: PoolClient) => {
    // Ambil transfer
    const transferRes = await tx.query(
      `select * from stock_transfer where id = $1 and status = 'draft'`,
      [transferId],
    );
    const transfer = transferRes.rows[0];
    if (!transfer) {
      throw new Error("Transfer tidak ditemukan atau bukan status draft");
    }

    // Kurangi stok di cabang asal (FEFO)
    await deductStockFefo(tx, {
      branchId: transfer.from_branch_id,
      productId: transfer.product_id,
      quantity: transfer.quantity,
      kind: "transfer_out",
      reason: `Transfer ke cabang ${transfer.to_branch_id}`,
      ref: transferId,
      actorId,
    });

    // Update transfer status
    const rows = await tx.query(
      `update stock_transfer
         set status = 'sent', sent_at = now(), sent_by = $1, updated_at = now()
       where id = $2
       returning id, from_branch_id, to_branch_id, product_id, batch_id, quantity,
                 status, notes, requested_by, sent_at, sent_by, received_at, received_by,
                 received_quantity, discrepancy_notes, cancelled_at, cancelled_by,
                 created_at, updated_at`,
      [actorId, transferId],
    );
    return mapRow(rows.rows[0]);
  });
}

/** Terima transfer (di cabang tujuan) - tambah stok. */
export async function receiveTransfer(
  actorId: string,
  transferId: string,
  receivedQuantity: number,
  discrepancyNotes?: string | null,
): Promise<StockTransfer> {
  return withActor(actorId, async (tx: PoolClient) => {
    const transferRes = await tx.query(
      `select * from stock_transfer where id = $1 and status = 'sent'`,
      [transferId],
    );
    const transfer = transferRes.rows[0];
    if (!transfer) {
      throw new Error("Transfer tidak ditemukan atau bukan status sent");
    }

    if (!Number.isInteger(receivedQuantity) || receivedQuantity <= 0) {
      throw new Error("Quantity diterima harus bulat positif");
    }

    // Tambah stok di cabang tujuan
    // Jika batch_id ada, gunakan batch yang sama (terbawa batch & expiry)
    // Jika tidak, buat batch baru di cabang tujuan
    let batchId = transfer.batch_id;
    if (!batchId) {
      // Ambil info produk untuk expiry (jika ada)
      const productRes = await tx.query<{ expires_at: string | null }>(
        `select sb.expires_at from stock_batch sb where sb.id = $1`,
        [transfer.batch_id],
      );
      // Karena tidak ada batch_id, kita buat batch baru
      const batchRes = await tx.query<{ id: string }>(
        `insert into stock_batch (branch_id, product_id, batch_code, quantity, cost_price, expires_at)
         values ($1,$2,$3,$4,$5,$6) returning id`,
        [
          transfer.to_branch_id,
          transfer.product_id,
          `TRF-${transfer.id.slice(0, 8)}`,
          receivedQuantity,
          0, // cost_price = 0 untuk transfer masuk
          productRes.rows[0]?.expires_at ?? null,
        ],
      );
      batchId = batchRes.rows[0].id;
    } else {
      // Batch sudah ada, cek apakah batch sudah ada di cabang tujuan
      // (tidak boleh duplikat batch_id di cabang berbeda - constraint FK memungkinkan tapi logis beda cabang)
      // Kita buat batch baru di cabang tujuan dengan batch_code yang sama
      const batchInfoRes = await tx.query<{ batch_code: string; expires_at: string | null }>(
        `select batch_code, expires_at from stock_batch where id = $1`,
        [batchId],
      );
      const batchInfo = batchInfoRes.rows[0];
      const newBatchRes = await tx.query<{ id: string }>(
        `insert into stock_batch (branch_id, product_id, batch_code, quantity, cost_price, expires_at)
         values ($1,$2,$3,$4,$5,$6) returning id`,
        [
          transfer.to_branch_id,
          transfer.product_id,
          batchInfo.batch_code,
          receivedQuantity,
          0,
          batchInfo.expires_at,
        ],
      );
      batchId = newBatchRes.rows[0].id;
    }

    // Catat mutasi receipt di cabang tujuan
    await tx.query(
      `insert into stock_mutation (branch_id, product_id, batch_id, delta, kind, reason, ref, created_by)
       values ($1,$2,$3,$4,'receipt',$5,$6,$7)`,
      [
        transfer.to_branch_id,
        transfer.product_id,
        batchId,
        receivedQuantity,
        `Transfer dari cabang ${transfer.from_branch_id}`,
        transferId,
        actorId,
      ],
    );

    // Update transfer status
    const rows = await tx.query(
      `update stock_transfer
         set status = 'received',
             received_at = now(),
             received_by = $1,
             received_quantity = $2,
             discrepancy_notes = $3,
             updated_at = now()
       where id = $4
       returning id, from_branch_id, to_branch_id, product_id, batch_id, quantity,
                 status, notes, requested_by, sent_at, sent_by, received_at, received_by,
                 received_quantity, discrepancy_notes, cancelled_at, cancelled_by,
                 created_at, updated_at`,
      [actorId, receivedQuantity, discrepancyNotes ?? null, transferId],
    );
    return mapRow(rows.rows[0]);
  });
}

/** Batalkan transfer (hanya status draft). */
export async function cancelTransfer(
  actorId: string,
  transferId: string,
): Promise<void> {
  return withActor(actorId, async (tx: PoolClient) => {
    const res = await tx.query(
      `update stock_transfer
         set status = 'cancelled', cancelled_at = now(), cancelled_by = $1, updated_at = now()
       where id = $2 and status = 'draft'`,
      [actorId, transferId],
    );
    if (res.rowCount === 0) {
      throw new Error("Transfer tidak ditemukan atau tidak bisa dibatalkan (hanya draft)");
    }
  });
}

/** Dapatkan transfer by ID. */
export async function getTransfer(
  actorId: string,
  transferId: string,
): Promise<StockTransfer | null> {
  return withActor(actorId, async (tx: PoolClient) => {
    const rows = await tx.query(`select * from stock_transfer where id = $1`, [transferId]);
    return rows.rows[0] ? mapRow(rows.rows[0]) : null;
  });
}

/** Daftar transfer (filter by branch, status). */
export async function listTransfers(
  actorId: string,
  filters: {
    fromBranchId?: string;
    toBranchId?: string;
    status?: "draft" | "sent" | "received" | "cancelled";
  },
): Promise<StockTransferWithDetails[]> {
  return withActor(actorId, async (tx: PoolClient) => {
    let sql = `
      select st.*, 
             fb.name as from_branch_name,
             tb.name as to_branch_name,
             p.name as product_name,
             p.sku as product_sku,
             sb.batch_code,
             sb.expires_at
      from stock_transfer st
      join branch fb on fb.id = st.from_branch_id
      join branch tb on tb.id = st.to_branch_id
      join product p on p.id = st.product_id
      left join stock_batch sb on sb.id = st.batch_id
      where 1=1
    `;
    const params: unknown[] = [];

    if (filters.fromBranchId) {
      sql += ` and st.from_branch_id = $${params.length + 1}`;
      params.push(filters.fromBranchId);
    }
    if (filters.toBranchId) {
      sql += ` and st.to_branch_id = $${params.length + 1}`;
      params.push(filters.toBranchId);
    }
    if (filters.status) {
      sql += ` and st.status = $${params.length + 1}`;
      params.push(filters.status);
    }

    sql += ` order by st.created_at desc`;

    const rows = await tx.query(sql, params);
    return rows.rows.map(mapRowWithDetails);
  });
}

function mapRow(row: Record<string, unknown>): StockTransfer {
  return {
    id: row.id as string,
    fromBranchId: row.from_branch_id as string,
    toBranchId: row.to_branch_id as string,
    productId: row.product_id as string,
    batchId: row.batch_id as string | null,
    quantity: row.quantity as number,
    status: row.status as "draft" | "sent" | "received" | "cancelled",
    notes: row.notes as string | null,
    requestedBy: row.requested_by as string | null,
    sentAt: row.sent_at ? new Date(row.sent_at as string) : null,
    sentBy: row.sent_by as string | null,
    receivedAt: row.received_at ? new Date(row.received_at as string) : null,
    receivedBy: row.received_by as string | null,
    receivedQuantity: row.received_quantity as number | null,
    discrepancyNotes: row.discrepancy_notes as string | null,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at as string) : null,
    cancelledBy: row.cancelled_by as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapRowWithDetails(row: Record<string, unknown>): StockTransferWithDetails {
  return {
    ...mapRow(row),
    fromBranchName: row.from_branch_name as string,
    toBranchName: row.to_branch_name as string,
    productName: row.product_name as string,
    productSku: row.product_sku as string,
    batchCode: row.batch_code as string | null,
    expiresAt: row.expires_at as string | null,
  };
}