/**
 * Ringkasan operasional harian (BR-001) — service.
 *
 * Dijalankan di dalam `withActor` (RLS aktif). Menggabungkan data kunjungan & tagihan
 * per cabang yang terlihat oleh aktor (RLS visit/invoice membatasi per cabang).
 * Owner melihat semua cabang; staf hanya cabangnya.
 */
import type { PoolClient } from "@/lib/db";
import { listBranches } from "@/lib/branches/service";

export interface BranchSummary {
  branchId: string;
  branchName: string;
  timezone: string;
  visitsToday: number;
  visitsWaiting: number;
  visitsDone: number;
  invoicesToday: number;
  revenueToday: number;
  outstanding: number;
}

export interface Dashboard {
  asOf: string;
  branches: BranchSummary[];
  totals: {
    visitsToday: number;
    invoicesToday: number;
    revenueToday: number;
    outstanding: number;
  };
}

/**
 * Ringkasan per cabang untuk "hari ini" (mengikuti zona waktu tiap cabang).
 * - Kunjungan: dihitung dengan created_at pada tanggal lokal cabang.
 * - Tagihan: dibuat hari ini (created_at lokal) -> jumlah & total; outstanding =
 *   total tagihan belum lunas di cabang (semua waktu).
 */
export async function getDashboard(tx: PoolClient): Promise<Dashboard> {
  const branches = await listBranches(tx);
  const summaries: BranchSummary[] = [];

  for (const branch of branches) {
    const tz = branch.timezone;
    // Kunjungan hari ini (tanggal lokal cabang).
    const visits = await tx.query<{ total: string; waiting: string; done: string }>(
      `select
         count(*) as total,
         count(*) filter (where status in ('terdaftar','menunggu','diperiksa')) as waiting,
         count(*) filter (where status = 'selesai') as done
       from visit
       where branch_id = $1
         and (created_at at time zone $2)::date = (now() at time zone $2)::date`,
      [branch.id, tz],
    );
    // Tagihan hari ini (dibuat lokal) -> jumlah & total.
    const invToday = await tx.query<{ count: string; total: string }>(
      `select count(*) as count, coalesce(sum(total), 0) as total
       from invoice
       where branch_id = $1
         and status <> 'void'
         and (created_at at time zone $2)::date = (now() at time zone $2)::date`,
      [branch.id, tz],
    );
    // Outstanding: total tagihan belum lunas (semua waktu, non-void).
    const outstanding = await tx.query<{ total: string }>(
      `select coalesce(sum(total - paid_amount), 0) as total
       from invoice
       where branch_id = $1
         and status <> 'void'
         and status <> 'paid'`,
      [branch.id],
    );

    summaries.push({
      branchId: branch.id,
      branchName: branch.name,
      timezone: branch.timezone,
      visitsToday: Number(visits.rows[0].total),
      visitsWaiting: Number(visits.rows[0].waiting),
      visitsDone: Number(visits.rows[0].done),
      invoicesToday: Number(invToday.rows[0].count),
      revenueToday: Number(invToday.rows[0].total),
      outstanding: Number(outstanding.rows[0].total),
    });
  }

  const totals = summaries.reduce(
    (acc, s) => ({
      visitsToday: acc.visitsToday + s.visitsToday,
      invoicesToday: acc.invoicesToday + s.invoicesToday,
      revenueToday: acc.revenueToday + s.revenueToday,
      outstanding: acc.outstanding + s.outstanding,
    }),
    { visitsToday: 0, invoicesToday: 0, revenueToday: 0, outstanding: 0 },
  );

  return { asOf: new Date().toISOString(), branches: summaries, totals };
}
