/**
 * Service Pengadaan / Purchase Order (PO).
 *
 * PO: draft → ordered → partial/received → cancelled.
 * Penerimaan PO membuat batch via receiveStock (sudah ada di inventory service).
 */
import { withActor } from "@/lib/db";
import type { PoolClient } from "pg";
import { receiveStock } from "@/lib/inventory/service";

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierId: string;
  branchId: string;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  notes: string | null;
  orderedAt: Date | null;
  orderedBy: string | null;
  expectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  poId: string;
  productId: string;
  quantity: number;
  costPrice: number;
  receivedQuantity: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: (PurchaseOrderItem & { productName: string; productSku: string })[];
  supplierName: string;
  branchName: string;
}

export interface CreatePOInput {
  supplierId: string;
  branchId: string;
  items: { productId: string; quantity: number; costPrice: number; notes?: string | null }[];
  notes?: string | null;
  expectedAt?: Date | string | null;
}

export interface ReceivePOInput {
  poId: string;
  itemReceipts: { itemId: string; quantity: number; batchCode?: string; expiresAt?: string | null }[];
  notes?: string | null;
}

/** Generate nomor PO otomatis. */
async function generatePONo(tx: PoolClient, branchId: string): Promise<string> {
  const today = new Date();
  const prefix = `PO-${branchId.slice(0, 4).toUpperCase()}-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;
  const res = await tx.query<{ count: string }>(
    `select count(*)::text as count from purchase_order where po_no like $1`,
    [`${prefix}%`],
  );
  const seq = (parseInt(res.rows[0].count, 10) + 1).toString().padStart(4, "0");
  return `${prefix}-${seq}`;
}

/** Buat PO baru (status draft). */
export async function createPO(
  actorId: string,
  input: CreatePOInput,
): Promise<PurchaseOrder> {
  return withActor(actorId, async (tx: PoolClient) => {
    if (input.items.length === 0) {
      throw new Error("Minimal 1 item PO");
    }

    const poNo = await generatePONo(tx, input.branchId);

    const poRes = await tx.query(
      `insert into purchase_order (po_no, supplier_id, branch_id, notes, expected_at)
       values ($1,$2,$3,$4,$5)
       returning id, po_no, supplier_id, branch_id, status, notes, ordered_at, ordered_by, expected_at, created_at, updated_at`,
      [poNo, input.supplierId, input.branchId, input.notes ?? null, input.expectedAt ?? null],
    );
    const po = poRes.rows[0];

    // Insert items
    for (const item of input.items) {
      await tx.query(
        `insert into purchase_order_item (po_id, product_id, quantity, cost_price, notes)
         values ($1,$2,$3,$4,$5)`,
        [po.id, item.productId, item.quantity, item.costPrice, item.notes ?? null],
      );
    }

    return mapPO(po);
  });
}

/** Update PO (hanya draft). */
export async function updatePO(
  actorId: string,
  poId: string,
  updates: Partial<Pick<CreatePOInput, "supplierId" | "expectedAt" | "notes">> & { items?: CreatePOInput["items"] },
): Promise<PurchaseOrder> {
  return withActor(actorId, async (tx: PoolClient) => {
    // Cek status
    const poRes = await tx.query(`select status from purchase_order where id = $1`, [poId]);
    if (poRes.rows[0]?.status !== "draft") {
      throw new Error("Hanya PO draft yang bisa diupdate");
    }

    // Update header
    const setParts: string[] = [];
    const params: unknown[] = [poId];
    let paramIdx = 2;

    if (updates.supplierId !== undefined) {
      setParts.push(`supplier_id = $${paramIdx++}`);
      params.push(updates.supplierId);
    }
    if (updates.expectedAt !== undefined) {
      setParts.push(`expected_at = $${paramIdx++}`);
      params.push(updates.expectedAt instanceof Date ? updates.expectedAt : updates.expectedAt ? new Date(updates.expectedAt) : null);
    }
    if (updates.notes !== undefined) {
      setParts.push(`notes = $${paramIdx++}`);
      params.push(updates.notes);
    }
    setParts.push(`updated_at = now()`);

    await tx.query(`update purchase_order set ${setParts.join(", ")} where id = $1`, params);

    // Update items jika disediakan
    if (updates.items) {
      await tx.query(`delete from purchase_order_item where po_id = $1`, [poId]);
      for (const item of updates.items) {
        await tx.query(
          `insert into purchase_order_item (po_id, product_id, quantity, cost_price, notes)
           values ($1,$2,$3,$4,$5)`,
          [poId, item.productId, item.quantity, item.costPrice, item.notes ?? null],
        );
      }
    }

    const updatedRes = await tx.query(
      `select id, po_no, supplier_id, branch_id, status, notes, ordered_at, ordered_by, expected_at, created_at, updated_at
       from purchase_order where id = $1`,
      [poId],
    );
    return mapPO(updatedRes.rows[0]);
  });
}

/** Kirim PO ke supplier (status ordered). */
export async function orderPO(actorId: string, poId: string): Promise<PurchaseOrder> {
  return withActor(actorId, async (tx: PoolClient) => {
    const rows = await tx.query(
      `update purchase_order
         set status = 'ordered', ordered_at = now(), ordered_by = $1, updated_at = now()
       where id = $2 and status = 'draft'
       returning id, po_no, supplier_id, branch_id, status, notes, ordered_at, ordered_by, expected_at, created_at, updated_at`,
      [actorId, poId],
    );
    if (rows.rows.length === 0) {
      throw new Error("PO tidak ditemukan atau bukan status draft");
    }
    return mapPO(rows.rows[0]);
  });
}

/** Batalkan PO (hanya draft/ordered). */
export async function cancelPO(actorId: string, poId: string): Promise<void> {
  return withActor(actorId, async (tx: PoolClient) => {
    const res = await tx.query(
      `update purchase_order
         set status = 'cancelled', updated_at = now()
       where id = $1 and status in ('draft', 'ordered')`,
      [poId],
    );
    if (res.rowCount === 0) {
      throw new Error("PO tidak ditemukan atau tidak bisa dibatalkan (hanya draft/ordered)");
    }
  });
}

/** Terima PO (bisa parsial per item) - membuat batch via receiveStock. */
export async function receivePO(
  actorId: string,
  input: ReceivePOInput,
): Promise<PurchaseOrder> {
  return withActor(actorId, async (tx: PoolClient) => {
    const poRes = await tx.query(`select * from purchase_order where id = $1`, [input.poId]);
    const po = poRes.rows[0];
    if (!po) throw new Error("PO tidak ditemukan");
    if (po.status === "cancelled") throw new Error("PO sudah dibatalkan");
    if (po.status === "received") throw new Error("PO sudah diterima penuh");

    // Process each item receipt
    for (const receipt of input.itemReceipts) {
      // Get item
      const itemRes = await tx.query(
        `select * from purchase_order_item where id = $1 and po_id = $2`,
        [receipt.itemId, input.poId],
      );
      const item = itemRes.rows[0];
      if (!item) throw new Error(`Item PO tidak ditemukan: ${receipt.itemId}`);

      const remaining = item.quantity - item.received_quantity;
      if (receipt.quantity > remaining) {
        throw new Error(`Quantity melebihi sisa: item ${item.product_id} sisa ${remaining}`);
      }

      // Receive stock (creates batch)
      await receiveStock(tx, {
        branchId: po.branch_id,
        productId: item.product_id,
        quantity: receipt.quantity,
        costPrice: item.cost_price,
        batchCode: receipt.batchCode ?? `PO-${po.po_no}-${item.product_id.slice(0, 8)}`,
        expiresAt: receipt.expiresAt ?? null,
        reason: `Penerimaan PO ${po.po_no}`,
        ref: po.id,
        actorId,
      });

      // Update received_quantity
      await tx.query(
        `update purchase_order_item
           set received_quantity = received_quantity + $1, updated_at = now()
         where id = $2`,
        [receipt.quantity, receipt.itemId],
      );
    }

    // Update PO status
    const itemsRes = await tx.query(
      `select quantity, received_quantity from purchase_order_item where po_id = $1`,
      [input.poId],
    );
    const allReceived = itemsRes.rows.every((r: any) => r.received_quantity >= r.quantity);
    const anyReceived = itemsRes.rows.some((r: any) => r.received_quantity > 0);

    let newStatus = po.status;
    if (allReceived) newStatus = "received";
    else if (anyReceived) newStatus = "partial";

    await tx.query(
      `update purchase_order set status = $1, updated_at = now() where id = $2`,
      [newStatus, input.poId],
    );

    return getPO(actorId, input.poId) as Promise<PurchaseOrder>;
  });
}

/** Dapatkan PO by ID dengan items. */
export async function getPO(
  actorId: string,
  poId: string,
): Promise<PurchaseOrderWithItems | null> {
  return withActor(actorId, async (tx: PoolClient) => {
    const poRes = await tx.query(
      `select po.*, s.name as supplier_name, b.name as branch_name
       from purchase_order po
       join customer s on s.id = po.supplier_id
       join branch b on b.id = po.branch_id
       where po.id = $1`,
      [poId],
    );
    const po = poRes.rows[0];
    if (!po) return null;

    const itemsRes = await tx.query(
      `select poi.*, p.name as product_name, p.sku as product_sku
       from purchase_order_item poi
       join product p on p.id = poi.product_id
       where poi.po_id = $1
       order by poi.created_at`,
      [poId],
    );

    return {
      ...mapPO(po),
      items: itemsRes.rows.map(mapPOItemWithProduct),
      supplierName: po.supplier_name,
      branchName: po.branch_name,
    };
  });
}

/** Daftar PO (filter branch, status). */
export async function listPOs(
  actorId: string,
  filters: { branchId?: string; status?: string },
): Promise<PurchaseOrder[]> {
  return withActor(actorId, async (tx: PoolClient) => {
    let sql = `
      select po.*, s.name as supplier_name, b.name as branch_name
      from purchase_order po
      join customer s on s.id = po.supplier_id
      join branch b on b.id = po.branch_id
      where 1=1
    `;
    const params: unknown[] = [];

    if (filters.branchId) {
      sql += ` and po.branch_id = $${params.length + 1}`;
      params.push(filters.branchId);
    }
    if (filters.status) {
      sql += ` and po.status = $${params.length + 1}`;
      params.push(filters.status);
    }

    sql += ` order by po.created_at desc`;

    const rows = await tx.query(sql, params);
    return rows.rows.map(mapPOWithNames);
  });
}

function mapPO(row: Record<string, unknown>): PurchaseOrder {
  return {
    id: row.id as string,
    poNo: row.po_no as string,
    supplierId: row.supplier_id as string,
    branchId: row.branch_id as string,
    status: row.status as "draft" | "ordered" | "partial" | "received" | "cancelled",
    notes: row.notes as string | null,
    orderedAt: row.ordered_at ? new Date(row.ordered_at as string) : null,
    orderedBy: row.ordered_by as string | null,
    expectedAt: row.expected_at ? new Date(row.expected_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapPOWithNames(row: Record<string, unknown>): PurchaseOrder {
  return {
    ...mapPO(row),
    // supplierName and branchName not in base interface
  } as PurchaseOrder & { supplierName: string; branchName: string };
}

function mapPOItem(row: Record<string, unknown>): PurchaseOrderItem {
  return {
    id: row.id as string,
    poId: row.po_id as string,
    productId: row.product_id as string,
    quantity: row.quantity as number,
    costPrice: row.cost_price as number,
    receivedQuantity: row.received_quantity as number,
    notes: row.notes as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapPOItemWithProduct(row: Record<string, unknown>): PurchaseOrderItem & { productName: string; productSku: string } {
  return {
    ...mapPOItem(row),
    productName: row.product_name as string,
    productSku: row.product_sku as string,
  };
}