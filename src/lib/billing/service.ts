/**
 * Kasir & pembayaran (BR-008/009/010/011/018/020/021) — service.
 *
 * Dijalankan di dalam `withActor` (RLS aktif). Tagihan dibuat dari `computeInvoice`
 * (modul murni), stok obat/produk dikurangi FEFO secara atomik, dan pembayaran
 * bersifat idempoten (idempotency_key) dengan penguncian baris tagihan (FOR UPDATE)
 * sehingga satu aksi bayar tidak tercatat dua kali meski ditekan berulang (BR-018).
 */
import type { PoolClient } from "@/lib/db";
import { computeInvoice, type InvoiceItemInput, type DiscountInput } from "@/lib/domain/invoice";
import { type RoundingStep } from "@/lib/domain/rounding";
import { type TaxSettings } from "@/lib/domain/tax";
import { deductStockFefo } from "@/lib/inventory/service";

export interface CreateInvoiceItem extends InvoiceItemInput {
  productId?: string | null;
  batchHint?: string | null;
  kind?: "product" | "service" | "medicine" | "boarding";
  deductStock?: boolean;
}

export interface CreateInvoiceInput {
  branchId: string;
  customerId?: string | null;
  petId?: string | null;
  visitId?: string | null;
  items: CreateInvoiceItem[];
  tax: TaxSettings;
  rounding: RoundingStep;
  discount?: DiscountInput;
  actorId: string;
}

export interface CreateInvoiceResult {
  invoiceId: string;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  roundingAdjustment: number;
  total: number;
}

