/**
 * Tes integrasi kasir & pembayaran (BR-009, BR-010, BR-018, BR-020, BR-021).
 * Termasuk risiko brief: pembayaran ganda karena tombol ditekan berulang dicegah.
 */
import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { withActor, adminQuery } from "@/lib/db";
import { receiveStock } from "@/lib/inventory/service";
import {
  createInvoice,
  recordPayment,
  voidInvoice,
  listInvoices,
  getInvoice,
} from "@/lib/billing/service";
import { USER, BRANCH, CUSTOMER_ID, PET_ID } from "./fixtures";

const P_CONSULT = "50000000-0000-4000-8000-000000000001"; // 75.000
const P_VAKSIN = "50000000-0000-4000-8000-000000000002"; // 150.000
const P_OBAT = "50000000-0000-4000-8000-000000000003"; // 22.350 (product, deduct stock)

async function stockObat(branchId: string, qty: number) {
  await adminQuery(`delete from stock_mutation where branch_id=$1 and product_id=$2`, [
    branchId,
    P_OBAT,
  ]);
  await adminQuery(`delete from stock_batch where branch_id=$1 and product_id=$2`, [
    branchId,
    P_OBAT,
  ]);
  await withActor(USER.SUPERVISOR_A, async (tx) =>
    receiveStock(tx, {
      branchId,
      productId: P_OBAT,
      quantity: qty,
      costPrice: 1000,
      expiresAt: null,
      actorId: USER.SUPERVISOR_A,
    }),
  );
}

async function clearInvoices(branchId: string) {
  await adminQuery(
    `delete from payment where invoice_id in (select id from invoice where branch_id=$1)`,
    [branchId],
  );
  await adminQuery(
    `delete from invoice_item where invoice_id in (select id from invoice where branch_id=$1)`,
    [branchId],
  );
  await adminQuery(`delete from invoice where branch_id=$1`, [branchId]);
}

describe("Kasir - buat tagihan (contoh baku brief)", () => {
  it("menghasilkan tagihan Rp296.500 persis & menyimpan salinan tarif", async () => {
    await clearInvoices(BRANCH.B1);
    await stockObat(BRANCH.B1, 10);
    const result = await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        customerId: CUSTOMER_ID,
        petId: PET_ID,
        items: [
          {
            name: "Konsultasi",
            quantity: 1,
            unitPrice: 75000,
            taxable: true,
            productId: P_CONSULT,
            kind: "service",
          },
          {
            name: "Vaksin",
            quantity: 1,
            unitPrice: 150000,
            taxable: true,
            productId: P_VAKSIN,
            kind: "service",
          },
          {
            name: "Obat",
            quantity: 2,
            unitPrice: 22350,
            taxable: true,
            productId: P_OBAT,
            kind: "medicine",
            deductStock: true,
          },
        ],
        tax: { enabled: true, ratePercent: 10, pricesIncludeTax: false },
        rounding: 500,
        actorId: USER.STAFF_A,
      }),
    );
    expect(result.subtotal).toBe(269700);
    expect(result.tax).toBe(26970);
    expect(result.roundingAdjustment).toBe(-170);
    expect(result.total).toBe(296500);

    // Salinan tarif tersimpan (BR-020) & tidak berubah walau setelan perusahaan diubah.
    const inv = (
      await adminQuery<{ tax_rate: string; tax: number; total: number }>(
        `select tax_rate, tax, total from invoice where id=$1`,
        [result.invoiceId],
      )
    )[0];
    expect(Number(inv.tax_rate)).toBe(10);
    expect(inv.tax).toBe(26970);
    expect(inv.total).toBe(296500);
  });

  it("mengurangi stok obat saat tagihan dibuat (atomik)", async () => {
    await clearInvoices(BRANCH.B1);
    await stockObat(BRANCH.B1, 10);
    await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        customerId: CUSTOMER_ID,
        petId: PET_ID,
        items: [
          {
            name: "Obat",
            quantity: 3,
            unitPrice: 22350,
            taxable: true,
            productId: P_OBAT,
            kind: "medicine",
            deductStock: true,
          },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );
    const stock = await withActor(USER.STAFF_A, async (tx) => {
      const r = await tx.query<{ total: string }>(
        `select coalesce(sum(quantity),0)::text as total from stock_batch where branch_id=$1 and product_id=$2`,
        [BRANCH.B1, P_OBAT],
      );
      return r.rows[0];
    });
    expect(Number(stock.total)).toBe(7);
  });

  it("menolak membuat tagihan bila stok obat tidak cukup (transaksi rollback)", async () => {
    await clearInvoices(BRANCH.B1);
    await stockObat(BRANCH.B1, 1);
    await expect(
      withActor(USER.STAFF_A, async (tx) =>
        createInvoice(tx, {
          branchId: BRANCH.B1,
          customerId: CUSTOMER_ID,
          petId: PET_ID,
          items: [
            {
              name: "Obat",
              quantity: 5,
              unitPrice: 22350,
              taxable: true,
              productId: P_OBAT,
              kind: "medicine",
              deductStock: true,
            },
          ],
          tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
          rounding: 0,
          actorId: USER.STAFF_A,
        }),
      ),
    ).rejects.toThrow();
    // Tagihan tidak boleh tertinggal (rollback).
    const invs = await adminQuery(`select id from invoice where branch_id=$1`, [BRANCH.B1]);
    expect(invs.length).toBe(0);
  });
});

