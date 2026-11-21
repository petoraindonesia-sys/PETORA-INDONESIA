import { describe, it, expect } from "vitest";
import { boardingDays, boardingDaysFromMs, boardingCost } from "./boarding";

const HOUR = 60 * 60 * 1000;

describe("boarding (BR-012)", () => {
  it("contoh baku brief: 49 jam = 3 hari", () => {
    // 10 Nov 14:00 -> 12 Nov 15:00 = 49 jam
    const checkIn = new Date("2026-11-10T14:00:00Z");
    const checkOut = new Date("2026-11-12T15:00:00Z");
    expect(checkOut.getTime() - checkIn.getTime()).toBe(49 * HOUR);
    expect(boardingDays(checkIn, checkOut)).toBe(3);
  });

  it("tepat 24 jam = 1 hari", () => {
    const checkIn = new Date("2026-11-10T10:00:00Z");
    const checkOut = new Date("2026-11-11T10:00:00Z");
    expect(boardingDays(checkIn, checkOut)).toBe(1);
  });

  it("sisa kurang dari 24 jam dibulatkan ke atas (1 jam = 1 hari)", () => {
    expect(boardingDaysFromMs(1 * HOUR)).toBe(1);
    expect(boardingDaysFromMs(25 * HOUR)).toBe(2);
  });

  it("durasi nol = minimal 1 hari (BR-012a)", () => {
    expect(boardingDaysFromMs(0)).toBe(1);
    const t = new Date("2026-11-10T10:00:00Z");
    expect(boardingDays(t, t)).toBe(1);
  });

  it("menolak check-out sebelum check-in", () => {
    const a = new Date("2026-11-12T10:00:00Z");
    const b = new Date("2026-11-11T10:00:00Z");
    expect(() => boardingDays(a, b)).toThrow(RangeError);
  });

  it("biaya = tarif harian × hari (49 jam, tarif 85000 -> 255000)", () => {
    const checkIn = new Date("2026-11-10T14:00:00Z");
    const checkOut = new Date("2026-11-12T15:00:00Z");
    expect(boardingCost(checkIn, checkOut, 85000)).toBe(3 * 85000);
  });
});
