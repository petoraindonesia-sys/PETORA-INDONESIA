"use client";

import { useState, useEffect } from "react";

type ReportType = "sales" | "visits";

interface DailySales {
  dateLocal: string;
  invoiceCount: number;
  grossTotal: number;
  paidTotal: number;
  outstandingTotal: number;
}

interface DailyVisits {
  dateLocal: string;
  registered: number;
  waiting: number;
  examined: number;
  completed: number;
  cancelled: number;
  total: number;
}

interface BranchSummary {
  branchId: string;
  branchName: string;
  timezone: string;
  invoiceCount?: number;
  grossTotal?: number;
  paidTotal?: number;
  outstandingTotal?: number;
  totalVisits?: number;
  daily: DailySales[] | DailyVisits[];
}

interface ReportResponse {
  type: ReportType;
  from: string;
  to: string;
  data: BranchSummary[];
}

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  // Load branches on mount
  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => setBranches(d.branches || []))
      .catch(() => {});
  }, []);

  // Default date range: last 30 days
  useEffect(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    setFrom(thirtyDaysAgo.toISOString().split("T")[0]);
    setTo(now.toISOString().split("T")[0]);
  }, []);

  const fmtRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fromUtc = new Date(from + "T00:00:00Z").toISOString();
    const toUtc = new Date(to + "T23:59:59Z").toISOString();

    const params = new URLSearchParams({ type, from: fromUtc, to: toUtc });
    if (branchId) params.set("branchId", branchId);

    try {
      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat laporan");
      setReport(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Laporan Periode</h1>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 rounded-2xl p-5 space-y-4" style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1">Jenis laporan</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              <option value="sales">Penjualan (Tagihan)</option>
              <option value="visits">Kunjungan</option>
            </select>
          </div>

          <div>
            <label htmlFor="from" className="block text-sm font-medium mb-1">Dari (tanggal lokal)</label>
            <input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            />
          </div>

          <div>
            <label htmlFor="to" className="block text-sm font-medium mb-1">Sampai (tanggal lokal)</label>
            <input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            />
          </div>

          <div>
            <label htmlFor="branch" className="block text-sm font-medium mb-1">Cabang (opsional)</label>
            <select
              id="branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              <option value="">Semua cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--petora-accent)" }}
        >
          {loading ? "Memuat…" : "Tampilkan"}
        </button>

        {error && <p className="text-sm" style={{ color: "var(--petora-danger)" }}>{error}</p>}
      </form>

      {report && report.data.length > 0 && (
        <div className="space-y-8">
          {report.data.map((branch) => (
            <section key={branch.branchId}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">
                  {branch.branchName} ({branch.timezone})
                </h2>
                <div className="flex gap-4 text-sm opacity-70">
                  {type === "sales" && (
                    <>
                      <span>Tagihan: <strong>{fmtRupiah(branch.grossTotal || 0)}</strong></span>
                      <span>Terbayar: <strong>{fmtRupiah(branch.paidTotal || 0)}</strong></span>
                      <span>Piutang: <strong>{fmtRupiah(branch.outstandingTotal || 0)}</strong></span>
                    </>
                  )}
                  {type === "visits" && (
                    <span>Total kunjungan: <strong>{branch.totalVisits}</strong></span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid rgba(0,0,0,0.12)" }}>
                      <th className="text-left py-2 px-3 font-medium">Tanggal</th>
                      {type === "sales" ? (
                        <>
                          <th className="text-right py-2 px-3 font-medium"># Tagihan</th>
                          <th className="text-right py-2 px-3 font-medium">Total</th>
                          <th className="text-right py-2 px-3 font-medium">Terbayar</th>
                          <th className="text-right py-2 px-3 font-medium">Piutang</th>
                        </>
                      ) : (
                        <>
                          <th className="text-right py-2 px-3 font-medium">Terdaftar</th>
                          <th className="text-right py-2 px-3 font-medium">Menunggu</th>
                          <th className="text-right py-2 px-3 font-medium">Diperiksa</th>
                          <th className="text-right py-2 px-3 font-medium">Selesai</th>
                          <th className="text-right py-2 px-3 font-medium">Dibatalkan</th>
                          <th className="text-right py-2 px-3 font-medium">Total</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {branch.daily.map((day, i) => (
                      <tr
                        key={day.dateLocal}
                        style={{
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                          backgroundColor: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
                        }}
                      >
                        <td className="py-2 px-3">{day.dateLocal}</td>
                        {type === "sales" ? (
                          <>
                            <td className="text-right py-2 px-3">{(day as DailySales).invoiceCount}</td>
                            <td className="text-right py-2 px-3">{fmtRupiah((day as DailySales).grossTotal)}</td>
                            <td className="text-right py-2 px-3">{fmtRupiah((day as DailySales).paidTotal)}</td>
                            <td className="text-right py-2 px-3">{fmtRupiah((day as DailySales).outstandingTotal)}</td>
                          </>
                        ) : (
                          <>
                            <td className="text-right py-2 px-3">{(day as DailyVisits).registered}</td>
                            <td className="text-right py-2 px-3">{(day as DailyVisits).waiting}</td>
                            <td className="text-right py-2 px-3">{(day as DailyVisits).examined}</td>
                            <td className="text-right py-2 px-3">{(day as DailyVisits).completed}</td>
                            <td className="text-right py-2 px-3">{(day as DailyVisits).cancelled}</td>
                            <td className="text-right py-2 px-3 font-medium">{(day as DailyVisits).total}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid rgba(0,0,0,0.12)" }}>
                      <td className="py-2 px-3 font-medium">Total</td>
                      {type === "sales" ? (
                        <>
                          <td className="text-right py-2 px-3 font-medium">{branch.invoiceCount}</td>
                          <td className="text-right py-2 px-3 font-medium">{fmtRupiah(branch.grossTotal || 0)}</td>
                          <td className="text-right py-2 px-3 font-medium">{fmtRupiah(branch.paidTotal || 0)}</td>
                          <td className="text-right py-2 px-3 font-medium">{fmtRupiah(branch.outstandingTotal || 0)}</td>
                        </>
                      ) : (
                        <>
                          <td className="text-right py-2 px-3"></td>
                          <td className="text-right py-2 px-3"></td>
                          <td className="text-right py-2 px-3"></td>
                          <td className="text-right py-2 px-3 font-medium">{branch.totalVisits}</td>
                          <td className="text-right py-2 px-3"></td>
                          <td className="text-right py-2 px-3"></td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Simple bar chart using div */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Chart harian</h3>
                <div className="flex gap-1 h-32 items-end overflow-x-auto pb-2">
                  {branch.daily.map((day, _i) => {
                    const val = type === "sales" ? (day as DailySales).grossTotal : (day as DailyVisits).total;
                    const maxVal = Math.max(...branch.daily.map((d) => (type === "sales" ? (d as DailySales).grossTotal : (d as DailyVisits).total)), 1);
                    const height = Math.max((val / maxVal) * 100, val > 0 ? 8 : 0);
                    return (
                      <div
                        key={day.dateLocal}
                        className="flex flex-col items-center gap-1 min-w-[36px]"
                        style={{ height: "100%" }}
                      >
                        <div
                          className="w-full rounded-t transition-all"
                          style={{
                            height: `${height}%`,
                            backgroundColor: type === "sales" ? "var(--petora-accent)" : "var(--petora-primary)",
                            minHeight: val > 0 ? "8px" : 0,
                          }}
                          title={type === "sales" ? fmtRupiah(val) : String(val)}
                        />
                        <span className="text-xs opacity-60 transform -rotate-90 origin-center whitespace-nowrap" style={{ marginTop: "4px" }}>
                          {day.dateLocal.split("-").slice(1).join("/")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {report && report.data.length === 0 && (
        <p className="text-center text-sm opacity-60 py-8">Tidak ada data untuk rentang ini.</p>
      )}
    </main>
  );
}