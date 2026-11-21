import { describe, it, expect } from "vitest";
import { isRupiah, assertRupiah, roundHalfUp, formatRupiah } from "./money";

describe("money (BR-008)", () => {
  it("mengenali bilangan bulat Rupiah", () => {
    expect(isRupiah(0)).toBe(true);
    expect(isRupiah(296500)).toBe(true);
  });

  it("menolak nilai pecahan/negatif/tak hingga", () => {
    expect(isRupiah(1.5)).toBe(false);
    expect(isRupiah(-1)).toBe(false);
    expect(isRupiah(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isRupiah(Number.NaN)).toBe(false);
  });

  it("assertRupiah melempar untuk nilai tidak sah", () => {
    expect(() => assertRupiah(-5)).toThrow(RangeError);
    expect(() => assertRupiah(2.2)).toThrow(RangeError);
    expect(assertRupiah(1000)).toBe(1000);
  });

  it("roundHalfUp membulatkan setengah ke atas", () => {
    expect(roundHalfUp(0.4)).toBe(0);
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(26969.5)).toBe(26970);
  });

  it("roundHalfUp menolak nilai negatif", () => {
    expect(() => roundHalfUp(-1)).toThrow(RangeError);
  });

  it("formatRupiah memformat tampilan", () => {
    expect(formatRupiah(296500)).toBe("Rp296.500");
    expect(formatRupiah(0)).toBe("Rp0");
  });
});
