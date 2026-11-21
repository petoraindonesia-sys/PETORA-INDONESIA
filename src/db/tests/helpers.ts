/**
 * Helper tes integrasi: bungkus operasi "sebagai pengguna" (RLS aktif) & query admin.
 */
import { getPool, withActor, adminQuery } from "@/lib/db";
import type { PoolClient } from "@/lib/db";

/** Jalankan transaksi sebagai pengguna (RLS) dan kembalikan hasilnya. */
export function as<T>(userId: string, fn: (tx: PoolClient) => Promise<T>): Promise<T> {
  return withActor<T>(userId, fn);
}

/** Alias `as` — beberapa operasi dalam satu transaksi (atomik). */
export function asTx<T>(userId: string, fn: (tx: PoolClient) => Promise<T>): Promise<T> {
  return withActor<T>(userId, fn);
}

/** Query sebagai admin (bypass RLS) — untuk assert & verifikasi. */
export function admin<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return adminQuery<T>(sql, params);
}

export { getPool };
