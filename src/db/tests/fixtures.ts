/**
 * Fixture bersama untuk tes integrasi (dipakai globalSetup & berkas .itest.ts).
 * UUID tetap agar dapat dipanggil lintas proses (setup menyiapkan DB, tes memakainya).
 */

export const COMPANY_ID = "10000000-0000-4000-8000-0000000000c0";

export const BRANCH = {
  B1: "20000000-0000-4000-8000-0000000000b1", // Asia/Jakarta (WIB)
  B2: "20000000-0000-4000-8000-0000000000b2", // Asia/Makassar (WITA)
  B3: "20000000-0000-4000-8000-0000000000b3", // Asia/Jayapura (WIT)
} as const;

export const USER = {
  OWNER: "30000000-0000-4000-8000-000000000001",
  STAFF_A: "30000000-0000-4000-8000-00000000000a",
  VET_A: "30000000-0000-4000-8000-00000000000b",
  STAFF_B: "30000000-0000-4000-8000-00000000000c",
  VET_B: "30000000-0000-4000-8000-00000000000d",
  VET_NO_READ: "30000000-0000-4000-8000-00000000000e",
  SUPERVISOR_A: "30000000-0000-4000-8000-00000000000f",
} as const;

export const CUSTOMER_ID = "40000000-0000-4000-8000-000000000001";
export const PET_ID = "40000000-0000-4000-8000-000000000002";

/** Kredensial container tes (dipakai globalSetup & getPool default). */
export const TEST_DB = {
  container: "petora-test-pg",
  image: "postgres:16-alpine",
  port: 55432,
  password: "petora",
  database: "petora",
  connectionString: "postgres://postgres:petora@127.0.0.1:55432/petora",
} as const;
