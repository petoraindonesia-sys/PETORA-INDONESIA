/**
 * Kalkulasi tagihan terpadu (BR-009, BR-020, BR-021) — modul murni.
 *
 * Alur (BR-020): subtotal item → dikurangi diskon → dasar pajak → PPN →
 * (BR-021) pembulatan pada total akhir setelah PPN.
 *
 * Model diskon: satu diskon di level tagihan, bisa persen atau nominal tetap.
 * Diskon dialokasikan ke dua keranjang (item kena pajak vs tidak kena pajak)
 * secara proporsional terhadap nilai bruto masing-masing, memakai pembagian
 * sisa terbesar (largest remainder) agar bilangan bulat dan jumlahnya tepat.
 *
 * Dasar pajak = nilai bruto item kena pajak − diskon yang dialokasikan ke keranjang
 * kena pajak (BR-020a). PPN hanya berlaku untuk item kena pajak.
 */

import { assertRupiah, roundHalfUp } from "./money";
import { type RoundingStep, applyRounding } from "./rounding";
import {
  type TaxSettings,
  assertTaxSettings,
  computeNetFromGross,
  computeTaxExclusive,
} from "./tax";

export interface InvoiceItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
}

export type DiscountInput = { kind: "percent"; value: number } | { kind: "fixed"; amount: number };

export interface InvoiceInput {
  items: InvoiceItemInput[];
  tax: TaxSettings;
  rounding: RoundingStep;
  discount?: DiscountInput;
}

export interface InvoiceItemLine {
  name: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
  gross: number;
}

export interface InvoiceResult {
  lines: InvoiceItemLine[];
  /** Jumlah bruto semua item sebelum diskon. */
  subtotal: number;
  /** Total diskon yang diberikan (Rupiah). */
  discount: number;
  /** Dasar pajak item kena pajak setelah diskon (harga belum termasuk PPN). */
  taxableBase: number;
  /** Nilai item tidak kena pajak setelah diskon. */
  nonTaxableBase: number;
  /** Nilai PPN. */
  tax: number;
  /** Total sebelum pembulatan (setelah diskon + PPN). */
  preRoundingTotal: number;
  /** Selisih pembulatan (bisa positif/negatif). 0 bila tanpa pembulatan. */
  roundingAdjustment: number;
  /** Total akhir tagihan. */
  total: number;
  /** Salinan setelan pajak yang dipakai saat perhitungan (untuk disimpan di tagihan). */
  taxSettings: TaxSettings;
}

/**
 * Membagi `total` (bilangan bulat) ke `weights` secara proporsional dengan metode
 * sisa terbesar, sehingga hasil bilangan bulat dan jumlahnya persis `total`.
 */
export function allocateProportionally(total: number, weights: number[]): number[] {
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (sumW === 0) {
    // Tidak ada dasar pembagian: bagikan rata sebesar mungkin.
    const base = Math.floor(total / weights.length);
    const out = weights.map(() => base);
    let rem = total - base * weights.length;
    for (let i = 0; rem > 0; i = (i + 1) % weights.length, rem--) out[i] += 1;
    return out;
  }
  const raw = weights.map((w) => (total * w) / sumW);
  const floors = raw.map((r) => Math.floor(r));
  const assigned = floors.reduce((a, b) => a + b, 0);
  const remainder = total - assigned;
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const out = floors.slice();
  for (let k = 0; k < remainder; k++) out[order[k % order.length].i] += 1;
  return out;
}

function computeDiscountTotal(discount: DiscountInput | undefined, subtotal: number): number {
  if (!discount) return 0;
  let d: number;
  if (discount.kind === "percent") {
    if (!Number.isFinite(discount.value) || discount.value < 0 || discount.value > 100) {
      throw new RangeError(`Diskon persen harus 0..100, diterima: ${discount.value}`);
    }
    d = roundHalfUp((subtotal * discount.value) / 100);
  } else {
    assertRupiah(discount.amount, "diskon");
    d = discount.amount;
  }
  if (d > subtotal) {
    throw new RangeError(`Diskon (${d}) melebihi subtotal (${subtotal})`);
  }
  return d;
}

/** Menghitung tagihan terpadu sesuai BR-008/020/021. */
export function computeInvoice(input: InvoiceInput): InvoiceResult {
  const tax = assertTaxSettings(input.tax);

  const lines: InvoiceItemLine[] = input.items.map((it) => {
    if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
      throw new RangeError(`Jumlah item harus bilangan bulat positif: ${it.quantity}`);
    }
    assertRupiah(it.unitPrice, "harga satuan");
    const gross = it.quantity * it.unitPrice;
    assertRupiah(gross, "nilai item");
    return {
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxable: it.taxable,
      gross,
    };
  });

  const subtotal = lines.reduce((a, l) => a + l.gross, 0);
  const taxableGross = lines.filter((l) => l.taxable).reduce((a, l) => a + l.gross, 0);
  const nonTaxableGross = subtotal - taxableGross;

  const discount = computeDiscountTotal(input.discount, subtotal);
  const [discountTaxable, discountNonTaxable] = allocateProportionally(discount, [
    taxableGross,
    nonTaxableGross,
  ]);

  const taxActive = tax.enabled && tax.ratePercent > 0;
  const taxableGrossAfterDiscount = taxableGross - discountTaxable;

  let taxableBase: number;
  let taxValue: number;
  if (!taxActive) {
    taxableBase = taxableGrossAfterDiscount;
    taxValue = 0;
  } else if (tax.pricesIncludeTax) {
    // Harga sudah termasuk PPN: dasar pajak = harga bruto setelah diskon dikeluarkan PPN-nya.
    taxableBase = computeNetFromGross(taxableGrossAfterDiscount, tax.ratePercent);
    taxValue = taxableGrossAfterDiscount - taxableBase;
  } else {
    taxableBase = taxableGrossAfterDiscount;
    taxValue = computeTaxExclusive(taxableBase, tax.ratePercent);
  }

  const nonTaxableBase = nonTaxableGross - discountNonTaxable;

  const preRoundingTotal =
    tax.pricesIncludeTax && taxActive
      ? taxableGrossAfterDiscount + nonTaxableBase
      : taxableBase + nonTaxableBase + taxValue;

  assertRupiah(preRoundingTotal, "total sebelum pembulatan");

  const { rounded, adjustment } = applyRounding(preRoundingTotal, input.rounding);

  return {
    lines,
    subtotal,
    discount,
    taxableBase,
    nonTaxableBase,
    tax: taxValue,
    preRoundingTotal,
    roundingAdjustment: adjustment,
    total: rounded,
    taxSettings: { ...tax },
  };
}