describe("Kasir - pembayaran (BR-010/018)", () => {
  it("pembayaran tunai di bawah total -> sebagian; pelunasan -> lunas", async () => {
    await clearInvoices(BRANCH.B1);
    const inv = await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        customerId: CUSTOMER_ID,
        petId: PET_ID,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 100000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );

    // DP 40.000 tunai (uang 50.000 -> kembali 10.000).
    const dp = await withActor(USER.STAFF_A, async (tx) =>
      recordPayment(tx, {
        invoiceId: inv.invoiceId,
        method: "cash",
        amount: 40000,
        cashReceived: 50000,
        idempotencyKey: randomUUID(),
        actorId: USER.STAFF_A,
      }),
    );
    expect(dp.status).toBe("recorded");
    expect(dp.invoiceStatus).toBe("partial");
    expect(dp.changeAmount).toBe(10000);
    expect(dp.paidAmount).toBe(40000);

    // Pelunasan 60.000.
    const full = await withActor(USER.STAFF_A, async (tx) =>
      recordPayment(tx, {
        invoiceId: inv.invoiceId,
        method: "transfer",
        amount: 60000,
        idempotencyKey: randomUUID(),
        actorId: USER.STAFF_A,
      }),
    );
    expect(full.invoiceStatus).toBe("paid");
    expect(full.paidAmount).toBe(100000);
  });

  it("pembayaran melebihi sisa tagihan ditolak (BR-018)", async () => {
    await clearInvoices(BRANCH.B1);
    const inv = await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        customerId: CUSTOMER_ID,
        petId: PET_ID,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 100000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );
    await expect(
      withActor(USER.STAFF_A, async (tx) =>
        recordPayment(tx, {
          invoiceId: inv.invoiceId,
          method: "cash",
          amount: 150000,
          cashReceived: 150000,
          idempotencyKey: randomUUID(),
          actorId: USER.STAFF_A,
        }),
      ),
    ).rejects.toThrow(/melebihi sisa/);
  });

  it("pembayaran ganda (tombol ditekan berulang) tidak tercatat dua kali (BR-018)", async () => {
    await clearInvoices(BRANCH.B1);
    const inv = await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        customerId: CUSTOMER_ID,
        petId: PET_ID,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 100000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );

    const key = randomUUID();
    // Dua panggilan paralel dengan idempotency_key sama.
    const results = await Promise.allSettled([
      withActor(USER.STAFF_A, async (tx) =>
        recordPayment(tx, {
          invoiceId: inv.invoiceId,
          method: "cash",
          amount: 100000,
          cashReceived: 100000,
          idempotencyKey: key,
          actorId: USER.STAFF_A,
        }),
      ),
      withActor(USER.STAFF_A, async (tx) =>
        recordPayment(tx, {
          invoiceId: inv.invoiceId,
          method: "cash",
          amount: 100000,
          cashReceived: 100000,
          idempotencyKey: key,
          actorId: USER.STAFF_A,
        }),
      ),
    ]);

    // Tepat satu pembayaran tercatat di DB.
    const pays = await adminQuery(`select id from payment where invoice_id=$1`, [inv.invoiceId]);
    expect(pays.length).toBe(1);
    const inv2 = (
      await adminQuery<{ paid_amount: number; status: string }>(
        `select paid_amount, status from invoice where id=$1`,
        [inv.invoiceId],
      )
    )[0];
    expect(inv2.paid_amount).toBe(100000); // tidak dobel
    expect(inv2.status).toBe("paid");
    void results;
  });
});

