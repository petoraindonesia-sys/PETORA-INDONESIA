/**
 * Organisasi & cabang (BR-001, BR-016) — service.
 *
 * Dijalankan di dalam `withActor` (RLS aktif). Owner dapat membuat/mengubah cabang;
 * staf hanya melihat cabang yang ditugaskan (RLS SELECT). Zona waktu divalidasi
 * terhadap daftar yang diizinkan (BR-016: WIB/WITA/WIT).
 */
import type { PoolClient } from "@/lib/db";

export const TIMEZONES = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;
export type Timezone = (typeof TIMEZONES)[number];

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  address: string | null;
  timezone: Timezone;
  isActive: boolean;
  createdAt: Date;
}

export function assertTimezone(tz: string): Timezone {
  if (!TIMEZONES.includes(tz as Timezone)) {
    throw new RangeError(
      `Zona waktu tidak valid: ${tz}. Gunakan salah satu: ${TIMEZONES.join(", ")}`,
    );
  }
  return tz as Timezone;
}

function toBranch(row: {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  timezone: string;
  is_active: boolean;
  created_at: Date;
}): Branch {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    address: row.address,
    timezone: assertTimezone(row.timezone),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

/** Daftar cabang yang terlihat oleh aktor (RLS sudah membatasi). */
export async function listBranches(
  tx: PoolClient,
  opts: { includeInactive?: boolean } = {},
): Promise<Branch[]> {
  const where = opts.includeInactive ? "" : "where is_active = true";
  const res = await tx.query<Parameters<typeof toBranch>[0]>(
    `select id, company_id, name, address, timezone, is_active, created_at
       from branch ${where} order by created_at asc`,
  );
  return res.rows.map(toBranch);
}

/** Ambil satu cabang by id (yang terlihat oleh RLS). */
export async function getBranch(tx: PoolClient, id: string): Promise<Branch | null> {
  const res = await tx.query<Parameters<typeof toBranch>[0]>(
    `select id, company_id, name, address, timezone, is_active, created_at from branch where id = $1`,
    [id],
  );
  return res.rows[0] ? toBranch(res.rows[0]) : null;
}

export interface CreateBranchInput {
  companyId: string;
  name: string;
  address?: string | null;
  timezone: string;
  actorId: string;
}

/** Buat cabang baru (BR-016: zona waktu wajib valid). */
export async function createBranch(tx: PoolClient, input: CreateBranchInput): Promise<Branch> {
  const tz = assertTimezone(input.timezone);
  const name = input.name.trim();
  if (!name) throw new Error("Nama cabang wajib diisi");
  const res = await tx.query<Parameters<typeof toBranch>[0]>(
    `insert into branch (company_id, name, address, timezone)
     values ($1,$2,$3,$4) returning id, company_id, name, address, timezone, is_active, created_at`,
    [input.companyId, name, input.address ?? null, tz],
  );
  return toBranch(res.rows[0]);
}

export interface UpdateBranchInput {
  name?: string;
  address?: string | null;
  timezone?: string;
}

/** Ubah cabang (nama/alamat/zona waktu). Hanya field yang diberikan yang diubah. */
export async function updateBranch(
  tx: PoolClient,
  id: string,
  input: UpdateBranchInput,
): Promise<Branch | null> {
  const current = await getBranch(tx, id);
  if (!current) return null;

  const name = input.name !== undefined ? input.name.trim() : current.name;
  if (!name) throw new Error("Nama cabang wajib diisi");
  const address = input.address !== undefined ? input.address : current.address;
  const timezone = input.timezone !== undefined ? assertTimezone(input.timezone) : current.timezone;

  const res = await tx.query<Parameters<typeof toBranch>[0]>(
    `update branch set name = $1, address = $2, timezone = $3 where id = $4
       returning id, company_id, name, address, timezone, is_active, created_at`,
    [name, address, timezone, id],
  );
  // RLS UPDATE yang tidak mengubah apa pun (0 baris) -> kembalikan null.
  return res.rows[0] ? toBranch(res.rows[0]) : null;
}

/** Nonaktifkan cabang (soft, tidak dihapus — jejak integritas). */
export async function deactivateBranch(tx: PoolClient, id: string): Promise<Branch | null> {
  const res = await tx.query<Parameters<typeof toBranch>[0]>(
    `update branch set is_active = false where id = $1
       returning id, company_id, name, address, timezone, is_active, created_at`,
    [id],
  );
  return res.rows[0] ? toBranch(res.rows[0]) : null;
}

/** Daftar zona waktu yang diizinkan (untuk UI). */
export function allowedTimezones(): readonly Timezone[] {
  return TIMEZONES;
}
