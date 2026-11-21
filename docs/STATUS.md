# STATUS: PETORA

## Gambaran besar

Proyek baru (Mode A) dengan fondasi + lapisan domain/service yang sudah terverifikasi.
Produk: aplikasi web operasional klinik hewan + pet shop, satu perusahaan banyak
cabang, backend Postgres (local-first, tanpa Supabase — K-009), UI bergaya Apple,
Bahasa Indonesia. Fondasi kode, modul domain murni, skema DB + RLS, lapisan data
(withActor), dan service inventori & billing sudah dibuat & **terverifikasi** (38 tes
unit + 23 tes integrasi hijau; build/lint/typecheck hijau). Belum ada UI & alur
end-to-end; itu langkah berikutnya.

## Sedang dikerjakan

- **Tugas**: Lapisan billing & inventori + tes integrasi (BR-006/007/009/010/011/018/020/021).
  Status: **selesai & terverifikasi**. Bersiap membangun UI/alur end-to-end.
- **Branch**: `main`.
- **Titik berhenti**: Service billing/inventori hijau; belum ada UI.
- **Langkah berikutnya konkret**:
  1. Autentikasi lokal (sesi) + halaman login; proteksi rute area `(operational)` & `(portal)`.
  2. UI Organisasi & cabang (Owner): CRUD cabang + zona waktu via service (RLS).
  3. UI Kasir: buat tagihan (pakai `createInvoice`) + catat pembayaran (`recordPayment`).
  4. UI Rekam medis (Dokter) & Pelanggan/Pasien.
  5. Integrasi Supabase/degradasi Auth (butuh akun — di luar kendali agent).

## Tumpukan jeda

_Kosong._

## Masalah terbuka

- **Supabase belum disiapkan** (keputusan pengguna: lanjut tanpa Supabase, uji lokal —
  K-009). Backend = Postgres lokal (Docker). Saat backend nyata dibutuhkan, ganti
  `DATABASE_URL` ke connection string Supabase & ganti adapter Auth; RLS & service tetap.

## Pekerjaan terakhir

1. Migrasi `0002_billing_inventory.sql`: produk, batch stok, mutasi, tagihan, item, pembayaran + RLS. (terverifikasi)
2. Lapisan data `src/lib/db` (withActor menjalankan RLS per operasi). (terverifikasi)
3. Service inventori (terima/FEFO atomik/adjust) + billing (buat tagihan, pembayaran idempoten, void). (terverifikasi)
4. Harness Vitest globalSetup (Docker Postgres) + 23 tes integrasi; termasuk uji konkurensi stok & bayar ganda. (terverifikasi)
5. Tes unit 38 + integrasi 23 hijau; lint/typecheck/build hijau. (terverifikasi)

## Langkah berikutnya

1. Autentikasi lokal + login + proteksi rute (operational/portal).
2. UI Organisasi & cabang (Owner) memakai service + RLS.
3. UI Kasir & pembayaran (pakai service billing yang sudah teruji).
4. UI Rekam medis + Pelanggan & hewan.
5. Siapkan Supabase & deploy (Vercel) — perlu pengguna (AGENTS.md §12).