describe("Kasir - void (BR-011)", () => {
  it("void tanpa alasan ditolak", async () => {
    await clearInvoices(BRANCH.B1);
    const inv = await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 50000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );
    await expect(
      withActor(USER.SUPERVISOR_A, async (tx) =>
        voidInvoice(tx, { invoiceId: inv.invoiceId, reason: "  ", actorId: USER.SUPERVISOR_A }),
      ),
    ).rejects.toThrow(/Alasan/);
  });

  it("tagihan yang sudah dibayar tidak dapat di-void", async () => {
    await clearInvoices(BRANCH.B1);
    const inv = await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 50000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );
    await withActor(USER.STAFF_A, async (tx) =>
      recordPayment(tx, {
        invoiceId: inv.invoiceId,
        method: "cash",
        amount: 50000,
        cashReceived: 50000,
        idempotencyKey: randomUUID(),
        actorId: USER.STAFF_A,
      }),
    );
    await expect(
      withActor(USER.SUPERVISOR_A, async (tx) =>
        voidInvoice(tx, {
          invoiceId: inv.invoiceId,
          reason: "Salah input",
          actorId: USER.SUPERVISOR_A,
        }),
      ),
    ).rejects.toThrow(/sudah menerima pembayaran/);
  });

  it("Supervisor dapat void tagihan yang belum dibayar", async () => {
    await clearInvoices(BRANCH.B1);
    const inv = await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 50000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );
    await withActor(USER.SUPERVISOR_A, async (tx) =>
      voidInvoice(tx, {
        invoiceId: inv.invoiceId,
        reason: "Salah pasien",
        actorId: USER.SUPERVISOR_A,
      }),
    );
    const inv2 = (
      await adminQuery<{ status: string; void_reason: string }>(
        `select status, void_reason from invoice where id=$1`,
        [inv.invoiceId],
      )
    )[0];
    expect(inv2.status).toBe("void");
    expect(inv2.void_reason).toBe("Salah pasien");
  });
});

describe("Kasir - daftar & detail tagihan (RLS)", () => {
  it("listInvoices hanya menampilkan tagihan cabang aktor", async () => {
    await clearInvoices(BRANCH.B1);
    await clearInvoices(BRANCH.B2);
    await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 50000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );
    // Tagihan di cabang B sebagai Owner (Staff A tidak punya akses B).
    await withActor(USER.OWNER, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B2,
        items: [
          { name: "Vaksin", quantity: 1, unitPrice: 100000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.OWNER,
      }),
    );

    const visible = await withActor(USER.STAFF_A, async (tx) => listInvoices(tx));
    expect(visible.length).toBeGreaterThanOrEqual(1);
    expect(visible.every((i) => i.branchId === BRANCH.B1)).toBe(true);

    // Owner melihat semua cabang.
    const all = await withActor(USER.OWNER, async (tx) => listInvoices(tx));
    const branches = new Set(all.map((i) => i.branchId));
    expect(branches.has(BRANCH.B1)).toBe(true);
    expect(branches.has(BRANCH.B2)).toBe(true);
  });

  it("listInvoices memfilter berdasarkan branchId", async () => {
    await clearInvoices(BRANCH.B1);
    await clearInvoices(BRANCH.B2);
    await withActor(USER.OWNER, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 50000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.OWNER,
      }),
    );
    await withActor(USER.OWNER, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B2,
        items: [
          { name: "Vaksin", quantity: 1, unitPrice: 100000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.OWNER,
      }),
    );
    const onlyB1 = await withActor(USER.OWNER, async (tx) =>
      listInvoices(tx, { branchId: BRANCH.B1 }),
    );
    expect(onlyB1.length).toBe(1);
    expect(onlyB1[0].branchId).toBe(BRANCH.B1);
  });

  it("getInvoice mengembalikan item & pembayaran dengan benar", async () => {
    await clearInvoices(BRANCH.B1);
    const inv = await withActor(USER.STAFF_A, async (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        customerId: CUSTOMER_ID,
        petId: PET_ID,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 100000, taxable: false, kind: "service" },
          { name: "Obat", quantity: 2, unitPrice: 50000, taxable: false, kind: "medicine" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );
    await withActor(USER.STAFF_A, async (tx) =>
      recordPayment(tx, {
        invoiceId: inv.invoiceId,
        method: "cash",
        amount: 50000,
        cashReceived: 50000,
        idempotencyKey: randomUUID(),
        actorId: USER.STAFF_A,
      }),
    );

    const detail = await withActor(USER.STAFF_A, async (tx) => getInvoice(tx, inv.invoiceId));
    expect(detail).not.toBeNull();
    expect(detail!.items.length).toBe(2);
    expect(detail!.payments.length).toBe(1);
    expect(detail!.total).toBe(200000);
    expect(detail!.paidAmount).toBe(50000);
    expect(detail!.status).toBe("partial");
  });

  it("getInvoice mengembalikan null untuk id tidak ada", async () => {
    const detail = await withActor(USER.STAFF_A, async (tx) =>
      getInvoice(tx, "50000000-0000-4000-8000-0000000fffff"),
    );
    expect(detail).toBeNull();
  });
});
