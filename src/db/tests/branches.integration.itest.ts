/**
 * Tes integrasi service cabang (BR-001, BR-016) — RLS membatasi Owner.
 */
import { describe, it, expect } from "vitest";
import { withActor } from "@/lib/db";
import {
  listBranches,
  createBranch,
  updateBranch,
  deactivateBranch,
  getBranch,
  assertTimezone,
} from "@/lib/branches/service";
import { USER, BRANCH, COMPANY_ID } from "./fixtures";

describe("Cabang - validasi zona waktu (BR-016)", () => {
  it("assertTimezone menerima tiga zona yang diizinkan", () => {
    expect(assertTimezone("Asia/Jakarta")).toBe("Asia/Jakarta");
    expect(assertTimezone("Asia/Makassar")).toBe("Asia/Makassar");
    expect(assertTimezone("Asia/Jayapura")).toBe("Asia/Jayapura");
  });

  it("assertTimezone menolak zona tidak valid", () => {
    expect(() => assertTimezone("Asia/Tokyo")).toThrow(RangeError);
    expect(() => assertTimezone("UTC")).toThrow(RangeError);
  });
});

describe("Cabang - Owner dapat CRUD (RLS)", () => {
  it("Owner membuat cabang baru", async () => {
    const branch = await withActor(USER.OWNER, (tx) =>
      createBranch(tx, {
        companyId: COMPANY_ID,
        name: "Cabang Denpasar",
        address: "Jl. Sudirman 10",
        timezone: "Asia/Makassar",
        actorId: USER.OWNER,
      }),
    );
    expect(branch.name).toBe("Cabang Denpasar");
    expect(branch.timezone).toBe("Asia/Makassar");
    expect(branch.isActive).toBe(true);

    // Terlihat di daftar.
    const all = await withActor(USER.OWNER, (tx) => listBranches(tx));
    expect(all.some((b) => b.id === branch.id)).toBe(true);
  });

  it("Owner memperbarui cabang (nama + zona waktu)", async () => {
    const branch = await withActor(USER.OWNER, (tx) =>
      createBranch(tx, {
        companyId: COMPANY_ID,
        name: "Cabang A",
        timezone: "Asia/Jakarta",
        actorId: USER.OWNER,
      }),
    );
    const updated = await withActor(USER.OWNER, (tx) =>
      updateBranch(tx, branch.id, { name: "Cabang A (Pusat)", timezone: "Asia/Makassar" }),
    );
    expect(updated!.name).toBe("Cabang A (Pusat)");
    expect(updated!.timezone).toBe("Asia/Makassar");
  });

  it("Owner menonaktifkan cabang (soft delete)", async () => {
    const branch = await withActor(USER.OWNER, (tx) =>
      createBranch(tx, {
        companyId: COMPANY_ID,
        name: "Cabang B",
        timezone: "Asia/Jakarta",
        actorId: USER.OWNER,
      }),
    );
    const deactivated = await withActor(USER.OWNER, (tx) => deactivateBranch(tx, branch.id));
    expect(deactivated!.isActive).toBe(false);

    // Tidak muncul di daftar aktif, tapi masih ada (soft).
    const active = await withActor(USER.OWNER, (tx) => listBranches(tx));
    expect(active.some((b) => b.id === branch.id)).toBe(false);
    const withInactive = await withActor(USER.OWNER, (tx) =>
      listBranches(tx, { includeInactive: true }),
    );
    expect(withInactive.some((b) => b.id === branch.id)).toBe(true);
  });

  it("Owner tidak bisa membuat cabang dengan zona waktu tidak valid", async () => {
    await expect(
      withActor(USER.OWNER, (tx) =>
        createBranch(tx, {
          companyId: COMPANY_ID,
          name: "Cabang X",
          timezone: "Asia/Tokyo",
          actorId: USER.OWNER,
        }),
      ),
    ).rejects.toThrow(RangeError);
  });

  it("Owner tidak bisa membuat cabang tanpa nama", async () => {
    await expect(
      withActor(USER.OWNER, (tx) =>
        createBranch(tx, {
          companyId: COMPANY_ID,
          name: "   ",
          timezone: "Asia/Jakarta",
          actorId: USER.OWNER,
        }),
      ),
    ).rejects.toThrow(/Nama/);
  });
});

describe("Cabang - Staff tidak dapat menulis (RLS)", () => {
  it("Staff tidak bisa membuat cabang (WITH CHECK gagal)", async () => {
    await expect(
      withActor(USER.STAFF_A, (tx) =>
        createBranch(tx, {
          companyId: COMPANY_ID,
          name: "Cabang Liar",
          timezone: "Asia/Jakarta",
          actorId: USER.STAFF_A,
        }),
      ),
    ).rejects.toBeTruthy();
  });

  it("Staff tidak bisa memperbarui cabang (RLS update -> null)", async () => {
    // Cabang B1 ada; Staff A mencoba ubah -> UPDATE 0 baris (RLS owner-only) -> service null.
    const updated = await withActor(USER.STAFF_A, (tx) =>
      updateBranch(tx, BRANCH.B1, { name: "Diubah Staff" }),
    );
    expect(updated).toBeNull();
    const { adminQuery } = await import("@/lib/db");
    const row = (
      await adminQuery<{ name: string }>(`select name from branch where id=$1`, [BRANCH.B1])
    )[0];
    expect(row.name).not.toBe("Diubah Staff");
  });

  it("Staff tidak bisa menonaktifkan cabang (RLS update -> null)", async () => {
    const deactivated = await withActor(USER.STAFF_A, (tx) => deactivateBranch(tx, BRANCH.B1));
    expect(deactivated).toBeNull();
    const { adminQuery } = await import("@/lib/db");
    const row = (
      await adminQuery<{ is_active: boolean }>(`select is_active from branch where id=$1`, [
        BRANCH.B1,
      ])
    )[0];
    expect(row.is_active).toBe(true);
  });

  it("Staff dapat melihat cabang yang ditugaskan (SELECT)", async () => {
    const branches = await withActor(USER.STAFF_A, (tx) => listBranches(tx));
    // Staff A hanya cabang B1.
    expect(branches.some((b) => b.id === BRANCH.B1)).toBe(true);
    expect(branches.some((b) => b.id === BRANCH.B2)).toBe(false);
  });
});

describe("Cabang - getBranch", () => {
  it("mengembalikan null untuk id tidak ada", async () => {
    const b = await withActor(USER.OWNER, (tx) =>
      getBranch(tx, "00000000-0000-0000-0000-000000000000"),
    );
    expect(b).toBeNull();
  });
});
