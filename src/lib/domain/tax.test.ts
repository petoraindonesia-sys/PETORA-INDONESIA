import { describe, it, expect } from "vitest";
import { computeTaxExclusive, computeNetFromGross, assertTaxSettings } from "./tax";

describe("tax (BR-020)", () => {
  it("menghitung PPN eksklusif 10% dari 269700 = 26970", () => {
    expect(computeTaxExclusive(269700, 10)).toBe(26970);
  });

  it("menghitung PPN dari nilai yang menghasilkan pecahan dibulatkan half-up", () => {
    // 22350 * 10 / 100 = 2235 tepat
    expect(computeTaxExclusive(22350, 10)).toBe(2235);
    // 1234 * 11 / 100 = 135.74 -> 136
    expect(computeTaxExclusive(1234, 11)).toBe(136);
  });

  it("menghitung net dari gross (harga termasuk pajak)", () => {
    // 110 gross @10% -> net 100, tax 10
    expect(computeNetFromGross(110, 10)).toBe(100);
  });

  it("assertTaxSettings menolak tarif di luar 0..100", () => {
    expect(() =>
      assertTaxSettings({ enabled: true, ratePercent: 101, pricesIncludeTax: false }),
    ).toThrow(RangeError);
    expect(() =>
      assertTaxSettings({ enabled: true, ratePercent: -1, pricesIncludeTax: false }),
    ).toThrow(RangeError);
  });
});
