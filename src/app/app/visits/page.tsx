"use client";

/**
 * Halaman /app/visits — kunjungan klinik (BR-001).
 * Daftar kunjungan per cabang (RLS membatasi cabang aktor) + buat kunjungan baru
 * (pilih pelanggan → hewan miliknya). Status transisi mengikuti alur klinik.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VisitStatus = "terdaftar" | "menunggu" | "diperiksa" | "selesai" | "dibatalkan";

interface Branch {
  id: string;
  name: string;
  isActive: boolean;
}

interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
}

interface Pet {
  id: string;
  customerId: string;
  name: string;
  species: string;
}

interface Visit {
  id: string;
  branchId: string;
  customerId: string;
  petId: string;
  status: VisitStatus;
  queueNumber: number | null;
  createdAt: string;
  petName: string;
  customerName: string;
}

const STATUS_LABEL: Record<VisitStatus, string> = {
  terdaftar: "Terdaftar",
  menunggu: "Menunggu",
  diperiksa: "Diperiksa",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

const NEXT_STATUS: Record<VisitStatus, VisitStatus | null> = {
  terdaftar: "menunggu",
  menunggu: "diperiksa",
  diperiksa: "selesai",
  selesai: null,
  dibatalkan: null,
};

const NEXT_LABEL: Record<VisitStatus, string> = {
  terdaftar: "MULAI",
  menunggu: "PERIKSA",
  diperiksa: "SELESAI",
  selesai: "",
  dibatalkan: "",
};

export default function VisitsPage() {
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadBranches() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/branches");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      const list: Branch[] = (data.branches ?? []).filter((b: Branch) => b.isActive);
      setBranches(list);
      if (list.length > 0 && !branchId) setBranchId(list[0].id);
    } catch {
      setError("Gagal memuat cabang");
    } finally {
      setLoading(false);
    }
  }

  async function loadVisits() {
    if (!branchId) {
      setVisits([]);
      return;
    }
    try {
      const res = await fetch(`/api/visits?branchId=${branchId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setVisits(data.visits ?? []);
    } catch {
      /* biarkan daftar lama tetap tampil */
    }
  }

  async function loadCustomers() {
    try {
      const res = await fetch("/api/customers");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch {
      setError("Gagal memuat pelanggan");
    }
  }

  async function loadPets(cid: string) {
    if (!cid) {
      setPets([]);
      setPetId("");
      return;
    }
    try {
      const res = await fetch(`/api/pets?customerId=${cid}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setPets(data.pets ?? []);
      if (data.pets?.length > 0) setPetId(data.pets[0].id);
    } catch {
      setError("Gagal memuat hewan");
    }
  }

  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (branchId) loadVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, customerId, petId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat kunjungan");
        return;
      }
      setCustomerId("");
      setPetId("");
      setShowForm(false);
      await loadVisits();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  async function advance(id: string, status: VisitStatus) {
    setError(null);
    try {
      const res = await fetch(`/api/visits/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah status");
        return;
      }
      await loadVisits();
    } catch {
      setError("Tidak dapat terhubung ke server");
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Kunjungan</h1>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            if (!showForm) void loadCustomers();
          }}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--petora-accent)" }}
        >
          {showForm ? "Tutup" : "Tambah kunjungan"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm mb-4" style={{ color: "var(--petora-danger)" }}>
          {error}
        </p>
      ) : null}

      <div className="mb-4">
        <label htmlFor="branch" className="block text-sm font-medium mb-1">
          Cabang
        </label>
        {loading ? (
          <p className="text-sm opacity-60">Memuat…</p>
        ) : branches.length === 0 ? (
          <p className="text-sm opacity-60">Tidak ada cabang aktif yang dapat Anda akses.</p>
        ) : (
          <select
            id="branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
            style={{ borderColor: "rgba(0,0,0,0.12)" }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="mb-6 rounded-2xl p-5 space-y-3"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <div>
            <label htmlFor="customer" className="block text-sm font-medium mb-1">
              Pelanggan
            </label>
            <select
              id="customer"
              required
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                void loadPets(e.target.value);
              }}
              className="w-full rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              <option value="">— pilih pelanggan —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                  {c.phone ? ` (${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pet" className="block text-sm font-medium mb-1">
              Hewan
            </label>
            <select
              id="pet"
              required
              disabled={!customerId}
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className="w-full rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-50"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              <option value="">— pilih hewan —</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species})
                </option>
              ))}
            </select>
            {customerId && pets.length === 0 ? (
              <p className="text-sm opacity-60 mt-1">
                Pelanggan ini belum memiliki hewan. Tambahkan di menu Pelanggan.
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={saving || !branchId || !customerId || !petId}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--petora-accent)" }}
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </form>
      ) : null}

      {visits.length === 0 ? (
        <p className="text-sm opacity-60 py-8 text-center">Belum ada kunjungan di cabang ini.</p>
      ) : (
        <ul className="space-y-2">
          {visits.map((v) => {
            const next = NEXT_STATUS[v.status];
            return (
              <li
                key={v.id}
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                <div>
                  <p className="font-medium">
                    {v.queueNumber ? `#${v.queueNumber} ` : ""}
                    {v.petName}
                  </p>
                  <p className="text-sm opacity-60">{v.customerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        v.status === "selesai"
                          ? "rgba(36,138,61,0.12)"
                          : v.status === "dibatalkan"
                            ? "rgba(0,0,0,0.06)"
                            : "rgba(201,142,22,0.12)",
                      color:
                        v.status === "selesai"
                          ? "var(--petora-success)"
                          : v.status === "dibatalkan"
                            ? "inherit"
                            : "#b8860b",
                    }}
                  >
                    {STATUS_LABEL[v.status]}
                  </span>
                  {next ? (
                    <button
                      type="button"
                      onClick={() => advance(v.id, next)}
                      className="text-xs underline opacity-70"
                    >
                      {NEXT_LABEL[v.status]}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
