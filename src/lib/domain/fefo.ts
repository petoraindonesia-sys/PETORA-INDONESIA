/**
 * FEFO — First Expired, First Out (BR-007) — modul murni.
 *
 * Pengurangan stok memakai batch yang paling cepat kedaluwarsa lebih dulu.
 * Batch tanpa tanggal kedaluwarsa dianggap paling akhir dipakai (setelah semua
 * batch ber-kedaluwarsa). Pengurangan bersifat atomik di level DB; modul ini
 * menghitung alokasi berapa yang diambil dari tiap batch.
 */

export interface StockBatchAllocation {
  batchId: string;
  /** Jumlah yang diambil dari batch ini. */
  taken: number;
}

export interface StockBatchAvailable {
  batchId: string;
  available: number;
  /** ISO date string kedaluwarsa, atau null bila tidak ber-kedaluwarsa. */
  expiresAt: string | null;
}

/**
 * Mengalokasikan `requested` unit dari daftar batch berdasarkan FEFO.
 * - Batch dengan kedaluwarsa terdekat dipakai lebih dulu.
 * - Batch tanpa kedaluwarsa dipakai paling akhir.
 * - Bila total tersedia kurang dari `requested`, melempar error (stok tidak minus, BR-006).
 *
 * Mengembalikan daftar alokasi per batch (hanya batch yang benar-benar diambil).
 */
export function allocateFefo(
  requested: number,
  batches: StockBatchAvailable[],
): StockBatchAllocation[] {
  if (!Number.isInteger(requested) || requested < 0) {
    throw new RangeError(`Jumlah diminta harus bilangan bulat non-negatif: ${requested}`);
  }
  if (requested === 0) return [];

  const totalAvailable = batches.reduce((a, b) => a + b.available, 0);
  if (totalAvailable < requested) {
    throw new Error(`Stok tidak cukup: diminta ${requested}, tersedia ${totalAvailable}`);
  }

  const sorted = batches
    .map((b, i) => ({ ...b, i }))
    .sort((a, b) => {
      // Batch ber-kedaluwarsa dulu (terdekat di atas); tanpa kedaluwarsa di akhir.
      if (a.expiresAt === null && b.expiresAt === null) return a.i - b.i;
      if (a.expiresAt === null) return 1;
      if (b.expiresAt === null) return -1;
      if (a.expiresAt < b.expiresAt) return -1;
      if (a.expiresAt > b.expiresAt) return 1;
      return a.i - b.i;
    });

  const allocations: StockBatchAllocation[] = [];
  let remaining = requested;
  for (const batch of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(batch.available, remaining);
    if (take > 0) {
      allocations.push({ batchId: batch.batchId, taken: take });
      remaining -= take;
    }
  }
  return allocations;
}
