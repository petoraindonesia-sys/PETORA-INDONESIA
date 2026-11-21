/**
 * Tes integrasi kunjungan & rekam medis (BR-001, BR-003, BR-004) — RLS.
 *
 * Kunjungan: terisolasi per cabang (visit_read/write via user_branch_ids).
 * Rekam medis: baca lintas cabang (medical.read), tulis draft oleh Dokter di
 * cabangnya, draft hanya milik sendiri, final terkunci (BR-004).
 */
import { describe, it, expect } from "vitest";
import { withActor, adminQuery } from "@/lib/db";
import { listVisits, createVisit, updateVisitStatus } from "@/lib/visits/service";
import {
  listMedicalRecordsByPet,
  createMedicalDraft,
  updateMedicalDraft,
  finalizeMedical,
} from "@/lib/medical/service";
import { createCustomer } from "@/lib/customer/service";
import { createPet } from "@/lib/pet/service";
import { USER, BRANCH } from "./fixtures";

/** Buat pelanggan + hewan unik untuk satu tes; kembalikan { customerId, petId }. */
async function seedPet(
  actorId: string,
  tag: string,
): Promise<{ customerId: string; petId: string }> {
  const customer = await withActor(actorId, (tx) =>
    createCustomer(tx, { fullName: `Pelanggan ${tag} ${Date.now()}`, actorId }),
  );
  const pet = await withActor(actorId, (tx) =>
    createPet(tx, { customerId: customer.id, name: `Hewan ${tag}`, species: "Kucing", actorId }),
  );
  return { customerId: customer.id, petId: pet.id };
}

describe("Kunjungan - isolasi cabang (BR-001)", () => {
  it("Staff membuat kunjungan di cabangnya & melihatnya", async () => {
    const { customerId, petId } = await seedPet(USER.STAFF_A, "visitA");
    const visit = await withActor(USER.STAFF_A, (tx) =>
      createVisit(tx, { branchId: BRANCH.B1, customerId, petId, actorId: USER.STAFF_A }),
    );
    expect(visit.branchId).toBe(BRANCH.B1);
    expect(visit.status).toBe("terdaftar");
    expect(visit.queueNumber).toBeGreaterThan(0);

    const list = await withActor(USER.STAFF_A, (tx) => listVisits(tx, { branchId: BRANCH.B1 }));
    expect(list.some((v) => v.id === visit.id)).toBe(true);
  });

  it("Staff tidak bisa membuat kunjungan di cabang lain (RLS WITH CHECK gagal)", async () => {
    const { customerId, petId } = await seedPet(USER.STAFF_A, "visitB");
    await expect(
      withActor(USER.STAFF_A, (tx) =>
        createVisit(tx, { branchId: BRANCH.B2, customerId, petId, actorId: USER.STAFF_A }),
      ),
    ).rejects.toBeTruthy();
  });

  it("Staff B tidak melihat kunjungan cabang A", async () => {
    const { customerId, petId } = await seedPet(USER.STAFF_A, "visitC");
    const visit = await withActor(USER.STAFF_A, (tx) =>
      createVisit(tx, { branchId: BRANCH.B1, customerId, petId, actorId: USER.STAFF_A }),
    );
    const fromB = await withActor(USER.STAFF_B, (tx) => listVisits(tx, { branchId: BRANCH.B1 }));
    // RLS: Staff B hanya melihat cabang B2 -> listVisits(B1) kosong.
    expect(fromB.some((v) => v.id === visit.id)).toBe(false);
  });

  it("transisi status mengikuti alur klinik", async () => {
    const { customerId, petId } = await seedPet(USER.STAFF_A, "visitD");
    const visit = await withActor(USER.STAFF_A, (tx) =>
      createVisit(tx, { branchId: BRANCH.B1, customerId, petId, actorId: USER.STAFF_A }),
    );
    // terdaftar -> menunggu
    const s1 = await withActor(USER.STAFF_A, (tx) =>
      updateVisitStatus(tx, visit.id, { status: "menunggu" }),
    );
    expect(s1!.status).toBe("menunggu");
    // menunggu -> diperiksa
    const s2 = await withActor(USER.STAFF_A, (tx) =>
      updateVisitStatus(tx, visit.id, { status: "diperiksa" }),
    );
    expect(s2!.status).toBe("diperiksa");
    // transisi ilegal (diperiksa -> terdaftar) ditolak
    await expect(
      withActor(USER.STAFF_A, (tx) => updateVisitStatus(tx, visit.id, { status: "terdaftar" })),
    ).rejects.toThrow(/Transisi status tidak diizinkan/);
  });

  it("hewan bukan milik pelanggan yang dipilih ditolak", async () => {
    const a = await seedPet(USER.STAFF_A, "visitE1");
    const b = await seedPet(USER.STAFF_A, "visitE2");
    await expect(
      withActor(USER.STAFF_A, (tx) =>
        createVisit(tx, {
          branchId: BRANCH.B1,
          customerId: a.customerId,
          petId: b.petId,
          actorId: USER.STAFF_A,
        }),
      ),
    ).rejects.toThrow(/bukan milik pelanggan/);
  });
});

