"use client";

/**
 * Halaman /app/customers — pelanggan & hewan (BR-003).
 * Terpusat lintas cabang: semua staf melihat & mengelola data pelanggan/hewan.
 * Alur: cari/tambah pelanggan → pilih pelanggan → kelola hewan miliknya.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PetSex = "male" | "female" | "unknown";

interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
}

interface Pet {
  id: string;
  customerId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: PetSex;
  birthDate: string | null;
  weightGrams: number | null;
  notes: string | null;
  createdAt: string;
}

const SPECIES_OPTIONS = ["Anjing", "Kucing", "Burung", "Kelinci", "Reptil", "Lainnya"];

function sexLabel(sex: PetSex): string {
  return sex === "male" ? "Jantan" : sex === "female" ? "Betina" : "Tidak diketahui";
}

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Customer | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const [showPetForm, setShowPetForm] = useState(false);
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState(SPECIES_OPTIONS[0]);
  const [petBreed, setPetBreed] = useState("");
  const [petSex, setPetSex] = useState<PetSex>("unknown");
  const [petBirth, setPetBirth] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [savingPet, setSavingPet] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    setError(null);
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
    } finally {
      setLoading(false);
    }
  }

  async function loadPets(customerId: string) {
    setLoadingPets(true);
    try {
      const res = await fetch(`/api/pets?customerId=${customerId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setPets(data.pets ?? []);
    } catch {
      setError("Gagal memuat hewan");
    } finally {
      setLoadingPets(false);
    }
  }

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (selected) loadPets(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) {
      await loadCustomers();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search.trim())}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch {
      setError("Gagal mencari pelanggan");
    } finally {
      setLoading(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat pelanggan");
        return;
      }
      setFullName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setShowForm(false);
      await loadCustomers();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  async function onCreatePet(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSavingPet(true);
    setError(null);
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selected.id,
          name: petName,
          species: petSpecies,
          breed: petBreed,
          sex: petSex,
          birthDate: petBirth || null,
          weightGrams: petWeight ? Number(petWeight) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat hewan");
        return;
      }
      setPetName("");
      setPetBreed("");
      setPetSex("unknown");
      setPetBirth("");
      setPetWeight("");
      setShowPetForm(false);
      await loadPets(selected.id);
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setSavingPet(false);
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pelanggan & Hewan</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--petora-accent)" }}
        >
          {showForm ? "Tutup" : "Tambah pelanggan"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm mb-4" style={{ color: "var(--petora-danger)" }}>
          {error}
        </p>
      ) : null}

      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <input
          aria-label="Cari pelanggan"
          placeholder="Cari nama atau telepon…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        />
        <button
          type="submit"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Cari
        </button>
      </form>

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="mb-6 rounded-2xl p-5 space-y-3"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1">
              Nama pelanggan
            </label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Telepon
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-medium mb-2">Pelanggan</h2>
          {loading ? (
            <p className="text-sm opacity-60">Memuat…</p>
          ) : customers.length === 0 ? (
            <p className="text-sm opacity-60 py-4">Belum ada pelanggan.</p>
          ) : (
            <ul className="space-y-2">
              {customers.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      setShowPetForm(false);
                    }}
                    className="w-full text-left rounded-2xl p-4"
                    style={{
                      backgroundColor:
                        selected?.id === c.id ? "rgba(36,138,61,0.10)" : "rgba(0,0,0,0.03)",
                    }}
                  >
                    <p className="font-medium">{c.fullName}</p>
                    <p className="text-sm opacity-60">{c.phone ?? "Tanpa telepon"}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">
            Hewan {selected ? `— ${selected.fullName}` : ""}
          </h2>
          {!selected ? (
            <p className="text-sm opacity-60 py-4">Pilih pelanggan untuk melihat hewannya.</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowPetForm((v) => !v)}
                className="mb-3 rounded-xl px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "var(--petora-accent)" }}
              >
                {showPetForm ? "Tutup" : "Tambah hewan"}
              </button>

              {showPetForm ? (
                <form
                  onSubmit={onCreatePet}
                  className="mb-4 rounded-2xl p-4 space-y-2"
                  style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                >
                  <input
                    aria-label="Nama hewan"
                    placeholder="Nama hewan"
                    required
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                    style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  />
                  <select
                    aria-label="Spesies"
                    value={petSpecies}
                    onChange={(e) => setPetSpecies(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                    style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  >
                    {SPECIES_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      aria-label="Ras"
                      placeholder="Ras"
                      value={petBreed}
                      onChange={(e) => setPetBreed(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    />
                    <select
                      aria-label="Jenis kelamin"
                      value={petSex}
                      onChange={(e) => setPetSex(e.target.value as PetSex)}
                      className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    >
                      <option value="unknown">Tidak diketahui</option>
                      <option value="male">Jantan</option>
                      <option value="female">Betina</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      aria-label="Tanggal lahir"
                      type="date"
                      value={petBirth}
                      onChange={(e) => setPetBirth(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    />
                    <input
                      aria-label="Berat gram"
                      type="number"
                      min={0}
                      placeholder="Berat (g)"
                      value={petWeight}
                      onChange={(e) => setPetWeight(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPet}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--petora-accent)" }}
                  >
                    {savingPet ? "Menyimpan…" : "Simpan"}
                  </button>
                </form>
              ) : null}

              {loadingPets ? (
                <p className="text-sm opacity-60">Memuat…</p>
              ) : pets.length === 0 ? (
                <p className="text-sm opacity-60 py-4">Belum ada hewan untuk pelanggan ini.</p>
              ) : (
                <ul className="space-y-2">
                  {pets.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{p.name}</p>
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
                        >
                          {sexLabel(p.sex)}
                        </span>
                      </div>
                      <p className="text-sm opacity-60">
                        {p.species}
                        {p.breed ? ` · ${p.breed}` : ""}
                      </p>
                      {p.birthDate ? (
                        <p className="text-sm opacity-60">Lahir {p.birthDate}</p>
                      ) : null}
                      {p.weightGrams !== null ? (
                        <p className="text-sm opacity-60">Berat {p.weightGrams} g</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
