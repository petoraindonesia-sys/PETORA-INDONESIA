/**
 * Tes integrasi service pelanggan & hewan (BR-003) — data terpusat lintas cabang.
 *
 * RLS customer/pet memakai is_staff() tanpa pembatasan cabang: Staff cabang A
 * dapat melihat & mengelola pelanggan & hewan yang sama dengan Staff cabang B.
 * Ini berbeda dari data operasional (visit/kasir) yang terisolasi per cabang.
 */
import { describe, it, expect } from "vitest";
import { withActor } from "@/lib/db";
import { listCustomers, getCustomer, createCustomer, updateCustomer } from "@/lib/customer/service";
import { listPetsByCustomer, getPet, createPet, updatePet } from "@/lib/pet/service";
import { USER, CUSTOMER_ID } from "./fixtures";

describe("Pelanggan - CRUD (BR-003)", () => {
  it("Staff membuat pelanggan baru", async () => {
    const customer = await withActor(USER.STAFF_A, (tx) =>
      createCustomer(tx, {
        fullName: "Budi Santoso",
        phone: "081234567890",
        email: "budi@example.com",
        actorId: USER.STAFF_A,
      }),
    );
    expect(customer.fullName).toBe("Budi Santoso");
    expect(customer.phone).toBe("081234567890");

    const found = await withActor(USER.STAFF_A, (tx) => getCustomer(tx, customer.id));
    expect(found!.id).toBe(customer.id);
  });

  it("Nama kosong ditolak", async () => {
    await expect(
      withActor(USER.STAFF_A, (tx) =>
        createCustomer(tx, { fullName: "   ", actorId: USER.STAFF_A }),
      ),
    ).rejects.toThrow(/Nama pelanggan wajib/);
  });

  it("Pelanggan terpusat: Staff B melihat pelanggan dibuat Staff A", async () => {
    const customer = await withActor(USER.STAFF_A, (tx) =>
      createCustomer(tx, { fullName: "Siti Aminah", actorId: USER.STAFF_A }),
    );
    // Staff B (cabang berbeda) melihat pelanggan yang sama — terpusat.
    const fromB = await withActor(USER.STAFF_B, (tx) => getCustomer(tx, customer.id));
    expect(fromB!.id).toBe(customer.id);
  });

  it("updateCustomer mengubah field yang diberikan", async () => {
    const customer = await withActor(USER.STAFF_A, (tx) =>
      createCustomer(tx, { fullName: "Ahmad", actorId: USER.STAFF_A }),
    );
    const updated = await withActor(USER.STAFF_A, (tx) =>
      updateCustomer(tx, customer.id, { phone: "089876543210" }),
    );
    expect(updated!.phone).toBe("089876543210");
    expect(updated!.fullName).toBe("Ahmad"); // tidak berubah
  });

  it("listCustomers mendukung pencarian nama", async () => {
    await withActor(USER.STAFF_A, (tx) =>
      createCustomer(tx, { fullName: "Cari Saya Spesifik 12345", actorId: USER.STAFF_A }),
    );
    const results = await withActor(USER.STAFF_A, (tx) =>
      listCustomers(tx, { search: "Spesifik 12345" }),
    );
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((c) => c.fullName.includes("Spesifik 12345"))).toBe(true);
  });
});

describe("Hewan - CRUD (BR-003)", () => {
  it("Staff membuat hewan untuk pelanggan", async () => {
    const customer = await withActor(USER.STAFF_A, (tx) =>
      createCustomer(tx, { fullName: "Rina", actorId: USER.STAFF_A }),
    );
    const pet = await withActor(USER.STAFF_A, (tx) =>
      createPet(tx, {
        customerId: customer.id,
        name: "Kucing Oyen",
        species: "Kucing",
        breed: "Domestik",
        sex: "female",
        birthDate: "2022-05-10",
        weightGrams: 3500,
        actorId: USER.STAFF_A,
      }),
    );
    expect(pet.name).toBe("Kucing Oyen");
    expect(pet.sex).toBe("female");
    expect(pet.weightGrams).toBe(3500);
  });

  it("Nama/species kosong ditolak", async () => {
    await expect(
      withActor(USER.STAFF_A, (tx) =>
        createPet(tx, {
          customerId: CUSTOMER_ID,
          name: "",
          species: "Kucing",
          actorId: USER.STAFF_A,
        }),
      ),
    ).rejects.toThrow(/Nama hewan wajib/);
    await expect(
      withActor(USER.STAFF_A, (tx) =>
        createPet(tx, { customerId: CUSTOMER_ID, name: "X", species: "  ", actorId: USER.STAFF_A }),
      ),
    ).rejects.toThrow(/Spesies hewan wajib/);
  });

  it("customerId tidak valid ditolak (pelanggan tidak ada)", async () => {
    await expect(
      withActor(USER.STAFF_A, (tx) =>
        createPet(tx, {
          customerId: "40000000-0000-4000-8000-00000000dead",
          name: "Anjing",
          species: "Anjing",
          actorId: USER.STAFF_A,
        }),
      ),
    ).rejects.toThrow(/Pelanggan tidak ditemukan/);
  });

  it("listPetsByCustomer mengembalikan hewan milik pelanggan", async () => {
    const customer = await withActor(USER.STAFF_A, (tx) =>
      createCustomer(tx, { fullName: "Doni", actorId: USER.STAFF_A }),
    );
    await withActor(USER.STAFF_A, (tx) =>
      createPet(tx, {
        customerId: customer.id,
        name: "Anjing A",
        species: "Anjing",
        actorId: USER.STAFF_A,
      }),
    );
    await withActor(USER.STAFF_A, (tx) =>
      createPet(tx, {
        customerId: customer.id,
        name: "Anjing B",
        species: "Anjing",
        actorId: USER.STAFF_A,
      }),
    );
    const pets = await withActor(USER.STAFF_A, (tx) => listPetsByCustomer(tx, customer.id));
    expect(pets.length).toBe(2);
    expect(pets.map((p) => p.name).sort()).toEqual(["Anjing A", "Anjing B"]);
  });

  it("updatePet mengubah berat & catatan", async () => {
    const customer = await withActor(USER.STAFF_A, (tx) =>
      createCustomer(tx, { fullName: "Euis", actorId: USER.STAFF_A }),
    );
    const pet = await withActor(USER.STAFF_A, (tx) =>
      createPet(tx, {
        customerId: customer.id,
        name: "Oyen",
        species: "Kucing",
        actorId: USER.STAFF_A,
      }),
    );
    const updated = await withActor(USER.STAFF_A, (tx) =>
      updatePet(tx, pet.id, { weightGrams: 4200, notes: "Vaksin lengkap" }),
    );
    expect(updated!.weightGrams).toBe(4200);
    expect(updated!.notes).toBe("Vaksin lengkap");
    expect(updated!.name).toBe("Oyen"); // tidak berubah
  });

  it("getPet mengembalikan null untuk id tidak ada", async () => {
    const pet = await withActor(USER.STAFF_A, (tx) =>
      getPet(tx, "40000000-0000-4000-8000-00000000dead"),
    );
    expect(pet).toBeNull();
  });
});
