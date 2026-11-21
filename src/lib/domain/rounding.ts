/**
 * Pembulatan tagihan (BR-021).
 *
 * Dikonfigurasi di level perusahaan: tanpa pembulatan, atau ke kelipatan
 * Rp100 / Rp500 / Rp1.000 terdekat. Dihitung pada total akhir SETELAH PPN,
 * ditampilkan sebagai baris "Pembulatan" terpisah (bisa positif atau negatif),
 * dan tidak mengubah nilai PPN (BR-021a).
 */

import { roundHalfUp } from "./money";

/** Langkah pembulatan dalam Rupiah. 0 berarti tanpa pembulatan. */
export type RoundingStep = 0 | 100 | 500 | 1000;

export interface RoundingResult {
  /** Total setelah pembulatan (kelipatan langkah, atau sama dengan `amount` bila step 0). */
  rounded: number;
  /** Selisih = rounded - amount. Positif bila dibulatkan ke atas, negatif bila ke bawah. */
  adjustment: number;
}

/**
 * Membulatkan `amount` (non-negatif, setelah PPN) ke kelipatan `step` terdekat.
 * - step = 0: tanpa pembulatan.
 * - step > 0: Math.round(amount / step) * step (setengah ke atas).
 */
export function applyRounding(amount: number, step: RoundingStep): RoundingResult {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError(`amount harus bilangan bulat non-negatif, diterima: ${amount}`);
  }
  if (step === 0) {
    return { rounded: amount, adjustment: 0 };
  }
  const rounded = roundHalfUp(amount / step) * step;
  return { rounded, adjustment: rounded - amount };
}
