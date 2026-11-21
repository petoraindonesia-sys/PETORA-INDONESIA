"use client";

/**
 * Halaman /app/cashier — kasir. Membuat tagihan (item, diskon, PPN, pembulatan) dan
 * mencatat pembayaran (BR-008/009/010/018/020/021). Cabang dipilih dari daftar cabang
 * (RLS membatasi yang terlihat oleh aktor). Perhitungan ulang di server (modul murni);
 * UI hanya mengirim input.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RoundingStep = 0 | 100 | 500 | 1000;
type PaymentMethod = "cash" | "transfer" | "qris" | "card";

interface Branch {
  id: string;
  name: string;
  timezone: string;
  isActive: boolean;
}

interface LineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
}

interface InvoiceSummary {
  id: string;
  branchId: string;
  status: string;
  total: number;
  paidAmount: number;
  createdAt: string;
}

const ROUNDING_OPTIONS: { value: RoundingStep; label: string }[] = [
  { value: 0, label: "Tanpa pembulatan" },
  { value: 100, label: "Rp100" },
  { value: 500, label: "Rp500" },
  { value: 1000, label: "Rp1.000" },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "transfer", label: "Transfer" },
  { value: "qris", label: "QRIS" },
  { value: "card", label: "Kartu" },
];

function rupiah(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export default function CashierPage() {
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [items, setItems] = useState<LineItem[]>([
    { name: "", quantity: 1, unitPrice: 0, taxable: true },
  ]);
  const [discountKind, setDiscountKind] = useState<"none" | "percent" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [rounding, setRounding] = useState<RoundingStep>(0);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRatePercent, setTaxRatePercent] = useState(0);
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [activeInvoice, setActiveInvoice] = useState<{
    id: string;
    total: number;
    paidAmount: number;
    status: string;
  } | null>(null);

  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payAmount, setPayAmount] = useState(0);
  const [payCashReceived, setPayCashReceived] = useState(0);
  const [paying, setPaying] = useState(false);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  async function loadBranches() {
    setLoadingBranches(true);
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
      setLoadingBranches(false);
    }
  }

  async function loadInvoices() {
    if (!branchId) {
      setInvoices([]);
      return;
    }
    try {
      const res = await fetch(`/api/invoices?branchId=${branchId}&limit=20`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setInvoices(data.invoices ?? []);
    } catch {
      /* biarkan daftar lama tetap tampil */
    }
  }

  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (branchId) loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const subtotal = items.reduce((a, it) => a + it.quantity * it.unitPrice, 0);
  const previewDiscount =
    discountKind === "percent"
      ? Math.round((subtotal * Math.min(Math.max(discountValue, 0), 100)) / 100)
      : discountKind === "fixed"
        ? discountValue
        : 0;

  function addItem() {
    setItems((prev) => [...prev, { name: "", quantity: 1, unitPrice: 0, taxable: true }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!branchId) {
        setError("Pilih cabang terlebih dahulu");
        return;
      }
      const cleanItems = items
        .filter((it) => it.name.trim() && it.unitPrice > 0)
        .map((it) => ({
          name: it.name.trim(),
          quantity: Math.max(1, Math.floor(it.quantity)),
          unitPrice: Math.round(it.unitPrice),
          taxable: it.taxable,
        }));
      if (cleanItems.length === 0) {
        setError("Isi minimal satu item dengan nama dan harga");
        return;
      }
      const discount =
        discountKind === "percent"
          ? { kind: "percent" as const, value: discountValue }
          : discountKind === "fixed"
            ? { kind: "fixed" as const, amount: Math.round(discountValue) }
            : undefined;
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          items: cleanItems,
          tax: {
            enabled: taxEnabled,
            ratePercent: taxRatePercent,
            pricesIncludeTax: pricesIncludeTax,
          },
          rounding,
          discount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat tagihan");
        return;
      }
      const inv = data.invoice;
      setActiveInvoice({
        id: inv.invoiceId,
        total: inv.total,
        paidAmount: 0,
        status: "unpaid",
      });
      setPayAmount(inv.total);
      setPayCashReceived(0);
      setPayMessage(null);
      setItems([{ name: "", quantity: 1, unitPrice: 0, taxable: true }]);
      setDiscountKind("none");
      setDiscountValue(0);
      setRounding(0);
      await loadInvoices();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  async function onPay(e: React.FormEvent) {
    e.preventDefault();
    if (!activeInvoice) return;
    setPaying(true);
    setPayMessage(null);
    try {
      const body: Record<string, unknown> = {
        method: payMethod,
        amount: payAmount,
      };
      if (payMethod === "cash") body.cashReceived = payCashReceived;
      const res = await fetch(`/api/invoices/${activeInvoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayMessage(`Gagal: ${data.error ?? "kesalahan"}`);
        return;
      }
      const p = data.payment;
      const remaining = p.total - p.paidAmount;
      setActiveInvoice({
        id: p.invoiceId ?? activeInvoice.id,
        total: p.total,
        paidAmount: p.paidAmount,
        status: p.invoiceStatus,
      });
      setPayMessage(
        p.status === "duplicate"
          ? "Pembayaran ini sudah tercatat sebelumnya."
          : p.invoiceStatus === "paid"
            ? `Lunas.${p.changeAmount ? ` Kembalian ${rupiah(p.changeAmount)}.` : ""}`
            : `Pembayaran tercatat. Sisa ${rupiah(remaining)}.`,
      );
      setPayAmount(Math.max(0, remaining));
      await loadInvoices();
    } catch {
      setPayMessage("Tidak dapat terhubung ke server");
    } finally {
      setPaying(false);
    }
  }

  const activeRemaining = activeInvoice ? activeInvoice.total - activeInvoice.paidAmount : 0;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Kasir</h1>
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
        {loadingBranches ? (
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

      <form
        onSubmit={onCreate}
        className="mb-6 rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
      >
        <h2 className="text-lg font-medium">Item tagihan</h2>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <input
                aria-label={`Nama item ${i + 1}`}
                placeholder="Nama item / jasa"
                required
                value={it.name}
                onChange={(e) => updateItem(i, { name: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
            <div className="col-span-2">
              <input
                aria-label={`Jumlah item ${i + 1}`}
                type="number"
                min={1}
                step={1}
                value={it.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
            <div className="col-span-2">
              <input
                aria-label={`Harga satuan item ${i + 1}`}
                type="number"
                min={0}
                step={1}
                placeholder="Harga"
                value={it.unitPrice || ""}
                onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={it.taxable}
                  onChange={(e) => updateItem(i, { taxable: e.target.checked })}
                />
                Kena PPN
              </label>
            </div>
            <div className="col-span-1">
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={items.length === 1}
                aria-label={`Hapus item ${i + 1}`}
                className="w-full rounded-xl border px-2 py-2 text-sm disabled:opacity-40"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          + Tambah item
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label htmlFor="discount" className="block text-sm font-medium mb-1">
              Diskon
            </label>
            <select
              id="discount"
              value={discountKind}
              onChange={(e) => setDiscountKind(e.target.value as typeof discountKind)}
              className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              <option value="none">Tanpa diskon</option>
              <option value="percent">Persen (%)</option>
              <option value="fixed">Nominal (Rp)</option>
            </select>
            {discountKind !== "none" ? (
              <input
                aria-label="Nilai diskon"
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            ) : null}
          </div>
          <div>
            <label htmlFor="rounding" className="block text-sm font-medium mb-1">
              Pembulatan
            </label>
            <select
              id="rounding"
              value={rounding}
              onChange={(e) => setRounding(Number(e.target.value) as RoundingStep)}
              className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              {ROUNDING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
              />
              Aktifkan PPN
            </label>
            {taxEnabled ? (
              <div className="mt-2 space-y-2">
                <input
                  aria-label="Tarif PPN persen"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                  placeholder="Tarif %"
                  className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                />
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={pricesIncludeTax}
                    onChange={(e) => setPricesIncludeTax(e.target.checked)}
                  />
                  Harga sudah termasuk PPN
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className="text-right text-sm pt-2" style={{ color: "var(--petora-accent)" }}>
          Subtotal: {rupiah(subtotal)} · Diskon: {rupiah(Math.min(previewDiscount, subtotal))}
        </div>

        <button
          type="submit"
          disabled={saving || branches.length === 0}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--petora-accent)" }}
        >
          {saving ? "Membuat tagihan…" : "Buat tagihan"}
        </button>
      </form>

      {activeInvoice ? (
        <form
          onSubmit={onPay}
          className="mb-6 rounded-2xl p-5 space-y-3"
          style={{ backgroundColor: "rgba(36,138,61,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Pembayaran</h2>
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: "rgba(36,138,61,0.12)", color: "var(--petora-success)" }}
            >
              Tagihan {activeInvoice.id.slice(0, 8)}
            </span>
          </div>
          <p className="text-sm">
            Total {rupiah(activeInvoice.total)} · Dibayar {rupiah(activeInvoice.paidAmount)} · Sisa{" "}
            {rupiah(activeRemaining)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="payMethod" className="block text-sm font-medium mb-1">
                Metode
              </label>
              <select
                id="payMethod"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="payAmount" className="block text-sm font-medium mb-1">
                Jumlah bayar
              </label>
              <input
                id="payAmount"
                type="number"
                min={1}
                step={1}
                value={payAmount || ""}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
            {payMethod === "cash" ? (
              <div>
                <label htmlFor="cash" className="block text-sm font-medium mb-1">
                  Uang diterima
                </label>
                <input
                  id="cash"
                  type="number"
                  min={0}
                  step={1}
                  value={payCashReceived || ""}
                  onChange={(e) => setPayCashReceived(Number(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-teal-600"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                />
              </div>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={paying || payAmount <= 0}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--petora-success)" }}
          >
            {paying ? "Mencatat…" : "Catat pembayaran"}
          </button>
          {payMessage ? <p className="text-sm mt-1">{payMessage}</p> : null}
        </form>
      ) : null}

      <section>
        <h2 className="text-lg font-medium mb-2">Tagihan terakhir</h2>
        {invoices.length === 0 ? (
          <p className="text-sm opacity-60">Belum ada tagihan di cabang ini.</p>
        ) : (
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                <div>
                  <p className="font-medium">
                    {inv.id.slice(0, 8)} · {rupiah(inv.total)}
                  </p>
                  <p className="text-sm opacity-60">
                    {new Date(inv.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        inv.status === "paid"
                          ? "rgba(36,138,61,0.12)"
                          : inv.status === "partial"
                            ? "rgba(201,142,22,0.12)"
                            : "rgba(0,0,0,0.06)",
                      color:
                        inv.status === "paid"
                          ? "var(--petora-success)"
                          : inv.status === "partial"
                            ? "var(--petora-warning, #b8860b)"
                            : "inherit",
                    }}
                  >
                    {inv.status === "paid"
                      ? "Lunas"
                      : inv.status === "partial"
                        ? `Sisa ${rupiah(inv.total - inv.paidAmount)}`
                        : "Belum bayar"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveInvoice({
                        id: inv.id,
                        total: inv.total,
                        paidAmount: inv.paidAmount,
                        status: inv.status,
                      })
                    }
                    className="ml-2 text-xs underline opacity-70"
                  >
                    Bayar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
