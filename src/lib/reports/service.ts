/**
 * Laporan periode (BR-016) — service.
 *
 * Mengakomodasi zona waktu per cabang: data disimpan UTC, batas hari & agregasi
 * mengikuti zona waktu cabang (WIB/WITA/WIT). Konsolidasi menjumlahkan per hari lokal
 * tiap cabang.
 *
 * Dipakai dalam `withActor` (RLS aktif). Owner melihat semua cabang; Staff/Vet
 * hanya cabang yang ditugaskan.
 */
import type { PoolClient } from "@/lib/db";
import { listBranches } from "@/lib/branches/service";

export interface PeriodFilter {
  branchId?: string;
  fromUtc: Date; // inklusif
  toUtc: Date; // eksklusif (exclusive upper bound)
}

export interface DailySalesRow {
  branchId: string;
  branchName: string;
  dateLocal: string; // YYYY-MM-DD di zona cabang
  invoiceCount: number;
  grossTotal: number; // total tagihan (termasuk PPN & pembulatan)
  paidTotal: number;
  outstandingTotal: number;
}

export interface DailyVisitsRow {
  branchId: string;
  branchName: string;
  dateLocal: string; // YYYY-MM-DD di zona cabang
  registered: number;
  waiting: number;
  examined: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface PeriodSalesSummary {
  branchId: string;
  branchName: string;
  timezone: string;
  invoiceCount: number;
  grossTotal: number;
  paidTotal: number;
  outstandingTotal: number;
  daily: DailySalesRow[];
}

export interface PeriodVisitsSummary {
  branchId: string;
  branchName: string;
  timezone: string;
  totalVisits: number;
  daily: DailyVisitsRow[];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Bangun query agregasi penjualan per hari lokal per cabang. */
export async function getPeriodSales(
  tx: PoolClient,
  filter: PeriodFilter,
): Promise<PeriodSalesSummary[]> {
  const branches = await listBranches(tx);

  const branchIds = filter.branchId
    ? branches.filter((b) => b.id === filter.branchId)
    : branches;

  const results: PeriodSalesSummary[] = [];

  for (const branch of branchIds) {
    // Gunakan time_bucket dengan timezone cabang untuk grup per hari lokal
    // fromUtc/toUtc sudah di UTC, cast ke timestamptz lalu bucket per hari lokal
    const res = await tx.query<{
      date_local: string | Date;
      invoice_count: string;
      gross_total: string;
      paid_total: string;
      outstanding_total: string;
    }>(
      `with tz as (
         select $1::timestamptz as from_utc, $2::timestamptz as to_utc
       ),
       sales as (
         select
           i.id,
           i.branch_id,
           i.total,
           i.paid_amount,
           (i.total - i.paid_amount) as outstanding,
           (i.created_at at time zone $3)::date as date_local
         from invoice i, tz
         where i.branch_id = $4
           and i.created_at >= tz.from_utc
           and i.created_at < tz.to_utc
       )
       select
         date_local,
         count(*)::bigint as invoice_count,
         coalesce(sum(total), 0)::bigint as gross_total,
         coalesce(sum(paid_amount), 0)::bigint as paid_total,
         coalesce(sum(outstanding), 0)::bigint as outstanding_total
       from sales
       group by date_local
       order by date_local`,
      [filter.fromUtc, filter.toUtc, branch.timezone, branch.id],
    );

    // Isi hari yang kosong (untuk chart yang rapi)
    const dailyMap = new Map<string, DailySalesRow>();
    for (const row of res.rows) {
      // row.date_local bisa Date object atau ISO string
      const dateStr = row.date_local instanceof Date ? row.date_local.toISOString().split("T")[0] : row.date_local.split("T")[0];
      dailyMap.set(dateStr, {
        branchId: branch.id,
        branchName: branch.name,
        dateLocal: dateStr,
        invoiceCount: Number(row.invoice_count),
        grossTotal: Number(row.gross_total),
        paidTotal: Number(row.paid_total),
        outstandingTotal: Number(row.outstanding_total),
      });
    }

    // Generate date range di zona cabang
    const fromLocal = new Date(filter.fromUtc.toLocaleString("en-US", { timeZone: branch.timezone }));
    const toLocal = new Date(filter.toUtc.toLocaleString("en-US", { timeZone: branch.timezone }));
    const daily: DailySalesRow[] = [];
    const cursor = new Date(fromLocal);
    cursor.setHours(0, 0, 0, 0);
    while (cursor < toLocal) {
      const key = formatDateLocal(cursor);
      daily.push(
        dailyMap.get(key) ?? {
          branchId: branch.id,
          branchName: branch.name,
          dateLocal: key,
          invoiceCount: 0,
          grossTotal: 0,
          paidTotal: 0,
          outstandingTotal: 0,
        },
      );
      cursor.setDate(cursor.getDate() + 1);
    }

    const totals = daily.reduce(
      (acc, d) => ({
        invoiceCount: acc.invoiceCount + d.invoiceCount,
        grossTotal: acc.grossTotal + d.grossTotal,
        paidTotal: acc.paidTotal + d.paidTotal,
        outstandingTotal: acc.outstandingTotal + d.outstandingTotal,
      }),
      { invoiceCount: 0, grossTotal: 0, paidTotal: 0, outstandingTotal: 0 },
    );

    results.push({
      branchId: branch.id,
      branchName: branch.name,
      timezone: branch.timezone,
      ...totals,
      daily,
    });
  }

  return results;
}

/** Bangun query agregasi kunjungan per hari lokal per cabang. */
export async function getPeriodVisits(
  tx: PoolClient,
  filter: PeriodFilter,
): Promise<PeriodVisitsSummary[]> {
  const branches = await listBranches(tx);

  const branchIds = filter.branchId
    ? branches.filter((b) => b.id === filter.branchId)
    : branches;

  const results: PeriodVisitsSummary[] = [];

  for (const branch of branchIds) {
    const res = await tx.query<{
      date_local: string | Date;
      status: string;
      cnt: string;
    }>(
      `with tz as (
         select $1::timestamptz as from_utc, $2::timestamptz as to_utc
       ),
       visits as (
         select
           v.id,
           v.branch_id,
           v.status,
           (v.created_at at time zone $3)::date as date_local
         from visit v, tz
         where v.branch_id = $4
           and v.created_at >= tz.from_utc
           and v.created_at < tz.to_utc
       )
       select
         date_local,
         status,
         count(*)::bigint as cnt
       from visits
       group by date_local, status
       order by date_local, status`,
      [filter.fromUtc, filter.toUtc, branch.timezone, branch.id],
    );

    const dailyMap = new Map<string, DailyVisitsRow>();
    for (const row of res.rows) {
      const key = row.date_local instanceof Date ? row.date_local.toISOString().split("T")[0] : row.date_local.split("T")[0];
      let entry = dailyMap.get(key);
      if (!entry) {
        entry = {
          branchId: branch.id,
          branchName: branch.name,
          dateLocal: key,
          registered: 0,
          waiting: 0,
          examined: 0,
          completed: 0,
          cancelled: 0,
          total: 0,
        };
        dailyMap.set(key, entry);
      }
      const count = Number(row.cnt);
      switch (row.status) {
        case "terdaftar":
          entry.registered += count;
          break;
        case "menunggu":
          entry.waiting += count;
          break;
        case "diperiksa":
          entry.examined += count;
          break;
        case "selesai":
          entry.completed += count;
          break;
        case "dibatalkan":
          entry.cancelled += count;
          break;
      }
      entry.total += count;
    }

    // Isi hari kosong
    const fromLocal = new Date(filter.fromUtc.toLocaleString("en-US", { timeZone: branch.timezone }));
    const toLocal = new Date(filter.toUtc.toLocaleString("en-US", { timeZone: branch.timezone }));
    const daily: DailyVisitsRow[] = [];
    const cursor = new Date(fromLocal);
    cursor.setHours(0, 0, 0, 0);
    while (cursor < toLocal) {
      const key = formatDateLocal(cursor);
      daily.push(
        dailyMap.get(key) ?? {
          branchId: branch.id,
          branchName: branch.name,
          dateLocal: key,
          registered: 0,
          waiting: 0,
          examined: 0,
          completed: 0,
          cancelled: 0,
          total: 0,
        },
      );
      cursor.setDate(cursor.getDate() + 1);
    }

    results.push({
      branchId: branch.id,
      branchName: branch.name,
      timezone: branch.timezone,
      totalVisits: daily.reduce((s, d) => s + d.total, 0),
      daily,
    });
  }

  return results;
}