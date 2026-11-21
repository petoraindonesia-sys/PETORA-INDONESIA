"use client";

/**
 * Halaman /app/medical — rekam medis (BR-003/004/005).
 * Untuk Dokter (permission medical.read/write). Pilih pelanggan → hewan → lihat
 * riwayat rekam medis lintas cabang (BR-003), buat draft, edit, lalu finalkan.
 * Entri final terkunci (BR-004) — tombol edit/final hanya untuk draft.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MedicalStatus = "draft" | "final";

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

interface MedicalRecord {
  id: string;
  branchId: string;
  petId: string;
  authorId: string;
  status: MedicalStatus;
  anamnesis: string | null;
  examination: string | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  createdAt: string;
  finalizedAt: string | null;
}

const EMPTY_FORM = {
  anamnesis: "",
  examination: "",
  diagnosis: "",
  treatment: "",
  prescription: "",
};

export default function MedicalPage() {
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState("");
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadLookups() {
    setLoading(true);
    setError(null);
    try {
      const [bRes, cRes] = await Promise.all([fetch("/api/branches"), fetch("/api/customers")]);
      if (bRes.status === 401 || cRes.status === 401) {
        router.push("/login");
        return;
      }
      const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
      setBranches((bData.branches ?? []).filter((b: Branch) => b.isActive));
      setCustomers(cData.customers ?? []);
    } catch {
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
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

  async function loadRecords(pid: string) {
    if (!pid) {
      setRecords([]);
      return;
    }
    try {
      const res = await fetch(`/api/medical-records?petId=${pid}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setRecords(data.records ?? []);
    } catch {
      setError("Gagal memuat rekam medis");
    }
  }

  useEffect(() => {
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (customerId) loadPets(customerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    if (petId) loadRecords(petId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  }

  async function onCreateDraft(e: React.FormEvent) {
    e.preventDefault();
    const branchId = branches[0]?.id;
    if (!branchId) {
      setError("Tidak ada cabang aktif untuk Anda");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          petId,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat draft");
        return;
      }
      resetForm();
      await loadRecords(petId);
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  function editDraft(r: MedicalRecord) {
    setEditingId(r.id);
    setForm({
      anamnesis: r.anamnesis ?? "",
      examination: r.examination ?? "",
      diagnosis: r.diagnosis ?? "",
      treatment: r.treatment ?? "",
      prescription: r.prescription ?? "",
    });
  }

  async function onSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/medical-records/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }
      resetForm();
      await loadRecords(petId);
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  async function onFinalize(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/medical-records/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal finalisasi");
        return;
      }
      if (editingId === id) resetForm();
      await loadRecords(petId);
    } catch {
      setError("Tidak dapat terhubung ke server");
    }
  }

  const isDraftEditing = editingId !== null;

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Rekam medis</h1>
      </div>

      {error ? (
        <p role="alert" className="text-sm mb-4" style={{ color: "var(--petora-danger)" }}>
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label htmlFor="customer" className="block text-sm font-medium mb-1">
            Pelanggan
          </label>
          {loading ? (
            <p className="text-sm opacity-60">Memuat…</p>
          ) : (
            <select
              id="customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
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
          )}
        </div>
        <div>
          <label htmlFor="pet" className="block text-sm font-medium mb-1">
            Hewan
          </label>
          <select
            id="pet"
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
        </div>
      </div>

      {petId ? (
        <form
          onSubmit={isDraftEditing ? onSaveDraft : onCreateDraft}
          className="mb-6 rounded-2xl p-5 space-y-3"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{isDraftEditing ? "Edit draft" : "Entri baru"}</h2>
            {isDraftEditing ? (
              <button type="button" onClick={resetForm} className="text-sm underline opacity-70">
                Batal edit
              </button>
            ) : null}
          </div>
          {(
            [
              ["anamnesis", "Anamnesis"],
              ["examination", "Pemeriksaan"],
              ["diagnosis", "Diagnosis"],
              ["treatment", "Tindakan"],
              ["prescription", "Resep"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium mb-1">
                {label}
              </label>
              <textarea
                id={key}
                rows={2}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--petora-accent)" }}
          >
            {saving ? "Menyimpan…" : isDraftEditing ? "Simpan perubahan" : "Simpan draft"}
          </button>
        </form>
      ) : null}

      {petId ? (
        records.length === 0 ? (
          <p className="text-sm opacity-60 py-6 text-center">
            Belum ada rekam medis untuk hewan ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {records.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl p-4"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span
                      className="text-xs px-2 py-1 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          r.status === "final" ? "rgba(36,138,61,0.12)" : "rgba(201,142,22,0.12)",
                        color: r.status === "final" ? "var(--petora-success)" : "#b8860b",
                      }}
                    >
                      {r.status === "final" ? "Final" : "Draft"}
                    </span>
                    <span className="text-sm opacity-60">
                      {new Date(r.createdAt).toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                      })}
                    </span>
                  </div>
                  {r.status === "draft" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editDraft(r)}
                        className="text-xs underline opacity-70"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onFinalize(r.id)}
                        className="text-xs underline opacity-70"
                      >
                        Finalkan
                      </button>
                    </div>
                  ) : null}
                </div>
                {r.diagnosis ? (
                  <p className="text-sm">
                    <span className="font-medium">Diagnosis:</span> {r.diagnosis}
                  </p>
                ) : null}
                {r.treatment ? (
                  <p className="text-sm">
                    <span className="font-medium">Tindakan:</span> {r.treatment}
                  </p>
                ) : null}
                {r.prescription ? (
                  <p className="text-sm">
                    <span className="font-medium">Resep:</span> {r.prescription}
                  </p>
                ) : null}
                {!r.diagnosis && !r.treatment && !r.prescription ? (
                  <p className="text-sm opacity-60 italic">Belum ada isian klinis.</p>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </main>
  );
}
