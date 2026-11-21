"use client";

/**
 * Halaman /app — dashboard ringkasan operasional hari ini (BR-001).
 * Menampilkan ringkasan per cabang (terlihat oleh RLS) + akses cepat ke modul.
 * Sesi divalidasi server (middleware redirect ke /login bila tidak ada).
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface BranchSummary {
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

interface Dashboard {
  asOf: string;
  branches: BranchSummary[];
  totals: {
    visitsToday: number;
    invoicesToday: number;
    revenueToday: number;
    outstanding: number;
  };
}

function rupiah(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export default function AppHome() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (!cancelled) setData(json.dashboard ?? null);
      } catch {
        if (!cancelled) setError("Gagal memuat ringkasan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Ringkasan Hari Ini</h1>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="rounded-xl border px-4 py-2 text-sm"
            style={{ borderColor: "rgba(0,0,0,0.12)" }}
          >
            Keluar
          </button>
        </form>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2">
        <a
          href="/app/visits"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Kunjungan
        </a>
        <a
          href="/app/cashier"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Kasir
        </a>
        <a
          href="/app/customers"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Pelanggan
        </a>
        <a
          href="/app/medical"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Rekam medis
        </a>
        <a
          href="/app/branches"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Cabang
        </a>
        <a
          href="/app/reports"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Laporan
        </a>
        <a
          href="/app/inventory"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Inventori
        </a>
        <a
          href="/app/vaccination"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Vaksinasi
        </a>
        <a
          href="/app/boarding"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Rawat Inap
        </a>
        <a
          href="/app/transfer"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Transfer Stok
        </a>
      </nav>

      {error ? (
        <p role="alert" className="text-sm mb-4" style={{ color: "var(--petora-danger)" }}>
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm opacity-60">Memuat…</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
              <p className="text-xs opacity-60">Kunjungan hari ini</p>
              <p className="text-2xl font-semibold">{data.totals.visitsToday}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
              <p className="text-xs opacity-60">Tagihan hari ini</p>
              <p className="text-2xl font-semibold">{data.totals.invoicesToday}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
              <p className="text-xs opacity-60">Pendapatan hari ini</p>
              <p className="text-2xl font-semibold" style={{ color: "var(--petora-accent)" }}>
                {rupiah(data.totals.revenueToday)}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
              <p className="text-xs opacity-60">Piutang (belum lunas)</p>
              <p className="text-2xl font-semibold" style={{ color: "#b8860b" }}>
                {rupiah(data.totals.outstanding)}
              </p>
            </div>
          </div>

          {data.branches.length === 0 ? (
            <p className="text-sm opacity-60">Tidak ada cabang yang dapat diakses.</p>
          ) : (
            <ul className="space-y-2">
              {data.branches.map((b) => (
                <li
                  key={b.branchId}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{b.branchName}</p>
                    <span className="text-xs opacity-60">{b.timezone}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="opacity-60">Kunjungan: </span>
                      {b.visitsToday} ({b.visitsWaiting} menunggu, {b.visitsDone} selesai)
                    </div>
                    <div>
                      <span className="opacity-60">Tagihan: </span>
                      {b.invoicesToday}
                    </div>
                    <div>
                      <span className="opacity-60">Pendapatan: </span>
                      {rupiah(b.revenueToday)}
                    </div>
                    <div>
                      <span className="opacity-60">Piutang: </span>
                      {rupiah(b.outstanding)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </main>
  );
}
