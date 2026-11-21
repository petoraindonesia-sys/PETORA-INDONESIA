/**
 * globalSetup Vitest untuk tes integrasi DB.
 *
 * Menyalakan Postgres (Docker) sekali untuk seluruh berkas .itest.ts, menerapkan
 * migrasi 0001 + 0002, mem-shim auth.uid() & role authenticated (seperti Supabase),
 * lalu mengisi data fixture. Container dihentikan saat selesai.
 *
 * Bila DATABASE_URL sudah diset (mis. CI dengan Postgres yang sudah jalan),
 * setup memakai DB itu & tidak menyalakan Docker.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { TEST_DB, COMPANY_ID, BRANCH, USER, CUSTOMER_ID, PET_ID } from "./fixtures";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = [
  join(__dirname, "..", "migrations", "0001_init.sql"),
  join(__dirname, "..", "migrations", "0002_billing_inventory.sql"),
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function dockerAvailable(): boolean {
  try {
    execSync("docker ps", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export default async function setup() {
  const useExternal = !!process.env.DATABASE_URL;

  if (!useExternal) {
    if (!dockerAvailable()) {
      throw new Error(
        "Docker tidak tersedia & DATABASE_URL tidak diset. `pnpm test:db` butuh Docker.",
      );
    }
    execSync(`docker rm -f ${TEST_DB.container}`, { stdio: "ignore" });
    execSync(
      `docker run -d --name ${TEST_DB.container} -e POSTGRES_PASSWORD=${TEST_DB.password} -e POSTGRES_DB=${TEST_DB.database} -p ${TEST_DB.port}:5432 ${TEST_DB.image}`,
      { stdio: "ignore" },
    );
    const deadline = Date.now() + 60000;
    for (;;) {
      try {
        execSync(`docker exec ${TEST_DB.container} pg_isready -U postgres`, { stdio: "ignore" });
        break;
      } catch {
        if (Date.now() > deadline) throw new Error("Postgres tidak siap sebelum timeout");
        await sleep(500);
      }
    }
    process.env.DATABASE_URL = TEST_DB.connectionString;
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  try {
    // Shim auth.uid() + role authenticated (idempoten).
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

    // Terapkan migrasi.
    for (const m of MIGRATIONS) {
      await client.query(readFileSync(m, "utf8"));
    }

    // Grant (RLS tetap berlaku).
    await client.query(`
      grant usage on schema public to authenticated;
      grant select, insert, update, delete on all tables in schema public to authenticated;
      grant usage, select on all sequences in schema public to authenticated;
      grant execute on function auth.uid() to authenticated;
    `);

    // Seed fixture (sebagai postgres, bypass RLS).
    await client.query(`insert into company (id, name) values ($1,'PT Satwa Sehat')`, [COMPANY_ID]);
    await client.query(
      `insert into branch (id, company_id, name, timezone) values
        ($1,$2,'Cabang Jakarta','Asia/Jakarta'),
        ($3,$2,'Cabang Makassar','Asia/Makassar'),
        ($4,$2,'Cabang Jayapura','Asia/Jayapura')`,
      [BRANCH.B1, COMPANY_ID, BRANCH.B2, BRANCH.B3],
    );

    async function makeUser(
      id: string,
      name: string,
      opts: { owner?: boolean; roleCode: string; branches: string[] },
    ) {
      await client.query(`insert into profiles (id, full_name, is_owner) values ($1,$2,$3)`, [
        id,
        name,
        opts.owner ?? false,
      ]);
      const roleId = (
        await client.query<{ id: string }>(`select id from role where code = $1`, [opts.roleCode])
      ).rows[0].id;
      await client.query(`insert into user_role (user_id, role_id) values ($1,$2)`, [id, roleId]);
      for (const b of opts.branches) {
        await client.query(`insert into branch_members (user_id, branch_id) values ($1,$2)`, [
          id,
          b,
        ]);
      }
    }

    await makeUser(USER.OWNER, "Owner", {
      owner: true,
      roleCode: "owner",
      branches: [BRANCH.B1, BRANCH.B2, BRANCH.B3],
    });
    await makeUser(USER.STAFF_A, "Staff A", { roleCode: "staff", branches: [BRANCH.B1] });
    await makeUser(USER.VET_A, "Dokter A", { roleCode: "vet", branches: [BRANCH.B1] });
    await makeUser(USER.STAFF_B, "Staff B", { roleCode: "staff", branches: [BRANCH.B2] });
    await makeUser(USER.VET_B, "Dokter B", { roleCode: "vet", branches: [BRANCH.B2] });
    await makeUser(USER.VET_NO_READ, "Dokter X", { roleCode: "vet", branches: [BRANCH.B1] });
    await makeUser(USER.SUPERVISOR_A, "Supervisor A", {
      roleCode: "supervisor",
      branches: [BRANCH.B1],
    });

    // Override: cabut medical.read dari VET_NO_READ (uji BR-003 pengecualian).
    await client.query(
      `insert into user_permission (user_id, permission_id, granted)
       values ($1, (select id from permission where code='medical.read'), false)
       on conflict (user_id, permission_id) do update set granted = excluded.granted`,
      [USER.VET_NO_READ],
    );

    await client.query(
      `insert into customer (id, full_name, phone) values ($1,'Budi Santoso','08123456789')`,
      [CUSTOMER_ID],
    );
    await client.query(
      `insert into pet (id, customer_id, name, species, sex) values ($1,$2,'Milo','canine','male')`,
      [PET_ID, CUSTOMER_ID],
    );

    // Produk contoh.
    await client.query(
      `insert into product (id, sku, name, kind, price, taxable) values
        ('50000000-0000-4000-8000-000000000001','JAS-KONS','Konsultasi',    'service', 75000,  true),
        ('50000000-0000-4000-8000-000000000002','VAK-Rabies','Vaksin Rabies','service',150000,  true),
        ('50000000-0000-4000-8000-000000000003','OBT-001','Obat Antipiretik','product',22350,  true)`,
    );
  } finally {
    await client.end();
  }

  return async () => {
    if (!useExternal) {
      try {
        execSync(`docker rm -f ${TEST_DB.container}`, { stdio: "ignore" });
      } catch {
        /* abaikan */
      }
    }
  };
}
