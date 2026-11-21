"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  sku: string;
  name: string;
  kind: string;
  price: number;
  taxable: boolean;
}

interface Batch {
  batchId: string;
  quantity: number;
  expiresAt: string | null;
}

interface StockItem {
  product: Product;
  stock: {
    productId: string;
    totalQuantity: number;
    batches: Batch[];
  };
}

interface Branch {
  id: string;
  name: string;
}

interface Mutation {
  id: string;
  product_id: string;
  batch_id: string | null;
  delta: number;
  kind: string;
  reason: string | null;
  ref: string | null;
  created_by: string;
  created_at: string;
}

export default function InventoryPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [products, setProducts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"stock" | "receive" | "adjust" | "mutations">("stock");

  // Forms
  const [receiveForm, setReceiveForm] = useState({
    productId: "",
    quantity: 1,
    costPrice: 0,
    batchCode: "",
    expiresAt: "",
    reason: "Penerimaan barang",
  });
  const [adjustForm, setAdjustForm] = useState({
    productId: "",
    delta: 0,
    reason: "",
  });
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [mutationsLoading, setMutationsLoading] = useState(false);

  // Load branches on mount
  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => setBranches(d.branches || []))
      .catch(() => {});
  }, []);

  // Load stock when branch changes
  useEffect(() => {
    if (!branchId) {
      setProducts([]);
      return;
    }
    setLoading(true);
    setError("");
    fetch(`/api/inventory?branchId=${branchId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setProducts(d.products || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [branchId]);

  const fmtRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/inventory/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...receiveForm, branchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal terima stok");
      alert("Stok diterima");
      // Refresh stock
      const fresh = await fetch(`/api/inventory?branchId=${branchId}`);
      const freshData = await fresh.json();
      setProducts(freshData.products || []);
      // Reset form
      setReceiveForm({ productId: "", quantity: 1, costPrice: 0, batchCode: "", expiresAt: "", reason: "Penerimaan barang" });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...adjustForm, branchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal penyesuaian stok");
      alert("Stok disesuaikan");
      // Refresh stock
      const fresh = await fetch(`/api/inventory?branchId=${branchId}`);
      const freshData = await fresh.json();
      setProducts(freshData.products || []);
      setAdjustForm({ productId: "", delta: 0, reason: "" });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const loadMutations = async (productId?: string) => {
    setMutationsLoading(true);
    try {
      const params = new URLSearchParams({ branchId });
      if (productId) params.set("productId", productId);
      const res = await fetch(`/api/inventory/mutations?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMutations(data.mutations || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMutationsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Inventori</h1>
      </div>

      <div className="mb-6 rounded-xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
        <label htmlFor="branch" className="block text-sm font-medium mb-2">Cabang</label>
        <select
          id="branch"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="w-full md:w-64 rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          <option value="">— Pilih cabang —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: "var(--petora-danger)" }}>{error}</p>}

      <nav className="mb-6 flex gap-2 border-b" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
        {[
          { id: "stock", label: "Stok" },
          { id: "receive", label: "Terima Stok" },
          { id: "adjust", label: "Penyesuaian" },
          { id: "mutations", label: "Mutasi" },
          { id: "procurement", label: "Pengadaan" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              if (tab.id === "mutations") loadMutations();
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "text-teal-600 border-teal-600"
                : "opacity-60 hover:opacity-100 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* STOK TAB */}
      {activeTab === "stock" && (
        <div>
          {loading ? (
            <p className="text-sm opacity-60 py-8 text-center">Memuat…</p>
          ) : branchId ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(0,0,0,0.12)" }}>
                    <th className="text-left py-2 px-3 font-medium">SKU</th>
                    <th className="text-left py-2 px-3 font-medium">Nama</th>
                    <th className="text-left py-2 px-3 font-medium">Jenis</th>
                    <th className="text-right py-2 px-3 font-medium">Total Stok</th>
                    <th className="text-left py-2 px-3 font-medium">Batch Detail</th>
                    <th className="text-right py-2 px-3 font-medium">Harga</th>
                    <th className="text-center py-2 px-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-sm opacity-60">
                        Belum ada data stok. Gunakan tab &ldquo;Terima Stok&rdquo; untuk menambah.
                      </td>
                    </tr>
                  ) : (
                    products.map((item) => (
                      <tr
                        key={item.product.id}
                        style={{
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        <td className="py-2 px-3 font-mono text-xs">{item.product.sku}</td>
                        <td className="py-2 px-3">{item.product.name}</td>
                        <td className="py-2 px-3">
                          <span
                            className="inline-block px-2 py-0.5 text-xs rounded"
                            style={{
                              backgroundColor:
                                item.product.kind === "product"
                                  ? "rgba(16,185,129,0.1)"
                                  : "rgba(99,102,241,0.1)",
                              color:
                                item.product.kind === "product"
                                  ? "var(--petora-primary)"
                                  : "var(--petora-accent)",
                            }}
                          >
                            {item.product.kind}
                          </span>
                        </td>
                        <td className="text-right py-2 px-3 font-medium">
                          {item.stock.totalQuantity}
                        </td>
                        <td className="py-2 px-3">
                          {item.stock.batches.length === 0 ? (
                            <span className="text-sm opacity-40">—</span>
                          ) : (
                            <ul className="space-y-1">
                              {item.stock.batches.map((b) => (
                                <li key={b.batchId} className="text-xs">
                                  <span className="font-mono">{b.batchId.slice(0, 8)}…</span>{" "}
                                  qty: <strong>{b.quantity}</strong>{" "}
                                  {b.expiresAt && (
                                    <span className="opacity-60 ml-1">
                                      (exp: {new Date(b.expiresAt).toLocaleDateString("id-ID")})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="text-right py-2 px-3">{fmtRupiah(item.product.price)}</td>
                        <td className="text-center py-2 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("adjust");
                              setAdjustForm({
                                productId: item.product.id,
                                delta: 0,
                                reason: "",
                              });
                            }}
                            className="text-xs px-2 py-1 rounded border"
                            style={{ borderColor: "rgba(0,0,0,0.12)" }}
                          >
                            Sesuaikan
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm opacity-60 py-8 text-center">Pilih cabang untuk melihat stok.</p>
          )}
        </div>
      )}

      {/* TERIMA STOK TAB */}
      {activeTab === "receive" && (
        <form onSubmit={handleReceive} className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
          <h3 className="text-lg font-medium">Terima Stok Baru (Pengadaan)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="recv-product" className="block text-sm font-medium mb-1">Produk</label>
              <select
                id="recv-product"
                value={receiveForm.productId}
                onChange={(e) => setReceiveForm({ ...receiveForm, productId: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
                required
              >
                <option value="">— Pilih produk —</option>
                {products.map((item) => (
                  <option key={item.product.id} value={item.product.id}>
                    {item.product.sku} — {item.product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="recv-qty" className="block text-sm font-medium mb-1">Jumlah</label>
              <input
                id="recv-qty"
                type="number"
                min="1"
                step="1"
                value={receiveForm.quantity}
                onChange={(e) => setReceiveForm({ ...receiveForm, quantity: Number(e.target.value) })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
                required
              />
            </div>
            <div>
              <label htmlFor="recv-price" className="block text-sm font-medium mb-1">Harga beli (Rp)</label>
              <input
                id="recv-price"
                type="number"
                min="0"
                step="1"
                value={receiveForm.costPrice}
                onChange={(e) => setReceiveForm({ ...receiveForm, costPrice: Number(e.target.value) })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
                required
              />
            </div>
            <div>
              <label htmlFor="recv-batch" className="block text-sm font-medium mb-1">Kode batch (opsional)</label>
              <input
                id="recv-batch"
                type="text"
                value={receiveForm.batchCode}
                onChange={(e) => setReceiveForm({ ...receiveForm, batchCode: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
            <div>
              <label htmlFor="recv-exp" className="block text-sm font-medium mb-1">Kedaluwarsa (opsional)</label>
              <input
                id="recv-exp"
                type="date"
                value={receiveForm.expiresAt}
                onChange={(e) => setReceiveForm({ ...receiveForm, expiresAt: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="recv-reason" className="block text-sm font-medium mb-1">Alasan</label>
              <input
                id="recv-reason"
                type="text"
                value={receiveForm.reason}
                onChange={(e) => setReceiveForm({ ...receiveForm, reason: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--petora-accent)" }}
          >
            Terima Stok
          </button>
        </form>
      )}

      {/* PENYESUAIAN STOK TAB */}
      {activeTab === "adjust" && (
        <form onSubmit={handleAdjust} className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
          <h3 className="text-lg font-medium">Penyesuaian Stok (Supervisor)</h3>
          <p className="text-sm opacity-60">
            Delta positif = tambah stok (buat batch penyesuaian). Delta negatif = kurangi stok (FEFO). Alasan wajib diisi.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="adj-product" className="block text-sm font-medium mb-1">Produk</label>
              <select
                id="adj-product"
                value={adjustForm.productId}
                onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
                required
              >
                <option value="">— Pilih produk —</option>
                {products.map((item) => (
                  <option key={item.product.id} value={item.product.id}>
                    {item.product.sku} — {item.product.name} (stok: {item.stock.totalQuantity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="adj-delta" className="block text-sm font-medium mb-1">Delta (+/-)</label>
              <input
                id="adj-delta"
                type="number"
                step="1"
                value={adjustForm.delta}
                onChange={(e) => setAdjustForm({ ...adjustForm, delta: Number(e.target.value) })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="adj-reason" className="block text-sm font-medium mb-1">Alasan (wajib)</label>
              <input
                id="adj-reason"
                type="text"
                placeholder="Contoh: Kerusakan expired, koreksi opname, retur supplier"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--petora-warning)" }}
          >
            Simpan Penyesuaian
          </button>
        </form>
      )}

      {/* MUTASI TAB */}
      {activeTab === "mutations" && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <label htmlFor="mut-product" className="text-sm font-medium">Filter produk</label>
            <select
              id="mut-product"
              onChange={(e) => loadMutations(e.target.value || undefined)}
              className="w-full md:w-64 rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              <option value="">Semua produk</option>
              {products.map((item) => (
                <option key={item.product.id} value={item.product.id}>
                  {item.product.sku} — {item.product.name}
                </option>
              ))}
            </select>
          </div>
          {mutationsLoading ? (
            <p className="text-sm opacity-60 py-8 text-center">Memuat mutasi…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(0,0,0,0.12)" }}>
                    <th className="text-left py-2 px-3 font-medium">Waktu</th>
                    <th className="text-left py-2 px-3 font-medium">Produk</th>
                    <th className="text-center py-2 px-3 font-medium">Delta</th>
                    <th className="text-left py-2 px-3 font-medium">Jenis</th>
                    <th className="text-left py-2 px-3 font-medium">Alasan</th>
                    <th className="text-left py-2 px-3 font-medium">Ref</th>
                    <th className="text-left py-2 px-3 font-medium">Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {mutations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-sm opacity-60">
                        Tidak ada mutasi untuk cabang ini.
                      </td>
                    </tr>
                  ) : (
                    mutations.map((m) => (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        <td className="py-2 px-3 font-mono text-xs">{new Date(m.created_at).toLocaleString("id-ID")}</td>
                        <td className="py-2 px-3">{m.product_id.slice(0, 8)}…</td>
                        <td className="text-center py-2 px-3 font-medium" style={{ color: m.delta > 0 ? "green" : "red" }}>
                          {m.delta > 0 ? "+" : ""}{m.delta}
                        </td>
                        <td className="py-2 px-3 capitalize">{m.kind}</td>
                        <td className="py-2 px-3 text-sm opacity-80">{m.reason || "—"}</td>
                        <td className="py-2 px-3 text-sm font-mono opacity-60">{m.ref || "—"}</td>
                        <td className="py-2 px-3 text-sm font-mono opacity-60">{m.created_by.slice(0, 8)}…</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}