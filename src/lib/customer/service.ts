/**
 * Pelanggan (BR-003) — service.
 *
 * Dijalankan di dalam `withActor` (RLS aktif). Pelanggan bersifat terpusat
 * lintas cabang (lihat migrasi 0001: policy customer_read/write memakai
 * is_staff(), tanpa pembatasan cabang). Nama wajib diisi & di-trim.
 */
import type { PoolClient } from "@/lib/db";

export interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: Date;
}

type CustomerRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: Date;
};

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    createdAt: row.created_at,
  };
}

/** Daftar pelanggan (RLS sudah membatasi). Pencarian opsional atas nama/telepon. */
export async function listCustomers(
  tx: PoolClient,
  opts: { search?: string; limit?: number } = {},
): Promise<Customer[]> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (opts.search && opts.search.trim()) {
    params.push(`%${opts.search.trim()}%`);
    const p = `$${params.length}`;
    where.push(`(full_name ilike ${p} or phone ilike ${p})`);
  }
  if (opts.limit) {
    params.push(opts.limit);
    where.push(`true`);
  }
  const whereSql = where.length ? `where ${where.join(" and ")}` : "";
  const limitSql = opts.limit ? `limit $${params.length}` : "";
  const res = await tx.query<CustomerRow>(
    `select id, full_name, phone, email, address, created_at
       from customer ${whereSql} order by created_at desc ${limitSql}`,
    params,
  );
  return res.rows.map(toCustomer);
}

/** Ambil satu pelanggan by id (yang terlihat oleh RLS). */
export async function getCustomer(tx: PoolClient, id: string): Promise<Customer | null> {
  const res = await tx.query<CustomerRow>(
    `select id, full_name, phone, email, address, created_at from customer where id = $1`,
    [id],
  );
  return res.rows[0] ? toCustomer(res.rows[0]) : null;
}

export interface CreateCustomerInput {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  actorId: string;
}

/** Buat pelanggan baru. Nama wajib & di-trim. */
export async function createCustomer(
  tx: PoolClient,
  input: CreateCustomerInput,
): Promise<Customer> {
  const fullName = input.fullName?.trim() ?? "";
  if (!fullName) throw new Error("Nama pelanggan wajib diisi");
  const res = await tx.query<CustomerRow>(
    `insert into customer (full_name, phone, email, address, created_by)
     values ($1,$2,$3,$4,$5)
     returning id, full_name, phone, email, address, created_at`,
    [
      fullName,
      input.phone?.trim() || null,
      input.email?.trim() || null,
      input.address?.trim() || null,
      input.actorId,
    ],
  );
  return toCustomer(res.rows[0]);
}

export interface UpdateCustomerInput {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

/** Ubah pelanggan. Hanya field yang diberikan yang diubah. */
export async function updateCustomer(
  tx: PoolClient,
  id: string,
  input: UpdateCustomerInput,
): Promise<Customer | null> {
  const current = await getCustomer(tx, id);
  if (!current) return null;

  const fullName = input.fullName !== undefined ? input.fullName.trim() : current.fullName;
  if (!fullName) throw new Error("Nama pelanggan wajib diisi");
  const phone = input.phone !== undefined ? input.phone?.trim() || null : current.phone;
  const email = input.email !== undefined ? input.email?.trim() || null : current.email;
  const address = input.address !== undefined ? input.address?.trim() || null : current.address;

  const res = await tx.query<CustomerRow>(
    `update customer set full_name = $1, phone = $2, email = $3, address = $4 where id = $5
       returning id, full_name, phone, email, address, created_at`,
    [fullName, phone, email, address, id],
  );
  // RLS UPDATE yang tidak mengubah apa pun (0 baris) -> null.
  return res.rows[0] ? toCustomer(res.rows[0]) : null;
}
