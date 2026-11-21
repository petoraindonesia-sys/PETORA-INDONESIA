"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Boarding {
  id: string;
  pet_id: string;
  pet_name: string;
  species: string;
  owner_name: string;
  cage_code: string | null;
  branch_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  cage_rate_per_day: number;
  total_days: number;
  total_cage_fee: number;
  notes: string | null;
  status: "checked_in" | "checked_out" | "cancelled";
}

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface Cage {
  id: string;
  code: string;
  name: string | null;
  size: string | null;
  rate_per_day: number;
  is_active: boolean;
}

export default function BoardingPageContent() {
  const searchParams = useSearchParams();
  const [boardings, setBoardings] = useState<Boarding[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [cages, setCages] = useState<Cage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history" | "checkin" | "cages">("active");
  const [selectedPetId, setSelectedPetId] = useState(searchParams.get("petId") || "");

  // Form state - check-in
  const [formPetId, setFormPetId] = useState("");
  const [formCageId, setFormCageId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formCageRate, setFormCageRate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state - cages
  const [cageCode, setCageCode] = useState("");
  const [cageName, setCageName] = useState("");
  const [cageSize, setCageSize] = useState("");
  const [cageRate, setCageRate] = useState("");
  const [cageActive, setCageActive] = useState(true);
  const [cageSubmitting, setCageSubmitting] = useState(false);
  const [cageError, setCageError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [petsRes, cagesRes] = await Promise.all([
        fetch("/api/pets?limit=500"),
        fetch("/api/cages?branchId=" + (formBranchId || searchParams.get("branchId") || "")),
      ]);
      const [petsData, cagesData] = await Promise.all([petsRes.json(), cagesRes.json()]);
      setPets(petsData.pets || []);
      setCages(cagesData.cages || []);
      if (cagesData.cages?.[0] && !formCageRate) {
        setFormCageRate(String(cagesData.cages[0].rate_per_day));
      }
    } catch {
      // ignored
    }
    // Fetch boardings inline to avoid dependency issues
    let url = "/api/boarding?";
    if (activeTab === "active") {
      url += "status=active";
    } else if (selectedPetId) {
      url += `petId=${selectedPetId}`;
    } else {
      url += "status=active";
    }
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBoardings(data.boarding || []);
      }
    } catch {
      // ignored
    }
    setLoading(false);
  }, [formBranchId, searchParams, activeTab, selectedPetId, formCageRate]);

  const fetchBoardings = useCallback(async () => {
    let url = "/api/boarding?";
    if (activeTab === "active") {
      url += "status=active";
    } else if (selectedPetId) {
      url += `petId=${selectedPetId}`;
    } else {
      url += "status=active";
    }
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBoardings(data.boarding || []);
      }
    } catch {
      // ignored
    }
  }, [activeTab, selectedPetId]);

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/boarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: formPetId,
          cageId: formCageId || null,
          branchId: formBranchId,
          cageRatePerDay: formCageRate ? Number(formCageRate) : null,
          notes: formNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal check-in");
        return;
      }
      setFormPetId("");
      setFormCageId("");
      setFormNotes("");
      setFormError("");
      setActiveTab("active");
      await fetchBoardings();
    } catch {
      setFormError("Terjadi kesalahan jaringan");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleCheckOut(boardingId: string) {
    if (!confirm("Check-out hewan ini? Biaya kandang akan dihitung otomatis.")) return;
    try {
      const res = await fetch(`/api/boarding/${boardingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      if (res.ok) {
        await fetchBoardings();
      }
    } catch {
      // ignored
    }
  }

  async function handleCancel(boardingId: string) {
    if (!confirm("Batalkan rawat inap ini?")) return;
    try {
      const res = await fetch(`/api/boarding/${boardingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        await fetchBoardings();
      }
    } catch {
      // ignored
    }
  }

  async function handleCageSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCageError("");
    setCageSubmitting(true);
    try {
      const res = await fetch("/api/cages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: formBranchId,
          code: cageCode,
          name: cageName || null,
          size: cageSize || null,
          ratePerDay: Number(cageRate),
          isActive: cageActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCageError(data.error || "Gagal menyimpan kandang");
        return;
      }
      setCageCode("");
      setCageName("");
      setCageSize("");
      setCageRate("");
      setCageError("");
      await fetchData();
    } catch {
      setCageError("Terjadi kesalahan jaringan");
    } finally {
      setCageSubmitting(false);
    }
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

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      checked_in: "bg-blue-100 text-blue-800",
      checked_out: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      checked_in: "Dirawat",
      checked_out: "Selesai",
      cancelled: "Dibatalkan",
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {labels[status] || status}
      </span>
    );
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
            <h1 className="text-xl font-semibold text-gray-900">Rawat Inap</h1>
            <nav className="flex gap-1 bg-gray-100 rounded-lg p-1" role="tablist">
              {[
                { id: "active", label: "Aktif" },
                { id: "history", label: "Riwayat" },
                { id: "checkin", label: "Check-in" },
                { id: "cages", label: "Kandang" },
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
        {activeTab === "checkin" && (
          <section aria-labelledby="checkin-heading">
            <h2 id="checkin-heading" className="text-lg font-medium text-gray-900 mb-4">
              Check-in Rawat Inap Baru
            </h2>
            <form onSubmit={handleCheckIn} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
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
                  <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-1">
                    Cabang <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="branchId"
                    value={formBranchId}
                    onChange={(e) => {
                      setFormBranchId(e.target.value);
                      setFormCageId("");
                      setFormCageRate("");
                    }}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Pilih cabang</option>
                    <option value="cabang-1">Cabang Utama (WIB)</option>
                    <option value="cabang-2">Cabang Cabang (WITA)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cageId" className="block text-sm font-medium text-gray-700 mb-1">
                    Kandang
                  </label>
                  <select
                    id="cageId"
                    value={formCageId}
                    onChange={(e) => {
                      setFormCageId(e.target.value);
                      const cage = cages.find((c) => c.id === e.target.value);
                      if (cage) setFormCageRate(String(cage.rate_per_day));
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Pilih kandang (opsional)</option>
                    {cages.map((cage) => (
                      <option key={cage.id} value={cage.id}>
                        {cage.code} - {cage.name || "Tanpa nama"} (Rp{cage.rate_per_day.toLocaleString("id-ID")}/hari)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cageRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Tarif Kandang/Hari (override) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cageRate"
                    type="number"
                    min="0"
                    step="1000"
                    value={formCageRate}
                    onChange={(e) => setFormCageRate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
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
                  {formSubmitting ? "Memproses..." : "Check-in"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormPetId("");
                    setFormCageId("");
                    setFormNotes("");
                    setFormError("");
                    setActiveTab("active");
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {activeTab === "cages" && (
          <section aria-labelledby="cages-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="cages-heading" className="text-lg font-medium text-gray-900">
                Kelola Kandang
              </h2>
            </div>

            <form onSubmit={handleCageSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mb-8">
              {cageError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {cageError}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cageCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Kandang <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cageCode"
                    type="text"
                    value={cageCode}
                    onChange={(e) => setCageCode(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cageRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Tarif/Hari <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cageRate"
                    type="number"
                    min="0"
                    step="1000"
                    value={cageRate}
                    onChange={(e) => setCageRate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cageName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama
                  </label>
                  <input
                    id="cageName"
                    type="text"
                    value={cageName}
                    onChange={(e) => setCageName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cageSize" className="block text-sm font-medium text-gray-700 mb-1">
                    Ukuran
                  </label>
                  <select
                    id="cageSize"
                    value={cageSize}
                    onChange={(e) => setCageSize(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Pilih ukuran</option>
                    <option value="small">Kecil</option>
                    <option value="medium">Sedang</option>
                    <option value="large">Besar</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cageActive"
                    checked={cageActive}
                    onChange={(e) => setCageActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="cageActive" className="text-sm text-gray-700">
                    Aktif
                  </label>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={cageSubmitting}
                  className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {cageSubmitting ? "Menyimpan..." : "Simpan Kandang"}
                </button>
              </div>
            </form>

            {cages.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Belum ada kandang.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Kode</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Nama</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Ukuran</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Tarif/Hari</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cages.map((cage) => (
                      <tr key={cage.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm text-gray-900">{cage.code}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{cage.name || "-"}</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600 capitalize">{cage.size || "-"}</td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(cage.rate_per_day)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            cage.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {cage.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {(activeTab === "active" || activeTab === "history") && (
          <section aria-labelledby="list-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="list-heading" className="text-lg font-medium text-gray-900">
                {activeTab === "active" ? "Hewan Sedang Dirawat" : "Riwayat Rawat Inap"}
              </h2>
            </div>

            {activeTab === "history" && (
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

            {boardings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  {activeTab === "active"
                    ? "Tidak ada hewan yang sedang dirawat inap."
                    : "Belum ada riwayat rawat inap."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Hewan</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Kandang</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Check-in</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Check-out</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Hari</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Tarif/Hari</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Biaya Kandang</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {boardings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{b.pet_name}</p>
                          <p className="text-sm text-gray-500 capitalize">{b.species}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{b.cage_code || "-"}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(b.checked_in_at)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(b.checked_out_at)}</td>
                        <td className="py-3 px-4 text-center text-sm font-medium text-gray-900">{b.total_days}</td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">{formatCurrency(b.cage_rate_per_day)}</td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">{formatCurrency(b.total_cage_fee)}</td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(b.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {b.status === "checked_in" && (
                              <>
                                <button
                                  onClick={() => handleCheckOut(b.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                                >
                                  Check-out
                                </button>
                                <button
                                  onClick={() => handleCancel(b.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                                >
                                  Batalkan
                                </button>
                              </>
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