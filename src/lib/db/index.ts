/**
 * Lapisan data (local-first, K-009).
 *
 * Menghubungkan ke Postgres (lokal pada pengembangan; di produksi cukup ganti
 * DATABASE_URL ke connection string Supabase). Keamanan ditegakkan oleh RLS:
 * `withActor` menjalankan sebuah transaksi sebagai peran `authenticated` dengan
 * `app.user_id` diset, sehingga auth.uid() dan seluruh policy RLS berlaku persis
 * seperti produksi. `adminQuery` memakai peran superuser (bypass RLS) hanya untuk
 * seed & tugas admin.
 */
import { Pool } from "pg";
import type { PoolClient } from "pg";

export type { PoolClient };

let pool: Pool | undefined;

/** Pool global (lazy). Default lokal-first ke container tes/dev. */
export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ?? "postgres://postgres:petora@127.0.0.1:55432/petora";
    pool = new Pool({ connectionString });
  }
  return pool;
}

/** Tutup pool (dipakai harness tes). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

/**
 * Menjalankan `fn` dalam satu transaksi sebagai `actorId` dengan RLS aktif.
 * - BEGIN; set app.user_id (local); SET LOCAL ROLE authenticated; fn; COMMIT.
 * - Rollback otomatis bila fn melempar.
 */
export async function withActor<T>(
  actorId: string,
  fn: (tx: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.user_id', $1, true)", [actorId]);
    await client.query("SET LOCAL ROLE authenticated");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* abaikan */
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Query sebagai superuser (bypass RLS). Hanya untuk seed & admin. */
export async function adminQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query(sql, params);
  return res.rows as T[];
}
