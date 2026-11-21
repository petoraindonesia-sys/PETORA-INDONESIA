import { describe, it, expect } from "vitest";
import { computeInvoice, allocateProportionally } from "./invoice";

describe("invoice (BR-008/020/021)", () => {
  /**
   * CONTOH BAKU dari BRIEF bagian 5 — WAJIB menghasilkan angka yang sama persis.
   * Konsultasi 75.000 + vaksin 150.000 + obat 2×22.350 (44.700) = subtotal 269.700
   * -> PPN 10% 26.970 -> 296.670 -> pembulatan -170 -> total 296.500.
   */
  it("menghasilkan contoh perhitungan baku brief", () => {
    const result = computeInvoice({
      items: [
        { name: "Konsultasi", quantity: 1, unitPrice: 75000, taxable: true },
        { name: "Vaksin", quantity: 1, unitPrice: 150000, taxable: true },
        { name: "Obat", quantity: 2, unitPrice: 22350, taxable: true },
      ],
      tax: { enabled: true, ratePercent: 10, pricesIncludeTax: false },
      rounding: 500,
    });

    expect(result.subtotal).toBe(269700);
    expect(result.tax).toBe(26970);
    expect(result.preRoundingTotal).toBe(296670);
    expect(result.roundingAdjustment).toBe(-170);
    expect(result.total).toBe(296500);
  });

  it("PPN nonaktif: total = subtotal (tanpa pembulatan)", () => {
    const result = computeInvoice({
      items: [{ name: "Konsultasi", quantity: 1, unitPrice: 75000, taxable: true }],
      tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
      rounding: 0,
    });
    expect(result.tax).toBe(0);
    expect(result.total).toBe(75000);
  });

  it("item tidak kena pajak tidak dikenakan PPN", () => {
    const result = computeInvoice({
      items: [
        { name: "Konsultasi", quantity: 1, unitPrice: 100000, taxable: true },
        { name: "Shampoo", quantity: 1, unitPrice: 50000, taxable: false },
      ],
      tax: { enabled: true, ratePercent: 10, pricesIncludeTax: false },
      rounding: 0,
    });
    expect(result.taxableBase).toBe(100000);
    expect(result.nonTaxableBase).toBe(50000);
    expect(result.tax).toBe(10000);
    expect(result.total).toBe(160000);
  });

  it("diskon persen mengurangi dasar pajak secara proporsional", () => {
    const result = computeInvoice({
      items: [
        { name: "A", quantity: 1, unitPrice: 100000, taxable: true },
        { name: "B", quantity: 1, unitPrice: 100000, taxable: false },
      ],
      tax: { enabled: true, ratePercent: 10, pricesIncludeTax: false },
      rounding: 0,
      discount: { kind: "percent", value: 10 }, // 20.000 diskon -> 10.000 ke masing-masing
    });
    expect(result.discount).toBe(20000);
    expect(result.taxableBase).toBe(90000);
    expect(result.nonTaxableBase).toBe(90000);
    expect(result.tax).toBe(9000);
    expect(result.total).toBe(189000);
  });

  it("harga sudah termasuk pajak: PPN dikeluarkan dari harga", () => {
    const result = computeInvoice({
      items: [{ name: "A", quantity: 1, unitPrice: 110000, taxable: true }],
      tax: { enabled: true, ratePercent: 10, pricesIncludeTax: true },
      rounding: 0,
    });
    expect(result.taxableBase).toBe(100000);
    expect(result.tax).toBe(10000);
    expect(result.total).toBe(110000); // total = harga termasuk pajak
  });

  it("menolak diskon melebihi subtotal", () => {
    expect(() =>
      computeInvoice({
        items: [{ name: "A", quantity: 1, unitPrice: 10000, taxable: true }],
        tax: { enabled: false, ratePercent: 0, pricesIncludeTax: false },
        rounding: 0,
        discount: { kind: "fixed", amount: 20000 },
      }),
    ).toThrow(RangeError);
  });

  it("menyimpan salinan setelan pajak pada hasil", () => {
    const result = computeInvoice({
      items: [{ name: "A", quantity: 1, unitPrice: 10000, taxable: true }],
      tax: { enabled: true, ratePercent: 11, pricesIncludeTax: false },
      rounding: 0,
    });
    expect(result.taxSettings).toEqual({
      enabled: true,
      ratePercent: 11,
      pricesIncludeTax: false,
    });
  });
});

describe("allocateProportionally", () => {
  it("membagi tepat tanpa kehilangan Rupiah", () => {
    const out = allocateProportionally(100, [1, 1, 1]);
    expect(out.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("membagi proporsional terhadap berat", () => {
    expect(allocateProportionally(100, [300, 100])).toEqual([75, 25]);
  });

  it("menangani semua berat nol dengan rata", () => {
    const out = allocateProportionally(10, [0, 0]);
    expect(out.reduce((a, b) => a + b, 0)).toBe(10);
  });
});