describe("Rekam medis - draft/final & lintas cabang (BR-003/004)", () => {
  it("Dokter A membuat draft di cabangnya", async () => {
    const { petId } = await seedPet(USER.VET_A, "medA");
    const record = await withActor(USER.VET_A, (tx) =>
      createMedicalDraft(tx, {
        branchId: BRANCH.B1,
        petId,
        actorId: USER.VET_A,
        diagnosis: "Gastritis",
      }),
    );
    expect(record.status).toBe("draft");
    expect(record.diagnosis).toBe("Gastritis");
    expect(record.authorId).toBe(USER.VET_A);
  });

  it("Dokter tidak bisa membuat entri atas nama dokter lain (RLS)", async () => {
    const { petId } = await seedPet(USER.VET_A, "medB");
    await expect(
      withActor(USER.VET_A, (tx) =>
        createMedicalDraft(tx, {
          branchId: BRANCH.B1,
          petId,
          actorId: USER.VET_B, // bukan aktor
        }),
      ),
    ).rejects.toBeTruthy();
  });

  it("Dokter B (cabang lain) membaca rekam medis Dokter A (BR-003)", async () => {
    const { petId } = await seedPet(USER.VET_A, "medC");
    const record = await withActor(USER.VET_A, (tx) =>
      createMedicalDraft(tx, { branchId: BRANCH.B1, petId, actorId: USER.VET_A, diagnosis: "Flu" }),
    );
    const seen = await withActor(USER.VET_B, (tx) => listMedicalRecordsByPet(tx, petId));
    expect(seen.some((r) => r.id === record.id)).toBe(true);
  });

  it("Dokter tanpa medical.read tidak melihat rekam medis", async () => {
    const { petId } = await seedPet(USER.VET_A, "medD");
    await withActor(USER.VET_A, (tx) =>
      createMedicalDraft(tx, { branchId: BRANCH.B1, petId, actorId: USER.VET_A, diagnosis: "X" }),
    );
    const seen = await withActor(USER.VET_NO_READ, (tx) => listMedicalRecordsByPet(tx, petId));
    expect(seen.length).toBe(0);
  });

  it("Dokter memperbarui draft miliknya", async () => {
    const { petId } = await seedPet(USER.VET_A, "medE");
    const record = await withActor(USER.VET_A, (tx) =>
      createMedicalDraft(tx, { branchId: BRANCH.B1, petId, actorId: USER.VET_A }),
    );
    const updated = await withActor(USER.VET_A, (tx) =>
      updateMedicalDraft(tx, record.id, { diagnosis: "Dermatitis", treatment: "Salep" }),
    );
    expect(updated!.diagnosis).toBe("Dermatitis");
    expect(updated!.treatment).toBe("Salep");
  });

  it("Entri final terkunci terhadap perubahan (BR-004)", async () => {
    const { petId } = await seedPet(USER.VET_A, "medF");
    const record = await withActor(USER.VET_A, (tx) =>
      createMedicalDraft(tx, {
        branchId: BRANCH.B1,
        petId,
        actorId: USER.VET_A,
        diagnosis: "Awal",
      }),
    );
    const finalized = await withActor(USER.VET_A, (tx) => finalizeMedical(tx, record.id));
    expect(finalized!.status).toBe("final");
    expect(finalized!.finalizedAt).not.toBeNull();

    // Update setelah final -> 0 baris (RLS using draft) -> null.
    const afterUpdate = await withActor(USER.VET_A, (tx) =>
      updateMedicalDraft(tx, record.id, { diagnosis: "Berubah" }),
    );
    expect(afterUpdate).toBeNull();
    const row = (
      await adminQuery<{ diagnosis: string }>(`select diagnosis from medical_record where id=$1`, [
        record.id,
      ])
    )[0];
    expect(row.diagnosis).toBe("Awal");
  });

  it("finalisasi entri yang sudah final ditolak", async () => {
    const { petId } = await seedPet(USER.VET_A, "medG");
    const record = await withActor(USER.VET_A, (tx) =>
      createMedicalDraft(tx, { branchId: BRANCH.B1, petId, actorId: USER.VET_A }),
    );
    await withActor(USER.VET_A, (tx) => finalizeMedical(tx, record.id));
    await expect(withActor(USER.VET_A, (tx) => finalizeMedical(tx, record.id))).rejects.toThrow(
      /sudah final/,
    );
  });

  it("Dokter tidak bisa membuat rekam medis di cabang yang bukan miliknya", async () => {
    const { petId } = await seedPet(USER.VET_A, "medH");
    // Dokter A hanya cabang B1 -> insert di B2 ditolak RLS WITH CHECK.
    await expect(
      withActor(USER.VET_A, (tx) =>
        createMedicalDraft(tx, { branchId: BRANCH.B2, petId, actorId: USER.VET_A }),
      ),
    ).rejects.toBeTruthy();
  });
});
