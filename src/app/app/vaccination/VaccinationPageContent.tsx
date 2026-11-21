"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Vaccination {
  id: string;
  pet_id: string;
  pet_name: string;
  species: string;
  owner_name: string;
  name: string;
  administered_at: string | null;
  next_due_at: string | null;
  interval_days: number | null;
  status: "scheduled" | "completed" | "cancelled";
  notes: string | null;
  visit_id: string | null;
  created_at: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

export default function VaccinationPageContent() {
  const searchParams = useSearchParams();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "due" | "upcoming" | "create">("list");
  const [selectedPetId, setSelectedPetId] = useState(searchParams.get("petId") || "");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [formPetId, setFormPetId] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formAdministeredAt, setFormAdministeredAt] = useState("");
  const [formIntervalDays, setFormIntervalDays] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<"scheduled" | "completed">("scheduled");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchVaccinations = useCallback(async () => {
    let url = "/api/vaccination?";
    if (activeTab === "due") {
      url += "due=overdue";
    } else if (activeTab === "upcoming") {
      url += "due=upcoming";
    } else if (selectedPetId) {
      url += `petId=${selectedPetId}&status=${statusFilter}`;
    } else {
      url += "due=overdue";
    }
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVaccinations(data.vaccinations || []);
      }
    } catch {
      // ignored
    }
  }, [activeTab, selectedPetId, statusFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [petsRes, productsRes] = await Promise.all([
        fetch("/api/pets?limit=500"),
        fetch("/api/products?type=vaccine&limit=200"),
      ]);
      const [petsData, productsData] = await Promise.all([petsRes.json(), productsRes.json()]);
      setPets(petsData.pets || []);
      setProducts(productsData.products || []);
    } catch {
      // ignored
    }
    await fetchVaccinations();
    setLoading(false);
  }, [fetchVaccinations]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/vaccination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: formPetId,
          productId: formProductId,
          administeredAt: formAdministeredAt || null,
          intervalDays: formIntervalDays ? Number(formIntervalDays) : null,
          notes: formNotes || null,
          status: formStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal membuat vaksinasi");
        return;
      }
      setFormPetId("");
      setFormProductId("");
      setFormAdministeredAt("");
      setFormIntervalDays("");
      setFormNotes("");
      setFormStatus("scheduled");
      setActiveTab("list");
      await fetchVaccinations();
    } catch {
      setFormError("Terjadi kesalahan jaringan");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleUpdate(vaccinationId: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/vaccination/${vaccinationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchVaccinations();
      }
    } catch {
      // ignored
    }
  }

  async function handleCancel(vaccinationId: string) {
    if (!confirm("Batalkan vaksinasi ini?")) return;
    try {
      const res = await fetch(`/api/vaccination/${vaccinationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchVaccinations();
      }
    } catch {
      // ignored
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateTime(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      scheduled: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      scheduled: "Terjadwal",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {labels[status] || status}
      </span>
    );
  }

  function isOverdue(nextDueAt: string | null) {
    if (!nextDueAt) return false;
    return new Date(nextDueAt) < new Date();
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Vaksinasi</h1>
            <nav className="flex gap-1 bg-gray-100 rounded-lg p-1" role="tablist">
              {[
                { id: "list", label: "Semua" },
                { id: "due", label: "Jatuh Tempo" },
                { id: "upcoming", label: "Akan Datang" },
                { id: "create", label: "Tambah" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "create" && (
          <section aria-labelledby="create-heading">
            <h2 id="create-heading" className="text-lg font-medium text-gray-900 mb-4">
              Catat Vaksinasi Baru
            </h2>
            <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {formError}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="petId" className="block text-sm font-medium text-gray-700 mb-1">
                    Hewan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="petId"
                    value={formPetId}
                    onChange={(e) => setFormPetId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Pilih hewan</option>
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} ({pet.species})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                    Vaksin <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="productId"
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Pilih vaksin</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="administeredAt" className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Pemberian
                  </label>
                  <input
                    id="administeredAt"
                    type="datetime-local"
                    value={formAdministeredAt}
                    onChange={(e) => setFormAdministeredAt(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Kosongkan untuk terjadwal saja</p>
                </div>
                <div>
                  <label htmlFor="intervalDays" className="block text-sm font-medium text-gray-700 mb-1">
                    Interval Booster (hari)
                  </label>
                  <input
                    id="intervalDays"
                    type="number"
                    min="1"
                    value={formIntervalDays}
                    onChange={(e) => setFormIntervalDays(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Kosong = default per jenis vaksin</p>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "scheduled" | "completed")}
                    className="w-full max-w-xs px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="scheduled">Terjadwal</option>
                    <option value="completed">Selesai</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan
                  </label>
                  <textarea
                    id="notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {formSubmitting ? "Menyimpan..." : "Simpan Vaksinasi"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormPetId("");
                    setFormProductId("");
                    setFormAdministeredAt("");
                    setFormIntervalDays("");
                    setFormNotes("");
                    setFormStatus("scheduled");
                    setFormError("");
                    setActiveTab("list");
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {(activeTab === "list" || activeTab === "due" || activeTab === "upcoming") && (
          <section aria-labelledby="list-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="list-heading" className="text-lg font-medium text-gray-900">
                {activeTab === "due" && "Vaksinasi Jatuh Tempo"}
                {activeTab === "upcoming" && "Vaksinasi Akan Datang (30 hari)"}
                {activeTab === "list" && "Semua Vaksinasi"}
              </h2>
              {selectedPetId && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="scheduled">Terjadwal</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              )}
            </div>

            {activeTab === "list" && (
              <div className="mb-4">
                <label htmlFor="petFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Hewan
                </label>
                <select
                  id="petFilter"
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full max-w-xs px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Semua hewan</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {vaccinations.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  {activeTab === "due"
                    ? "Tidak ada vaksinasi yang jatuh tempo."
                    : activeTab === "upcoming"
                    ? "Tidak ada vaksinasi yang akan datang dalam 30 hari."
                    : "Belum ada vaksinasi tercatat."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Hewan</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Vaksin</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Diberikan</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Booster Berikut</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Interval</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vaccinations.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{v.pet_name}</p>
                          <p className="text-sm text-gray-500 capitalize">{v.species}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{v.name}</td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(v.status)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(v.administered_at)}</td>
                        <td className="py-3 px-4">
                          {v.next_due_at ? (
                            <>
                              <p className={`text-sm font-medium ${isOverdue(v.next_due_at) ? "text-red-600" : "text-gray-900"}`}>
                                {formatDate(v.next_due_at)}
                              </p>
                              {isOverdue(v.next_due_at) && (
                                <p className="text-xs text-red-500">TERLAMBAT</p>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-500">
                          {v.interval_days ? `${v.interval_days} hari` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {v.status === "scheduled" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdate(v.id, { administered_at: new Date().toISOString(), status: "completed" })
                                  }
                                  className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                                >
                                  Tandai Selesai
                                </button>
                                <button
                                  onClick={() => handleCancel(v.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                                >
                                  Batalkan
                                </button>
                              </>
                            )}
                            {v.status === "completed" && (
                              <button
                                onClick={() => handleUpdate(v.id, { status: "cancelled" })}
                                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                              >
                                Batalkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}