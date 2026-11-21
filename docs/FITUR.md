# FITUR: PETORA

Status: `terverifikasi` (jalan + tes hijau), `proses` (sedang dikerjakan),
`rencana` (belum), `nanti` (v2+).

## Fondasi proyek

| Fitur | Status | Kriteria selesai | Lokasi |
|---|---|---|---|
| Fondasi Next.js + TS + Tailwind | terverifikasi | build/lint/typecheck hijau dari nol | `package.json`, `src/` |
| Tooling (ESLint, Prettier, Vitest) | terverifikasi | Lint & 38 tes unit lolos | `eslint.config.mjs`, `vitest.config.ts` |
| Migrasi DB tersimpan & bisa diulang | terverifikasi | Migrasi 0001+0002 jalan di Postgres lokal (Docker) | `src/db/migrations/` |
| Tes RLS isolasi cabang | terverifikasi | 23 tes integrasi BR-001/002/003/004 hijau | `src/db/tests/*.itest.ts` |

## Domain murni (src/lib/domain)

| Fitur | Status | Kriteria selesai | Lokasi |
|---|---|---|---|
| Uang bulat Rupiah (BR-008) | terverifikasi | Tanpa float; pembulatan half-up; tes | `src/lib/domain/money.ts` |
| Biaya kandang per 24 jam (BR-012) | terverifikasi | 49 jam = 3 hari; min 1 hari; tes | `src/lib/domain/boarding.ts` |
| Dasar pajak + PPN (BR-020) | terverifikasi | subtotal→diskon→dasar→PPN; termasuk/exklusif; tes | `src/lib/domain/tax.ts` |
| Pembulatan tagihan (BR-021) | terverifikasi | kelipatan 100/500/1000; baris terpisah; tes | `src/lib/domain/rounding.ts` |
| Kalkulasi tagihan terpadu (BR-009) | terverifikasi | Contoh baku brief = Rp296.500 persis; tes | `src/lib/domain/invoice.ts` |
| FEFO stok (BR-007) | terverifikasi | Batch terdekat kedaluwarsa dipakai dulu; tes | `src/lib/domain/fefo.ts` |

## Lapisan data & service (src/lib/db, src/lib/inventory, src/lib/billing)

| Fitur | Status | Kriteria selesai | Lokasi |
|---|---|---|---|
| Koneksi + withActor (RLS aktif) | terverifikasi | Tiap operasi jalan sebagai `authenticated` + `app.user_id` | `src/lib/db/index.ts` |
| Terima stok / penyesuaian (BR-006) | terverifikasi | Stok bertambah; mutasi tercatat; adjust wajib alasan | `src/lib/inventory/service.ts` |
| Kurangi stok FEFO atomik (BR-006/007) | terverifikasi | Dua transaksi bersamaan → satu sukses satu ditolak; stok tak minus | `src/lib/inventory/service.ts` |
| Buat tagihan + koreksi stok atomik (BR-009/020/021) | terverifikasi | Contoh baku Rp296.500 tersimpan; rollback bila stok kurang | `src/lib/billing/service.ts` |
| Catat pembayaran idempoten (BR-010/018) | terverifikasi | Sebagian→lunas; uang kembali tunai; bayar ganda dicegah | `src/lib/billing/service.ts` |
| Void tagihan (BR-011) | terverifikasi | Butuh izin invoice.void; ditolak bila sudah dibayar | `src/lib/billing/service.ts` |

## Tes integrasi (pnpm test:db — Postgres Docker)

| Cakupan | Status | Bukti |
|---|---|---|
| RLS isolasi cabang & medis (BR-001/002/003/004) | terverifikasi | 9 tes `.itest.ts` hijau |
| Inventori & FEFO (BR-006/007) | terverifikasi | 5 tes `.itest.ts` hijau |
| Kasir & pembayaran (BR-009/010/011/018/020/021) | terverifikasi | 9 tes `.itest.ts` hijau |

## Fitur inti v1 (BRIEF bagian 3)

| Fitur | Prioritas | Status | Kriteria ringkas |
|---|---|---|---|
| Organisasi & cabang | Wajib v1 | rencana | Tambah cabang via pengaturan; isolasi data cabang |
| Autentikasi & akses | Wajib v1 | rencana | Menu/data per role; ditolak di DB |
| Pelanggan | Wajib v1 | rencana | Terpusat lintas cabang; riwayat kunjungan |
| Pasien hewan | Wajib v1 | rencana | Satu pemilik banyak hewan |
| Pelayanan klinik | Wajib v1 | rencana | Daftar→periksa→tindakan→resep→tagihan otomatis |
| Rekam medis | Wajib v1 | sebagian | RLS & aturan final/addendum teruji (DB); UI belum |
| Vaksinasi | Wajib v1 | rencana | Catatan + jadwal booster + pengingat |
| Rawat inap | Wajib v1 | rencana | Check-in/out; biaya kandang otomatis; portal lihat |
| Pet shop | Wajib v1 | sebagian | Buat tagihan + kurangi stok teruji; katalog UI belum |
| Inventori | Wajib v1 | sebagian | Stok per cabang, batch, FEFO, mutasi teruji; UI belum |
| Transfer stok antar cabang | Wajib v1 | rencana | draft→kirim→terima; selisih ditinjau |
| Pengadaan | Wajib v1 | sebagian | Terima stok (pembuatan batch) teruji; PO/batch UI belum |
| Kasir & transaksi | Wajib v1 | sebagian | Tagihan terpadu + diskon/PPN/pembulatan teruji; UI belum |
| Pembayaran manual | Wajib v1 | sebagian | Tunai/transfer/QRIS/kartu + sebagian + anti-ganda teruji; UI belum |
| Laporan operasional | Wajib v1 | rencana | Penjualan/kunjungan/stok/pajak; batas hari per zona |
| Pet Owner Portal | Wajib v1 | rencana | Hanya baca; hanya data sendiri |

## Nanti (v2+)

Pembayaran online di portal, booking janji temu online, notifikasi WhatsApp/email.

## Catatan

"sebagian" = logika & keamanan (DB/service) sudah teruji, tetapi UI & alur
end-to-end belum dibangun. Detail kriteria di `BRIEF.md` bagian 3 & 5. Status jadi
`terverifikasi` hanya setelah tes otomatis hijau & dijalankan ujung-ke-ujung
(AGENTS.md §7).