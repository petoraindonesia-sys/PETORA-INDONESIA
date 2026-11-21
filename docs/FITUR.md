# FITUR: PETORA

Status: `terverifikasi` (jalan + tes hijau), `proses` (sedang dikerjakan),
`rencana` (belum), `nanti` (v2+).

## Fondasi (Fondasi proyek)

| Fitur                                  | Status        | Kriteria selesai                                | Lokasi kode                             |
| -------------------------------------- | ------------- | ----------------------------------------------- | --------------------------------------- |
| Fondasi proyek Next.js + TS + Tailwind | terverifikasi | `pnpm build/lint/typecheck/test` hijau dari nol | `package.json`, `src/`                  |
| Tooling (ESLint, Prettier, Vitest)     | terverifikasi | Lint & 38 tes unit lolos                        | `eslint.config.mjs`, `vitest.config.ts` |
| Migrasi DB tersimpan & bisa diulang    | terverifikasi | Migrasi jalan di Postgres lokal (Docker)        | `src/db/migrations/0001_init.sql`       |
| Tes RLS isolasi cabang                 | terverifikasi | 12 uji BR-001/002/003/004 lulus di level DB     | `src/db/tests/run.mjs`                  |

## Domain murni (src/lib/domain)

| Fitur                              | Status        | Kriteria selesai                                  | Lokasi                       |
| ---------------------------------- | ------------- | ------------------------------------------------- | ---------------------------- |
| Uang bulat Rupiah (BR-008)         | terverifikasi | Tanpa float; pembulatan half-up; tes              | `src/lib/domain/money.ts`    |
| Biaya kandang per 24 jam (BR-012)  | terverifikasi | 49 jam = 3 hari; min 1 hari; tes                  | `src/lib/domain/boarding.ts` |
| Dasar pajak + PPN (BR-020)         | terverifikasi | subtotal→diskon→dasar→PPN; termasuk/exklusif; tes | `src/lib/domain/tax.ts`      |
| Pembulatan tagihan (BR-021)        | terverifikasi | kelipatan 100/500/1000; baris terpisah; tes       | `src/lib/domain/rounding.ts` |
| Kalkulasi tagihan terpadu (BR-009) | terverifikasi | Contoh baku brief = Rp296.500 persis; tes         | `src/lib/domain/invoice.ts`  |
| FEFO stok (BR-007)                 | terverifikasi | Batch terdekat kedaluwarsa dipakai dulu; tes      | `src/lib/domain/fefo.ts`     |

## Fitur inti v1 (BRIEF bagian 3)

| Fitur                      | Prioritas | Status  | Kriteria ringkas                                                |
| -------------------------- | --------- | ------- | --------------------------------------------------------------- |
| Organisasi & cabang        | Wajib v1  | rencana | Tambah cabang via pengaturan; isolasi data cabang               |
| Autentikasi & akses        | Wajib v1  | rencana | Menu/data per role; ditolak di DB                               |
| Pelanggan                  | Wajib v1  | rencana | Terpusat lintas cabang; riwayat kunjungan                       |
| Pasien hewan               | Wajib v1  | rencana | Satu pemilik banyak hewan                                       |
| Pelayanan klinik           | Wajib v1  | rencana | Daftar→periksa→tindakan→resep→tagihan otomatis                  |
| Rekam medis                | Wajib v1  | rencana | Lintas cabang; hanya Dokter; final terkunci; addendum           |
| Vaksinasi                  | Wajib v1  | rencana | Catatan + jadwal booster + pengingat                            |
| Rawat inap                 | Wajib v1  | rencana | Check-in/out; biaya kandang otomatis; portal lihat perkembangan |
| Pet shop                   | Wajib v1  | rencana | Katalog; penjualan; stok berkurang                              |
| Inventori                  | Wajib v1  | rencana | Stok per cabang; batch; kedaluwarsa; penyesuaian                |
| Transfer stok antar cabang | Wajib v1  | rencana | draft→kirim→terima; selisih ditinjau                            |
| Pengadaan                  | Wajib v1  | rencana | Pemasok; PO; penerimaan; harga beli                             |
| Kasir & transaksi          | Wajib v1  | rencana | Tagihan terpadu; diskon/PPN/pembulatan; void                    |
| Pembayaran manual          | Wajib v1  | rencana | Tunai/transfer/QRIS/kartu; sebagian; anti-ganda                 |
| Laporan operasional        | Wajib v1  | rencana | Penjualan/kunjungan/stok/pajak; batas hari per zona             |
| Pet Owner Portal           | Wajib v1  | rencana | Hanya baca; hanya data sendiri                                  |

## Nanti (v2+)

Pembayaran online di portal, booking janji temu online, notifikasi WhatsApp/email.

## Kriteria selesai per fitur

Detail kriteria ada di `BRIEF.md` bagian 3 & 5. Saat fitur dikerjakan, status di
tabel ini diperbarui ke `terverifikasi` hanya setelah tes otomatis hijau dan
dijalankan ujung ke ujung (AGENTS.md §7).
