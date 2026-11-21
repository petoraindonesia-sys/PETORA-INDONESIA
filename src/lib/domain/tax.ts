/**
 * PPN (BR-020).
 *
 * Setelan di level perusahaan: PPN aktif/tidak, tarif, dan apakah harga katalog sudah
 * termasuk pajak. Tiap item ditandai kena pajak atau tidak. Tagihan menyimpan salinan
 * tarif & nilai pajak saat dibuat (ditangani di layer penyimpanan; modul ini murni).
 *
 * Aturan turunan:
 * - BR-020a: Dasar pajak = subtotal item kena pajak − diskon yang dialokasikan ke item
 *   kena pajak. Item tidak kena pajak tidak menyumbang PPN.
 */

import { roundHalfUp } from "./money";

export interface TaxSettings {
  /** PPN aktif atau tidak. Default aman: nonaktif (BR-020 pengecualian). */
  enabled: boolean;
  /** Tarif dalam persen, mis. 10 untuk 10%. Boleh pecahan (mis. 11, 12.5). */
  ratePercent: number;
  /** True bila harga katalog sudah termasuk PPN. */
  pricesIncludeTax: boolean;
}

/** Validasi setelan pajak. */
export function assertTaxSettings(s: TaxSettings): TaxSettings {
  if (!Number.isFinite(s.ratePercent) || s.ratePercent < 0 || s.ratePercent > 100) {
    throw new RangeError(`Tarif PPN harus 0..100 persen, diterima: ${s.ratePercent}`);
  }
  return s;
}

/**
 * PPN dari basis (harga yang BELUM termasuk pajak).
 * hasil = roundHalfUp(net * ratePercent / 100).
 */
export function computeTaxExclusive(net: number, ratePercent: number): number {
  return roundHalfUp((net * ratePercent) / 100);
}

/**
 * Harga bersih (dasar pajak) dari harga yang SUDAH termasuk pajak.
 * net = roundHalfUp(gross * 100 / (100 + ratePercent)).
 */
export function computeNetFromGross(gross: number, ratePercent: number): number {
  const divisor = 100 + ratePercent;
  if (divisor <= 0) {
    throw new RangeError(`Tarif PPN tidak valid: ${ratePercent}`);
  }
  return roundHalfUp((gross * 100) / divisor);
}
