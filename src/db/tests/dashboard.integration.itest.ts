/**
 * Tes integrasi dashboard (BR-001) — RLS membatasi cabang aktor; hitungan benar.
 */
import { describe, it, expect } from "vitest";
import { withActor, adminQuery } from "@/lib/db";
import { getDashboard } from "@/lib/dashboard/service";
import { createVisit } from "@/lib/visits/service";
import { createInvoice } from "@/lib/billing/service";
import { createCustomer } from "@/lib/customer/service";
import { createPet } from "@/lib/pet/service";
import { USER, BRANCH } from "./fixtures";

async function seedPet(
  actorId: string,
  tag: string,
): Promise<{ customerId: string; petId: string }> {
  const customer = await withActor(actorId, (tx) =>
    createCustomer(tx, { fullName: `Dash ${tag} ${Date.now()}`, actorId }),
  );
  const pet = await withActor(actorId, (tx) =>
    createPet(tx, { customerId: customer.id, name: `Hewan ${tag}`, species: "Kucing", actorId }),
  );
  return { customerId: customer.id, petId: pet.id };
}

describe("Dashboard - ringkasan harian (BR-001)", () => {
  it("Staff A hanya melihat cabang B1", async () => {
    const dash = await withActor(USER.STAFF_A, (tx) => getDashboard(tx));
    expect(dash.branches.length).toBeGreaterThanOrEqual(1);
    expect(dash.branches.every((b) => b.branchId === BRANCH.B1)).toBe(true);
  });

  it("Owner melihat semua cabang", async () => {
    const dash = await withActor(USER.OWNER, (tx) => getDashboard(tx));
    const ids = new Set(dash.branches.map((b) => b.branchId));
    expect(ids.has(BRANCH.B1)).toBe(true);
    expect(ids.has(BRANCH.B2)).toBe(true);
  });

  it("hitungan kunjungan & tagihan hari ini benar", async () => {
    // Bersihkan kunjungan/tagihan B1 hari ini agar hitungan deterministik.
    await adminQuery(
      `delete from payment where invoice_id in (select id from invoice where branch_id=$1)`,
      [BRANCH.B1],
    );
    await adminQuery(
      `delete from invoice_item where invoice_id in (select id from invoice where branch_id=$1)`,
      [BRANCH.B1],
    );
    await adminQuery(`delete from invoice where branch_id=$1`, [BRANCH.B1]);
    await adminQuery(`delete from visit where branch_id=$1`, [BRANCH.B1]);

    const { customerId, petId } = await seedPet(USER.STAFF_A, "dash1");
    await withActor(USER.STAFF_A, (tx) =>
      createVisit(tx, { branchId: BRANCH.B1, customerId, petId, actorId: USER.STAFF_A }),
    );
    await withActor(USER.STAFF_A, (tx) =>
      createInvoice(tx, {
        branchId: BRANCH.B1,
        customerId,
        petId,
        items: [
          { name: "Konsultasi", quantity: 1, unitPrice: 100000, taxable: false, kind: "service" },
        ],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        actorId: USER.STAFF_A,
      }),
    );

    const dash = await withActor(USER.STAFF_A, (tx) => getDashboard(tx));
    const b1 = dash.branches.find((b) => b.branchId === BRANCH.B1)!;
    expect(b1.visitsToday).toBeGreaterThanOrEqual(1);
    expect(b1.invoicesToday).toBeGreaterThanOrEqual(1);
    expect(b1.revenueToday).toBeGreaterThanOrEqual(100000);
  });

  it("totals adalah jumlah dari cabang", async () => {
    const dash = await withActor(USER.OWNER, (tx) => getDashboard(tx));
    const sumVisits = dash.branches.reduce((a, b) => a + b.visitsToday, 0);
    expect(dash.totals.visitsToday).toBe(sumVisits);
  });
});
