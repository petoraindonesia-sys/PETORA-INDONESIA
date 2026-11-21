"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  weight_kg: string | null;
  color: string | null;
  microchip: string | null;
  is_active: boolean;
}

interface MedicalRecord {
  id: string;
  pet_id: string;
  visit_id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  next_vaccine_due: string | null;
  created_at: string;
  visit_code: string;
}

interface Invoice {
  id: string;
  invoice_no: string;
  status: string;
  total: string;
  paid: string;
  due_date: string | null;
  created_at: string;
  pet_name: string | null;
  visit_code: string | null;
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pets" | "medical" | "invoices">("pets");

  const fetchData = useCallback(async () => {
    try {
      const [petsRes, recordsRes, invoicesRes] = await Promise.all([
        fetch("/api/portal/pets"),
        fetch("/api/portal/medical"),
        fetch("/api/portal/invoices"),
      ]);
      if (petsRes.status === 401 || recordsRes.status === 401 || invoicesRes.status === 401) {
        router.push("/portal/login");
        return;
      }
      const [petsData, recordsData, invoicesData] = await Promise.all([
        petsRes.json(),
        recordsRes.json(),
        invoicesRes.json(),
      ]);
      setPets(petsData.pets || []);
      setRecords(recordsData.records || []);
      setInvoices(invoicesData.invoices || []);
    } catch {
      // ignored
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.push("/portal/login");
    router.refresh();
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [router, fetchData]);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCurrency(value: string) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Portal Pemilik Hewan</h1>
              <nav className="flex gap-1 bg-gray-100 rounded-lg p-1" role="tablist">
                {[
                  { id: "pets", label: "Hewan Saya" },
                  { id: "medical", label: "Riwayat Medis" },
                  { id: "invoices", label: "Tagihan" },
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
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "pets" && (
          <section aria-labelledby="pets-heading">
            <h2 id="pets-heading" className="text-lg font-medium text-gray-900 mb-4">
              Hewan Saya
            </h2>
            {pets.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Belum ada hewan terdaftar.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pets.map((pet) => (
                  <article
                    key={pet.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium text-gray-900">{pet.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      {pet.species}
                      {pet.breed && ` • ${pet.breed}`}
                    </p>
                    <dl className="mt-3 space-y-1 text-sm text-gray-600">
                      {pet.birth_date && (
                        <div>
                          <dt className="font-medium">Lahir:</dt>
                          <dd>{formatDate(pet.birth_date)}</dd>
                        </div>
                      )}
                      {pet.weight_kg && (
                        <div>
                          <dt className="font-medium">Berat:</dt>
                          <dd>{Number(pet.weight_kg).toFixed(1)} kg</dd>
                        </div>
                      )}
                      {pet.color && (
                        <div>
                          <dt className="font-medium">Warna:</dt>
                          <dd>{pet.color}</dd>
                        </div>
                      )}
                      {pet.microchip && (
                        <div>
                          <dt className="font-medium">Mikrochip:</dt>
                          <dd className="font-mono">{pet.microchip}</dd>
                        </div>
                      )}
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "medical" && (
          <section aria-labelledby="medical-heading">
            <h2 id="medical-heading" className="text-lg font-medium text-gray-900 mb-4">
              Riwayat Medis
            </h2>
            {records.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Belum ada riwayat medis yang dibagikan.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Klinik akan membagikan rekam medis setelah kunjungan selesai.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <article
                    key={record.id}
                    className="bg-white rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">Kunjungan: {record.visit_code}</p>
                        <p className="text-sm text-gray-500">{formatDate(record.created_at)}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                      {record.subjective && (
                        <div>
                          <dt className="font-medium text-gray-700">Keluhan (Subjective):</dt>
                          <dd className="text-gray-600 mt-1 whitespace-pre-wrap">{record.subjective}</dd>
                        </div>
                      )}
                      {record.objective && (
                        <div>
                          <dt className="font-medium text-gray-700">Pemeriksaan (Objective):</dt>
                          <dd className="text-gray-600 mt-1 whitespace-pre-wrap">{record.objective}</dd>
                        </div>
                      )}
                      {record.assessment && (
                        <div>
                          <dt className="font-medium text-gray-700">Diagnosis (Assessment):</dt>
                          <dd className="text-gray-600 mt-1 whitespace-pre-wrap">{record.assessment}</dd>
                        </div>
                      )}
                      {record.plan && (
                        <div>
                          <dt className="font-medium text-gray-700">Rencana (Plan):</dt>
                          <dd className="text-gray-600 mt-1 whitespace-pre-wrap">{record.plan}</dd>
                        </div>
                      )}
                      {record.next_vaccine_due && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <dt className="font-medium text-blue-800">Vaksin Berikutnya:</dt>
                          <dd className="text-blue-700 mt-1">{formatDate(record.next_vaccine_due)}</dd>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "invoices" && (
          <section aria-labelledby="invoices-heading">
            <h2 id="invoices-heading" className="text-lg font-medium text-gray-900 mb-4">
              Tagihan
            </h2>
            {invoices.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Belum ada tagihan.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">No. Tagihan</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Hewan</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Kunjungan</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Total</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm text-gray-900">{inv.invoice_no}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{inv.pet_name || "-"}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{inv.visit_code || "-"}</td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(inv.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              inv.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : inv.status === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {inv.status === "paid" && "Lunas"}
                            {inv.status === "partial" && "Sebagian"}
                            {inv.status === "unpaid" && "Belum Bayar"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(inv.created_at)}</td>
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