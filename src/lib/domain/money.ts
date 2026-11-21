/**
 * Uang: bilangan bulat Rupiah (BR-008).
 *
 * Semua nilai uang di sistem ini adalah bilangan bulat Rupiah (tanpa float, tanpa
 * pecahan sen). Tipe `number` dipakai hanya untuk nilai bulat dalam rentang aman
 * (Number.MAX_SAFE_INTEGER ~ 9×10^15), cukup untuk nilai Rupiah realistis, dan
 * ramah JSON/Postgres bigint. Setiap nilai yang masuk ke perhitungan wajib divalidasi.
 */

export const MAX_SAFE_RUPIAH = Number.MAX_SAFE_INTEGER;

/** True bila `value` adalah bilangan bulat Rupiah yang sah (integer >= 0). */
export function isRupiah(value: number): boolean {
  return (
    Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value <= MAX_SAFE_RUPIAH
  );
}

/** Memvalidasi nilai Rupiah atau melempar error. */
export function assertRupiah(value: number, label = "rupiah"): number {
  if (!isRupiah(value)) {
    throw new RangeError(`${label} harus bilangan bulat Rupiah non-negatif, diterima: ${value}`);
  }
  return value;
}

/**
 * Membulatkan bilangan ke bilangan bulat terdekat dengan aturan setengah-ke-atas
 * (half-up): 0.5 -> 1, 1.5 -> 2, 2.5 -> 3. Hanya untuk nilai non-negatif.
 * Dipakai untuk membulatkan hasil perkalian/pembagian (mis. PPN) ke Rupiah utuh.
 */
export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`roundHalfUp hanya untuk nilai non-negatif, diterima: ${value}`);
  }
  return Math.floor(value + 0.5);
}

/** Format Rupiah untuk tampilan (mis. "Rp296.500"). Tidak dipakai untuk hitung. */
export function formatRupiah(value: number): string {
  assertRupiah(value);
  return "Rp" + value.toLocaleString("id-ID");
}