/** Membuat tagihan terpadu + mengurangi stok (atomik) + menyimpan salinan tarif (BR-020). */
export async function createInvoice(
  tx: PoolClient,
  input: CreateInvoiceInput,
): Promise<CreateInvoiceResult> {
  const computed = computeInvoice({
    items: input.items,
    tax: input.tax,
    rounding: input.rounding,
    discount: input.discount,
  });

  const invRes = await tx.query<{ id: string }>(
    `insert into invoice (
       branch_id, customer_id, pet_id, visit_id, status,
       subtotal, discount, tax, tax_rate, tax_enabled, tax_prices_include,
       rounding_adjustment, total, paid_amount, created_by
     ) values ($1,$2,$3,$4,'unpaid',$5,$6,$7,$8,$9,$10,$11,$12,0,$13)
     returning id`,
    [
      input.branchId,
      input.customerId ?? null,
      input.petId ?? null,
      input.visitId ?? null,
      computed.subtotal,
      computed.discount,
      computed.tax,
      computed.taxSettings.ratePercent,
      computed.taxSettings.enabled,
      computed.taxSettings.pricesIncludeTax,
      computed.roundingAdjustment,
      computed.total,
      input.actorId,
    ],
  );
  const invoiceId = invRes.rows[0].id;

  // Simpan item & (bila diminta) kurangi stok FEFO secara atomik.
  for (const it of input.items) {
    let batchId: string | null = it.batchHint ?? null;
    if (it.deductStock && it.productId) {
      const allocations = await deductStockFefo(tx, {
        branchId: input.branchId,
        productId: it.productId,
        quantity: it.quantity,
        kind: it.kind === "medicine" ? "usage" : "sale",
        reason: `Tagihan ${invoiceId}`,
        ref: invoiceId,
        actorId: input.actorId,
      });
      if (allocations.length > 0) batchId = allocations[0].batchId;
    }
    await tx.query(
      `insert into invoice_item (invoice_id, product_id, batch_id, description, quantity, unit_price, taxable, kind)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        invoiceId,
        it.productId ?? null,
        batchId,
        it.name,
        it.quantity,
        it.unitPrice,
        it.taxable,
        it.kind ?? "service",
      ],
    );
  }

  return {
    invoiceId,
    subtotal: computed.subtotal,
    discount: computed.discount,
    tax: computed.tax,
    taxRate: computed.taxSettings.ratePercent,
    roundingAdjustment: computed.roundingAdjustment,
    total: computed.total,
  };
}

export interface RecordPaymentInput {
  invoiceId: string;
  method: "cash" | "transfer" | "qris" | "card";
  amount: number;
  cashReceived?: number | null;
  reference?: string | null;
  idempotencyKey: string;
  actorId: string;
}

export interface RecordPaymentResult {
  status: "recorded" | "duplicate";
  paidAmount: number;
  total: number;
  invoiceStatus: "unpaid" | "partial" | "paid";
  changeAmount?: number;
}

/**
 * Mencatat pembayaran (BR-010/018). Idempoten via idempotency_key unik.
 * - Kunci baris tagihan (FOR UPDATE) agar dua panggilan bersamaan tidak keduanya lolos.
 * - Tunai: wajib cash_received >= amount; change = cash_received - amount.
 * - amount tidak boleh melebihi sisa tagihan; total non-tunai tidak melebihi sisa (BR-018).
 */
export async function recordPayment(
  tx: PoolClient,
  input: RecordPaymentInput,
): Promise<RecordPaymentResult> {
  // Kunci tagihan untuk mencegah pembayaran ganda balapan.
  const invRes = await tx.query<{
    status: string;
    total: number;
    paid_amount: number;
  }>(`select status, total, paid_amount from invoice where id = $1 for update`, [input.invoiceId]);
  if (invRes.rowCount === 0) throw new Error("Tagihan tidak ditemukan");
  const inv = invRes.rows[0];
  if (inv.status === "void") throw new Error("Tagihan dibatalkan (void), tidak dapat dibayar");
  if (inv.status === "paid") {
    throw new Error("Tagihan sudah lunas");
  }

  // Idempoten lebih dulu (BR-018): bila kunci sudah tercatat untuk tagihan ini,
  // perlakukan sebagai duplikat & jangan mengubah apa pun (mis. tombol ditekan 2x).
  const existing = await tx.query<{ invoice_id: string }>(
    `select invoice_id from payment where idempotency_key = $1`,
    [input.idempotencyKey],
  );
  if (existing.rowCount && existing.rowCount > 0) {
    if (existing.rows[0].invoice_id !== input.invoiceId) {
      throw new Error("idempotency_key sudah dipakai untuk tagihan lain");
    }
    return {
      status: "duplicate",
      paidAmount: inv.paid_amount,
      total: inv.total,
      invoiceStatus: inv.status as RecordPaymentResult["invoiceStatus"],
    };
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new RangeError(`Jumlah bayar harus bulat positif: ${input.amount}`);
  }
  const remaining = inv.total - inv.paid_amount;
  if (input.amount > remaining) {
    throw new RangeError(`Jumlah bayar (${input.amount}) melebihi sisa tagihan (${remaining})`);
  }

  let cashReceived: number | null = null;
  let changeAmount: number | undefined;
  if (input.method === "cash") {
    if (input.cashReceived == null) {
      throw new Error("Pembayaran tunai wajib mencantumkan uang diterima");
    }
    if (!Number.isInteger(input.cashReceived) || input.cashReceived < input.amount) {
      throw new RangeError("Uang diterima harus >= jumlah bayar");
    }
    cashReceived = input.cashReceived;
    changeAmount = cashReceived - input.amount;
  }

  // Idempoten: bila kunci sudah ada, jangan catat ganda (BR-018).
  const ins = await tx.query<{ id: string }>(
    `insert into payment (invoice_id, method, amount, cash_received, change_amount, reference, idempotency_key, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (idempotency_key) do nothing
     returning id`,
    [
      input.invoiceId,
      input.method,
      input.amount,
      cashReceived,
      changeAmount ?? null,
      input.reference ?? null,
      input.idempotencyKey,
      input.actorId,
    ],
  );

  if (ins.rowCount === 0) {
    // Duplikat: kembalikan status terkini tanpa mengubah paid_amount.
    const fresh = await tx.query<{ status: string; total: number; paid_amount: number }>(
      `select status, total, paid_amount from invoice where id = $1`,
      [input.invoiceId],
    );
    const cur = fresh.rows[0];
    return {
      status: "duplicate",
      paidAmount: cur.paid_amount,
      total: cur.total,
      invoiceStatus: cur.status as RecordPaymentResult["invoiceStatus"],
    };
  }

  const newPaid = inv.paid_amount + input.amount;
  const invoiceStatus: RecordPaymentResult["invoiceStatus"] =
    newPaid >= inv.total ? "paid" : newPaid > 0 ? "partial" : "unpaid";
  await tx.query(`update invoice set paid_amount = $1, status = $2 where id = $3`, [
    newPaid,
    invoiceStatus,
    input.invoiceId,
  ]);

  return {
    status: "recorded",
    paidAmount: newPaid,
    total: inv.total,
    invoiceStatus,
    changeAmount,
  };
}

/** Membatalkan tagihan (BR-011). Hanya bila belum lunas & belum void. */
export async function voidInvoice(
  tx: PoolClient,
  input: { invoiceId: string; reason: string; actorId: string },
): Promise<void> {
  if (!input.reason.trim()) throw new Error("Alasan void wajib diisi");
  // BR-011: void butuh permission 'invoice.void' (Supervisor), bukan sekadar invoice.manage.
  const perm = await tx.query<{ has: boolean }>(
    `select public.has_permission('invoice.void') as has`,
  );
  if (!perm.rows[0].has) {
    throw new Error("Anda tidak berwenang melakukan void (butuh persetujuan Supervisor)");
  }
  const invRes = await tx.query<{ status: string; paid_amount: number }>(
    `select status, paid_amount from invoice where id = $1 for update`,
    [input.invoiceId],
  );
  if (invRes.rowCount === 0) throw new Error("Tagihan tidak ditemukan");
  const inv = invRes.rows[0];
  if (inv.status === "void") throw new Error("Tagihan sudah dibatalkan");
  if (inv.paid_amount > 0) {
    throw new Error("Tagihan yang sudah menerima pembayaran tidak dapat di-void");
  }
  await tx.query(
    `update invoice set status = 'void', void_reason = $1, voided_by = $2, voided_at = now()
      where id = $3`,
    [input.reason, input.actorId, input.invoiceId],
  );
}
