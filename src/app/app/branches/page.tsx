"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Timezone = "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura";

interface Branch {
  id: string;
  companyId: string;
  name: string;
  address: string | null;
  timezone: Timezone;
  isActive: boolean;
}

const TIMEZONES: { value: Timezone; label: string }[] = [
  { value: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
  { value: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
  { value: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" },
];

const COMPANY_ID = "10000000-0000-4000-8000-0000000000c0";

export default function BranchesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState<Timezone>("Asia/Jakarta");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/branches");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setBranches(data.branches ?? []);
    } catch {
      setError("Gagal memuat cabang");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/branches");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!cancelled) setBranches(data.branches ?? []);
      } catch {
        if (!cancelled) setError("Gagal memuat cabang");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: COMPANY_ID, name, address, timezone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat cabang");
        return;
      }
      setName("");
      setAddress("");
      setTimezone("Asia/Jakarta");
      setShowForm(false);
      await load();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cabang</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--petora-accent)" }}
        >
          {showForm ? "Tutup" : "Tambah cabang"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm mb-4" style={{ color: "var(--petora-danger)" }}>
          {error}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="mb-6 rounded-2xl p-5 space-y-3"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nama cabang
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Alamat
            </label>
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            />
          </div>
          <div>
            <label htmlFor="tz" className="block text-sm font-medium mb-1">
              Zona waktu
            </label>
            <select
              id="tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value as Timezone)}
              className="w-full rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              {TIMEZONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--petora-accent)" }}
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm opacity-60">Memuat…</p>
      ) : (
        <ul className="space-y-2">
          {branches.map((b) => (
            <li
              key={b.id}
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
            >
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="text-sm opacity-60">
                  {b.timezone} {b.address ? `· ${b.address}` : ""}
                </p>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: b.isActive ? "rgba(36,138,61,0.12)" : "rgba(0,0,0,0.06)",
                  color: b.isActive ? "var(--petora-success)" : "inherit",
                }}
              >
                {b.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </li>
          ))}
          {branches.length === 0 ? (
            <li className="text-sm opacity-60 py-8 text-center">Belum ada cabang.</li>
          ) : null}
        </ul>
      )}
    </main>
  );
}
