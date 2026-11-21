/**
 * Tes RLS/DB (BR-001, BR-002, BR-003, BR-004) — dijalankan sebagai `authenticated`
 * terhadap Postgres nyata. Membuktikan isolasi cabang & hak akses di level database.
 */
import { describe, it, expect } from "vitest";
import { withActor } from "@/lib/db";
import { USER, BRANCH, CUSTOMER_ID, PET_ID } from "./fixtures";

type Row = Record<string, unknown>;

describe("BR-001 Isolasi cabang (data operasional per cabang)", () => {
  it("Staff A hanya melihat kunjungan cabang A", async () => {
    // Buat satu kunjungan di B1 (sebagai admin via pemilik), lalu uji sebagai Staff A.
    await withActor(USER.OWNER, async (tx) => {
      await tx.query(
        `insert into visit (branch_id, customer_id, pet_id, status, queue_number, registered_by)
         values ($1,$2,$3,'menunggu',1,$4)`,
        [BRANCH.B1, CUSTOMER_ID, PET_ID, USER.STAFF_A],
      );
    });
    const rows = await withActor(USER.STAFF_A, async (tx) => {
      const r = await tx.query<Row>(`select id, branch_id from visit`);
      return r.rows;
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.every((v) => v.branch_id === BRANCH.B1)).toBe(true);
  });

  it("Staff A tidak bisa membuat kunjungan di cabang B (WITH CHECK gagal)", async () => {
    await expect(
      withActor(USER.STAFF_A, async (tx) => {
        await tx.query(
          `insert into visit (branch_id, customer_id, pet_id, status) values ($1,$2,$3,'terdaftar')`,
          [BRANCH.B2, CUSTOMER_ID, PET_ID],
        );
      }),
    ).rejects.toBeTruthy();
  });

  it("Owner melihat semua cabang", async () => {
    const rows = await withActor(USER.OWNER, async (tx) => {
      const r = await tx.query<Row>(`select distinct branch_id from visit`);
      return r.rows;
    });
    const branchSet = new Set(rows.map((v) => v.branch_id));
    expect(branchSet.has(BRANCH.B1)).toBe(true);
  });
});

describe("BR-002 Akses berbasis permission", () => {
  it("Staf tidak melihat data perusahaan", async () => {
    const rows = await withActor(USER.STAFF_A, async (tx) => {
      const r = await tx.query<Row>(`select id from company`);
      return r.rows;
    });
    expect(rows.length).toBe(0);
  });

  it("Owner melihat data perusahaan", async () => {
    const rows = await withActor(USER.OWNER, async (tx) => {
      const r = await tx.query<Row>(`select id from company`);
      return r.rows;
    });
    expect(rows.length).toBe(1);
  });
});

describe("BR-003 Riwayat medis terpusat lintas cabang", () => {
  it("Dokter B (punya medical.read) melihat rekam medis dari cabang A", async () => {
    // Tulis draft di cabang A sebagai Dokter A, lalu finalkan via admin.
    await withActor(USER.VET_A, async (tx) => {
      const v = await tx.query<{ id: string }>(
        `insert into visit (branch_id, customer_id, pet_id, status) values ($1,$2,$3,'selesai') returning id`,
        [BRANCH.B1, CUSTOMER_ID, PET_ID],
      );
      await tx.query(
        `insert into medical_record (visit_id, branch_id, pet_id, author_id, status, diagnosis)
         values ($1,$2,$3,$4,'draft','Gastritis')`,
        [v.rows[0].id, BRANCH.B1, PET_ID, USER.VET_A],
      );
    });
    const { adminQuery } = await import("@/lib/db");
    await adminQuery(`update medical_record set status='final' where diagnosis='Gastritis'`);
    const rows = await withActor(USER.VET_B, async (tx) => {
      const r = await tx.query<Row>(`select id, branch_id from medical_record`);
      return r.rows;
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.every((m) => m.branch_id === BRANCH.B1)).toBe(true);
  });

  it("Pengguna tanpa permission medis TIDAK melihat rekam medis", async () => {
    const rows = await withActor(USER.VET_NO_READ, async (tx) => {
      const r = await tx.query<Row>(`select id from medical_record`);
      return r.rows;
    });
    expect(rows.length).toBe(0);
  });
});

describe("BR-004 Rekam medis: hanya penulis, draft, final terkunci", () => {
  it("Tidak bisa membuat entri atas nama dokter lain", async () => {
    await expect(
      withActor(USER.VET_A, async (tx) => {
        await tx.query(
          `insert into medical_record (branch_id, pet_id, author_id, status)
           values ($1,$2,$3,'draft')`,
          [BRANCH.B1, PET_ID, USER.VET_B],
        );
      }),
    ).rejects.toBeTruthy();
  });

  it("Entri final terkunci terhadap perubahan (0 baris berubah)", async () => {
    // Buat draft lalu finalkan sebagai Dokter A (via admin untuk finalize).
    let id = "";
    await withActor(USER.VET_A, async (tx) => {
      const r = await tx.query<{ id: string }>(
        `insert into medical_record (branch_id, pet_id, author_id, status, diagnosis)
         values ($1,$2,$3,'draft','Awal') returning id`,
        [BRANCH.B1, PET_ID, USER.VET_A],
      );
      id = r.rows[0].id;
    });
    // Finalize sebagai admin.
    const { adminQuery } = await import("@/lib/db");
    await adminQuery(`update medical_record set status='final', finalized_at=now() where id=$1`, [
      id,
    ]);
    // Dokter A mencoba update -> 0 baris (USING menuntut draft).
    const upd = await withActor(USER.VET_A, async (tx) => {
      const r = await tx.query(`update medical_record set diagnosis='X' where id=$1`, [id]);
      return r.rowCount;
    });
    expect(upd).toBe(0);
    const after = await adminQuery<{ diagnosis: string }>(
      `select diagnosis from medical_record where id=$1`,
      [id],
    );
    expect(after[0].diagnosis).toBe("Awal");
  });
});
