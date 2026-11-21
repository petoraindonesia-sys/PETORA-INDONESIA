/**
 * Biaya kandang rawat inap (BR-012) — modul murni.
 *
 * Aturan: jumlah hari = durasi sejak check-in dibagi 24 jam, dibulatkan ke atas
 * (ceil), minimal 1 hari. Biaya = tarif harian × jumlah hari.
 * Contoh baku: check-in 10 Nov 14:00, check-out 12 Nov 15:00 = 49 jam = 3 hari.
 *
 * Sisa kurang dari 24 jam tetap dihitung 1 hari (pembulatan ke atas).
 */

import { assertRupiah } from "./money";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Menghitung jumlah hari inap dari selisih waktu (dalam milidetik).
 * `ceil(durasi / 24j)` dengan minimal 1.
 */
export function boardingDaysFromMs(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new RangeError(`Durasi harus non-negatif, diterima: ${durationMs}`);
  }
  return Math.max(1, Math.ceil(durationMs / MS_PER_DAY));
}

/** Menghitung jumlah hari inap dari dua timestamp (check-out - check-in). */
export function boardingDays(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  if (ms < 0) {
    throw new RangeError("check-out tidak boleh sebelum check-in");
  }
  return boardingDaysFromMs(ms);
}

/**
 * Menghitung biaya kandang.
 * @param checkIn  waktu check-in
 * @param checkOut waktu check-out
 * @param dailyRate tarif harian kandang (Rupiah, bilangan bulat)
 */
export function boardingCost(checkIn: Date, checkOut: Date, dailyRate: number): number {
  assertRupiah(dailyRate, "tarif harian");
  const days = boardingDays(checkIn, checkOut);
  return days * dailyRate;
}
