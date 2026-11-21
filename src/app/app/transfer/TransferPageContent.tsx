"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Transfer {
  id: string;
  from_branch_id: string;
  from_branch_name: string;
  to_branch_id: string;
  to_branch_name: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  batch_code: string | null;
  expires_at: string | null;
  quantity: number;
  status: "draft" | "sent" | "received" | "cancelled";
  notes: string | null;
  requested_by: string | null;
  sent_at: string | null;
  sent_by: string | null;
  received_at: string | null;
  received_by: string | null;
  received_quantity: number | null;
  discrepancy_notes: string | null;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batch_code: string;
  quantity: number;
  expires_at: string | null;
}

export default function TransferPageContent() {
  const searchParams = useSearchParams();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"outgoing" | "incoming" | "create" | "all">("outgoing");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state - create
  const [formFromBranchId, setFormFromBranchId] = useState("");
  const [formToBranchId, setFormToBranchId] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formBatchId, setFormBatchId] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchTransfers = useCallback(async () => {
    let url = "/api/stock-transfer?";
    if (activeTab === "outgoing") {
      url += `fromBranchId=${formFromBranchId || searchParams.get("branchId") || ""}&status=draft`;
    } else if (activeTab === "incoming") {
      url += `toBranchId=${formToBranchId || searchParams.get("branchId") || ""}&status=sent`;
    } else if (activeTab === "all") {
      if (statusFilter !== "all") {
        url += `status=${statusFilter}`;
      }
    }
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers || []);
      }
    } catch {
      // ignored
    }
  }, [activeTab, formFromBranchId, formToBranchId, statusFilter, searchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, branchesRes] = await Promise.all([
        fetch("/api/products?type=all&limit=500"),
        fetch("/api/branches"),
      ]);
      const [productsData, branchesData] = await Promise.all([productsRes.json(), branchesRes.json()]);
      setProducts(productsData.products || []);
      setBranches(branchesData.branches || []);
    } catch {
      // ignored
    }
    await fetchTransfers();
    setLoading(false);
  }, [fetchTransfers]);

  async function fetchBatchesForProduct(productId: string, branchId: string) {
    if (!productId || !branchId) {
      setBatches([]);
      setFormBatchId("");
      return;
    }
    try {
      // Use inventory API to get batches with stock
      const res = await fetch(`/api/inventory?branchId=${branchId}&productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        const stockData = data.products?.[0];
        if (stockData?.batches) {
          setBatches(stockData.batches.map((b: { batchId: string; quantity: number; expiresAt: string | null }) => ({
            id: b.batchId,
            batch_code: b.batchId.slice(0, 8),
            quantity: b.quantity,
            expires_at: b.expiresAt,
          })));
        } else {
          setBatches([]);
        }
      }
    } catch {
      setBatches([]);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/stock-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromBranchId: formFromBranchId,
          toBranchId: formToBranchId,
          productId: formProductId,
          batchId: formBatchId || null,
          quantity: Number(formQuantity),
          notes: formNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal membuat transfer");
        return;
      }
      setFormFromBranchId("");
      setFormToBranchId("");
      setFormProductId("");
      setFormBatchId("");
      setFormQuantity("");
      setFormNotes("");
      setFormError("");
      setActiveTab("outgoing");
      await fetchTransfers();
    } catch {
      setFormError("Terjadi kesalahan jaringan");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleAction(transferId: string, action: "send" | "receive" | "cancel", receivedQuantity?: number) {
    if (action === "cancel" && !confirm("Batalkan transfer ini?")) return;
    if (action === "receive" && !confirm("Terima transfer ini?")) return;

    try {
      const body: Record<string, unknown> = { action };
      if (action === "receive" && receivedQuantity !== undefined) {
        body.receivedQuantity = receivedQuantity;
      }
      const res = await fetch(`/api/stock-transfer/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchTransfers();
      }
    } catch {
      // ignored
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

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      received: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      draft: "Draft",
      sent: "Dikirim",
      received: "Diterima",
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

  useEffect(() => {
    if (formProductId && formFromBranchId) {
      fetchBatchesForProduct(formProductId, formFromBranchId);
    } else {
      setBatches([]);
      setFormBatchId("");
    }
  }, [formProductId, formFromBranchId]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

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
            <h1 className="text-xl font-semibold text-gray-900">Transfer Stok</h1>
            <nav className="flex gap-1 bg-gray-100 rounded-lg p-1" role="tablist">
              {[
                { id: "outgoing", label: "Keluar" },
                { id: "incoming", label: "Masuk" },
                { id: "all", label: "Semua" },
                { id: "create", label: "Buat Transfer" },
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
              Buat Transfer Stok Baru
            </h2>
            <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {formError}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fromBranchId" className="block text-sm font-medium text-gray-700 mb-1">
                    Cabang Asal <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="fromBranchId"
                    value={formFromBranchId}
                    onChange={(e) => {
                      setFormFromBranchId(e.target.value);
                      setFormBatchId("");
                      setBatches([]);
                    }}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Pilih cabang asal</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="toBranchId" className="block text-sm font-medium text-gray-700 mb-1">
                    Cabang Tujuan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="toBranchId"
                    value={formToBranchId}
                    onChange={(e) => setFormToBranchId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Pilih cabang tujuan</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                    Produk <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="productId"
                    value={formProductId}
                    onChange={(e) => {
                      setFormProductId(e.target.value);
                      setFormBatchId("");
                      setBatches([]);
                    }}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Pilih produk</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 mb-1">
                    Batch (opsional)
                  </label>
                  <select
                    id="batchId"
                    value={formBatchId}
                    onChange={(e) => setFormBatchId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Pilih batch (FEFO otomatis jika kosong)</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_code} - Qty: {batch.quantity} {batch.expires_at && ` - Exp: ${new Date(batch.expires_at).toLocaleDateString("id-ID")}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
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
                  {formSubmitting ? "Membuat..." : "Buat Transfer (Draft)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormFromBranchId("");
                    setFormToBranchId("");
                    setFormProductId("");
                    setFormBatchId("");
                    setFormQuantity("");
                    setFormNotes("");
                    setFormError("");
                    setActiveTab("outgoing");
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {(activeTab === "outgoing" || activeTab === "incoming" || activeTab === "all") && (
          <section aria-labelledby="list-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="list-heading" className="text-lg font-medium text-gray-900">
                {activeTab === "outgoing" && "Transfer Keluar (Draft)"}
                {activeTab === "incoming" && "Transfer Masuk (Menunggu Diterima)"}
                {activeTab === "all" && "Semua Transfer"}
              </h2>
              {activeTab === "all" && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Dikirim</option>
                  <option value="received">Diterima</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              )}
            </div>

            {transfers.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  {activeTab === "outgoing"
                    ? "Tidak ada transfer keluar (draft)."
                    : activeTab === "incoming"
                    ? "Tidak ada transfer masuk menunggu diterima."
                    : "Belum ada transfer."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Produk</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Batch</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Asal → Tujuan</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Qty</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Dibuat</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{t.product_name}</p>
                          <p className="text-sm text-gray-500">{t.product_sku}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {t.batch_code || (t.expires_at ? `Exp: ${new Date(t.expires_at).toLocaleDateString("id-ID")}` : "-")}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <p className="text-gray-900">{t.from_branch_name}</p>
                          <p className="text-gray-500">→ {t.to_branch_name}</p>
                        </td>
                        <td className="py-3 px-4 text-center text-sm font-medium text-gray-900">{t.quantity}</td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(t.status)}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDateTime(t.created_at)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {t.status === "draft" && (
                              <>
                                <button
                                  onClick={() => handleAction(t.id, "send")}
                                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                                >
                                  Kirim
                                </button>
                                <button
                                  onClick={() => handleAction(t.id, "cancel")}
                                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                                >
                                  Batalkan
                                </button>
                              </>
                            )}
                            {t.status === "sent" && (
                              <>
                                <button
                                  onClick={() => {
                                    const qty = prompt("Jumlah yang diterima:", String(t.quantity));
                                    if (qty) handleAction(t.id, "receive", Number(qty));
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                                >
                                  Terima
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