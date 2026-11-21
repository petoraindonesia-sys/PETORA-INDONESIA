import { describe, it, expect } from "vitest";
import { applyRounding } from "./rounding";

describe("rounding (BR-021)", () => {
  it("tanpa pembulatan (step 0) tidak mengubah nilai", () => {
    expect(applyRounding(296670, 0)).toEqual({ rounded: 296670, adjustment: 0 });
  });

  it("membulatkan ke Rp100 terdekat", () => {
    expect(applyRounding(296670, 100)).toEqual({ rounded: 296700, adjustment: 30 });
    expect(applyRounding(296640, 100)).toEqual({ rounded: 296600, adjustment: -40 });
  });

  it("membulatkan ke Rp500 terdekat (contoh brief: 296670 -> 296500, -170)", () => {
    expect(applyRounding(296670, 500)).toEqual({ rounded: 296500, adjustment: -170 });
  });

  it("membulatkan ke Rp1000 terdekat", () => {
    expect(applyRounding(296670, 1000)).toEqual({ rounded: 297000, adjustment: 330 });
  });

  it("setengah dibulatkan ke atas (296250 -> 296500 untuk step 500)", () => {
    // 296250 / 500 = 592.5 -> half-up -> 593 -> 296500
    expect(applyRounding(296250, 500)).toEqual({ rounded: 296500, adjustment: 250 });
  });

  it("menolak amount negatif/tidak bulat", () => {
    expect(() => applyRounding(-1, 500)).toThrow(RangeError);
    expect(() => applyRounding(100.5, 500)).toThrow(RangeError);
  });
});
