/**
 * Harness & tes RLS/DB PETORA (BR-001, BR-002, BR-003).
 *
 * Menjalankan Postgres (Docker), mem-shim auth.uid() seperti Supabase, menerapkan
 * migrasi, lalu memverifikasi isolasi cabang & hak akses DI LEVEL DATABASE (bukan UI).
 *
 * Dijalankan via: pnpm test:db
 * Membutuhkan Docker. Tidak memerlukan akun Supabase.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION = join(__dirname, "..", "migrations", "0001_init.sql");

const CONTAINER = "petora-test-pg";
const IMAGE = "postgres:16-alpine";
const PORT = 55432;
const PASSWORD = "petora";
const DB = "petora";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;
function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  \u2713 ${name}`);
  } else {
    failed++;
    console.error(`  \u2717 ${name}${detail ? " :: " + detail : ""}`);
  }
}

function dockerAvailable() {
  try {
    execSync("docker ps", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function startContainer() {
  execSync(`docker rm -f ${CONTAINER}`, { stdio: "ignore" });
  execSync(
    `docker run -d --name ${CONTAINER} -e POSTGRES_PASSWORD=${PASSWORD} -e POSTGRES_DB=${DB} -p ${PORT}:5432 ${IMAGE}`,
    { stdio: "ignore" },
  );
}

function waitForReady(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  return (async () => {
    while (Date.now() < deadline) {
      try {
        execSync(`docker exec ${CONTAINER} pg_isready -U postgres`, { stdio: "ignore" });
        return;
      } catch {
        await sleep(500);
      }
    }
    throw new Error("Postgres tidak siap sebelum timeout");
  })();
}

function stopContainer() {
  try {
    execSync(`docker rm -f ${CONTAINER}`, { stdio: "ignore" });
  } catch {
    /* abaikan */
  }
}

