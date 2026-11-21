# STATUS: PETORA

## Gambaran besar

Proyek baru (Mode A) dengan fondasi + lapisan domain/service/auth/cabang yang sudah
terverifikasi. Produk: aplikasi web operasional klinik hewan + pet shop, satu
perusahaan banyak cabang, backend Postgres (local-first, tanpa Supabase — K-009), UI
bergaya Apple, Bahasa Indonesia. Fondasi kode, modul domain murni, skema DB + RLS,
lapisan data (withActor), service inventori & billing, service autentikasi lokal, dan
service cabang sudah dibuat & **terverifikasi** (38 tes unit + 53 tes integrasi hijau;
build/lint/typecheck hijau). UI masih minimal (login, /app, cabang, kasir).

## Sedang dikerjakan

- **Tugas**: UI Kasir (buat tagihan + pembayaran) + service daftar/detail tagihan + API + tes. Status: **selesai & terverifikasi**.
- **Branch**: `main`.
- **Titik berhenti**: Kasir hijau (service/API/tes + build). UI rekam medis/pelanggan belum.
- **Langkah berikutnya konkret**:
  1. UI Rekam medis (Dokter) & Pelanggan/Pasien.
  2. Uji browser alur kasir (login → buat tagihan → bayar) sebagai Staff A.
  3. Integrasi Supabase (ganti `DATABASE_URL`) & deploy — butuh akun (di luar kendali).

## Tumpukan jeda

_Kosong._

## Masalah terbuka

- **Supabase belum disiapkan** (keputusan pengguna: lanjut tanpa Supabase, uji lokal —
  K-009). Backend = Postgres lokal (Docker). Saat backend nyata dibutuhkan, ganti
  `DATABASE_URL` ke connection string Supabase; RLS & service tetap.

## Pekerjaan terakhir

1. Migrasi `0003_auth_session.sql` (sesi + password_hash/email) + service auth (scrypt, hash token) + rute login/logout/me + middleware. (terverifikasi)
2. Service cabang (`src/lib/branches`): list/get/create/update/deactivate + validasi zona waktu; RLS Owner-only. (terverifikasi)
3. API /api/branches (GET/POST) + /[id] (PATCH/DELETE) dengan requireActor. (terverifikasi)
4. Halaman /app/branches (Owner): daftar + form tambah + zona waktu. (proses — belum uji browser)
5. 12 tes integrasi cabang (Owner CRUD, Staff ditolak RLS, zona waktu invalid ditolak). (terverifikasi)
6. Service billing: `listInvoices` + `getInvoice` (RLS, detail item+pembayaran). (terverifikasi)
7. API /api/invoices (GET/POST) + /[id] (GET) + /[id]/payments (POST). (terverifikasi)
8. Halaman /app/cashier: buat tagihan (item/diskon/PPN/pembulatan) + catat pembayaran. (proses — belum uji browser)
9. 4 tes integrasi listInvoices/getInvoice (RLS batasi cabang, filter branchId, detail benar). (terverifikasi)

## Langkah berikutnya

1. UI Rekam medis + Pelanggan & hewan.
2. Uji browser alur kasir (login → buat tagihan → bayar) sebagai Staff A.
3. Siapkan Supabase & deploy (Vercel) — perlu pengguna (AGENTS.md §12).