async function main() {
  if (!dockerAvailable()) {
    console.error("Docker tidak tersedia. Jalankan `pnpm test:db` di lingkungan dengan Docker.");
    process.exit(2);
  }

  startContainer();
  await waitForReady();

  const client = new pg.Client({
    host: "127.0.0.1",
    port: PORT,
    user: "postgres",
    password: PASSWORD,
    database: DB,
  });
  await client.connect();

  try {
    // --- Shim auth.uid() seperti Supabase + role authenticated ---
    await client.query(`
      create schema if not exists auth;
      create or replace function auth.uid() returns uuid
      language sql stable as $$
        select nullif(current_setting('app.user_id', true), '')::uuid
      $$;
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then
          create role authenticated;
        end if;
      end $$;
    `);

    // --- Terapkan migrasi ---
    await client.query(readFileSync(MIGRATION, "utf8"));

    // --- Grant: authenticated butuh privilege tabel (RLS tetap berlaku) ---
    await client.query(`
      grant usage on schema public to authenticated;
      grant select, insert, update, delete on all tables in schema public to authenticated;
      grant usage, select on all sequences in schema public to authenticated;
      grant execute on function auth.uid() to authenticated;
    `);

    // ================= SEED (sebagai postgres, bypass RLS) =================
    const companyId = (
      await client.query(`insert into company (name) values ('PT Satwa Sehat') returning id`)
    ).rows[0].id;

    const tz = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"];
    const branchIds = {};
    for (const [i, zone] of tz.entries()) {
      const r = await client.query(
        `insert into branch (company_id, name, timezone) values ($1, $2, $3) returning id`,
        [companyId, `Cabang ${i + 1}`, zone],
      );
      branchIds[`B${i + 1}`] = r.rows[0].id;
    }

    async function makeUser(uuid, name, { owner = false, roleCode = "staff", branches = [] } = {}) {
      await client.query(`insert into profiles (id, full_name, is_owner) values ($1,$2,$3)`, [
        uuid,
        name,
        owner,
      ]);
      const roleId = (await client.query(`select id from role where code = $1`, [roleCode])).rows[0]
        .id;
      await client.query(`insert into user_role (user_id, role_id) values ($1,$2)`, [uuid, roleId]);
      for (const b of branches) {
        await client.query(`insert into branch_members (user_id, branch_id) values ($1,$2)`, [
          uuid,
          branchIds[b],
        ]);
      }
    }

    const OWNER_ID = "10000000-0000-0000-0000-000000000001";
    const STAFF_A = "10000000-0000-0000-0000-00000000000a";
    const VET_A = "10000000-0000-0000-0000-00000000000b";
    const STAFF_B = "10000000-0000-0000-0000-00000000000c";
    const VET_B = "10000000-0000-0000-0000-00000000000d";
    const VET_NO_READ = "10000000-0000-0000-0000-00000000000e";

    await makeUser(OWNER_ID, "Owner", {
      owner: true,
      roleCode: "owner",
      branches: ["B1", "B2", "B3"],
    });
    await makeUser(STAFF_A, "Staff A", { roleCode: "staff", branches: ["B1"] });
    await makeUser(VET_A, "Dokter A", { roleCode: "vet", branches: ["B1"] });
    await makeUser(STAFF_B, "Staff B", { roleCode: "staff", branches: ["B2"] });
    await makeUser(VET_B, "Dokter B", { roleCode: "vet", branches: ["B2"] });
    await makeUser(VET_NO_READ, "Dokter X", { roleCode: "vet", branches: ["B1"] });
    // Cabut medical.read dari VET_NO_READ (override) untuk menguji BR-003 pengecualian.
    await client.query(
      `insert into user_permission (user_id, permission_id, granted)
       values ($1, (select id from permission where code='medical.read'), false)
       on conflict (user_id, permission_id) do update set granted = excluded.granted`,
      [VET_NO_READ],
    );

    const cust = (
      await client.query(
        `insert into customer (full_name, phone) values ('Budi Santoso','08123456789') returning id`,
      )
    ).rows[0].id;
    const pet = (
      await client.query(
        `insert into pet (customer_id, name, species, sex) values ($1,'Milo','canine','male') returning id`,
        [cust],
      )
    ).rows[0].id;

    const visitA = (
      await client.query(
        `insert into visit (branch_id, customer_id, pet_id, status, queue_number, registered_by)
       values ($1,$2,$3,'menunggu',1,$4) returning id`,
        [branchIds.B1, cust, pet, STAFF_A],
      )
    ).rows[0].id;
    const visitB = (
      await client.query(
        `insert into visit (branch_id, customer_id, pet_id, status, queue_number, registered_by)
       values ($1,$2,$3,'menunggu',1,$4) returning id`,
        [branchIds.B2, cust, pet, STAFF_B],
      )
    ).rows[0].id;

    // Rekam medis dari cabang A (ditulis Dokter A).
    const medA = (
      await client.query(
        `insert into medical_record (visit_id, branch_id, pet_id, author_id, status, diagnosis)
       values ($1,$2,$3,$4,'final','Gastritis') returning id`,
        [visitA, branchIds.B1, pet, VET_A],
      )
    ).rows[0].id;

    // ================= UJI RLS (sebagai authenticated) =================
    await client.query(`set role authenticated`);

    async function actingAs(uuid) {
      await client.query(`select set_config('app.user_id', $1, false)`, [uuid]);
    }
    async function rows(sql, params = []) {
      return (await client.query(sql, params)).rows;
    }

    console.log("\nBR-001 Isolasi cabang (data operasional per cabang):");

    await actingAs(STAFF_A);
    let v = await rows(`select id from visit`);
    check(
      "Staff A melihat hanya kunjungan cabang A",
      v.length === 1 && v[0].id === visitA,
      `dapat ${v.length} baris`,
    );
    v = await rows(`select id from visit where id = $1`, [visitB]);
    check("Staff A TIDAK melihat kunjungan cabang B", v.length === 0);

    await actingAs(STAFF_B);
    v = await rows(`select id from visit`);
    check(
      "Staff B melihat hanya kunjungan cabang B",
      v.length === 1 && v[0].id === visitB,
      `dapat ${v.length} baris`,
    );

    await actingAs(OWNER_ID);
    v = await rows(`select id from visit`);
    check("Owner melihat semua cabang", v.length === 2, `dapat ${v.length} baris`);

    console.log("\nBR-001/BR-002 Penulisan lintas cabang ditolak (RLS):");
    await actingAs(STAFF_A);
    let rejected = false;
    try {
      await client.query(
        `insert into visit (branch_id, customer_id, pet_id, status) values ($1,$2,$3,'terdaftar')`,
        [branchIds.B2, cust, pet],
      );
    } catch {
      rejected = true;
    }
    check("Staff A tidak bisa membuat kunjungan di cabang B (WITH CHECK gagal)", rejected);

    console.log("\nBR-003 Riwayat medis terpusat lintas cabang:");
    await actingAs(VET_B);
    v = await rows(`select id from medical_record`);
    check(
      "Dokter B (punya medical.read) melihat rekam medis dari cabang A",
      v.length === 1 && v[0].id === medA,
      `dapat ${v.length}`,
    );

    await actingAs(VET_NO_READ);
    v = await rows(`select id from medical_record`);
    check(
      "Pengguna tanpa permission medis TIDAK melihat rekam medis",
      v.length === 0,
      `dapat ${v.length}`,
    );

    console.log("\nBR-004 Rekam medis: hanya penulis, draft, final terkunci:");
    await actingAs(VET_A);
    // Dokter A boleh insert draft miliknya di cabang A.
    let insertedId;
    try {
      const r = await client.query(
        `insert into medical_record (branch_id, pet_id, author_id, status, diagnosis)
         values ($1,$2,$3,'draft','Aamnesis') returning id`,
        [branchIds.B1, pet, VET_A],
      );
      insertedId = r.rows[0].id;
      check("Dokter A bisa menulis draft di cabangnya", true);
    } catch (e) {
      check("Dokter A bisa menulis draft di cabangnya", false, String(e));
    }
    // Tidak bisa menulis atas nama dokter lain.
    rejected = false;
    try {
      await client.query(
        `insert into medical_record (branch_id, pet_id, author_id, status)
         values ($1,$2,$3,'draft')`,
        [branchIds.B1, pet, VET_B],
      );
    } catch {
      rejected = true;
    }
    check("Tidak bisa membuat entri atas nama dokter lain", rejected);

    // Finalkan entri (sebagai pemilik via postgres), lalu coba update -> harus gagal.
    await client.query(`reset role`);
    await client.query(`update medical_record set status='final', finalized_at=now() where id=$1`, [
      insertedId,
    ]);
    await client.query(`set role authenticated`);
    await actingAs(VET_A);
    let lockedOk = false;
    try {
      // USING clause menuntut status='draft'; baris final tidak cocok -> 0 baris berubah.
      const upd = await client.query(`update medical_record set diagnosis='X' where id=$1`, [
        insertedId,
      ]);
      lockedOk = upd.rowCount === 0;
      // Verifikasi nilai tidak berubah.
      await client.query(`reset role`);
      const after = (
        await client.query(`select diagnosis from medical_record where id=$1`, [insertedId])
      ).rows[0];
      lockedOk = lockedOk && after.diagnosis !== "X";
      await client.query(`set role authenticated`);
    } catch {
      lockedOk = true;
    }
    check("Entri final terkunci terhadap perubahan (BR-004)", lockedOk);

    console.log("\nBR-002 Akses berbasis permission ( Owner vs non-owner ke perusahaan):");
    await actingAs(STAFF_A);
    v = await rows(`select id from company`);
    check("Staf tidak melihat data perusahaan", v.length === 0, `dapat ${v.length}`);
    await actingAs(OWNER_ID);
    v = await rows(`select id from company`);
    check("Owner melihat data perusahaan", v.length === 1);
  } finally {
    await client.end();
    stopContainer();
  }

  console.log(`\nHasil DB/RLS: ${passed} lulus, ${failed} gagal.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  stopContainer();
  process.exit(1);
});
