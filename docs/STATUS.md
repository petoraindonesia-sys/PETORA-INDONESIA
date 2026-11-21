# STATUS: PETORA

## Gambaran besar

Proyek baru (Mode A) dengan fondasi + lapisan domain/service/auth/cabang yang sudah
terverifikasi. Produk: aplikasi web operasional klinik hewan + pet shop, satu
perusahaan banyak cabang, backend Postgres (local-first, tanpa Supabase — K-009), UI
bergaya Apple, Bahasa Indonesia. Fondasi kode, modul domain murni, skema DB + RLS,
lapisan data (withActor), service inventori & billing, service autentikasi lokal, dan
service cabang sudah dibuat & **terverifikasi** (38 tes unit + 81 tes integrasi hijau;
build/lint/typecheck hijau). UI masih minimal (login, /app dashboard, cabang, kasir,
pelanggan, kunjungan, medis).

## Sedang dikerjakan

- **Tugas**: Dashboard ringkasan harian /app + service + API + tes. Status: **selesai & terverifikasi**.
- **Branch**: `main`.
- **Titik berhenti**: Dashboard hijau (service/API/tes + build).
- **Langkah berikutnya konkret**:
  1. Uji browser alur inti (login → pelanggan/hewan → kunjungan → kasir/medis) sebagai Staff A / Dokter A.
  2. Laporan periode (penjualan/kunjungan per rentang tanggal & zona waktu).
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
10. Service pelanggan (list/get/create/update) + hewan (list by customer/get/create/update). (terverifikasi)
11. API /api/customers (GET/POST, /[id] GET/PATCH) + /api/pets (GET/POST) dengan requireActor. (terverifikasi)
12. Halaman /app/customers: daftar + cari + form pelanggan + kelola hewan per pelanggan. (proses - belum uji browser)
13. 11 tes integrasi pelanggan/hewan (CRUD, terpusat lintas cabang, validasi). (terverifikasi)
14. Service kunjungan (list by branch/create/get) + transisi status + nomor antrean harian. (terverifikasi)
15. Service rekam medis (listByPet/createDraft/updateDraft/finalize) - RLS draft/final. (terverifikasi)
16. API /api/visits (GET/POST) + /[id]/status (PATCH); /api/medical-records (GET/POST) + /[id] (GET/PATCH/POST). (terverifikasi)
17. Halaman /app/visits: daftar kunjungan cabang + buat kunjungan + ubah status. (proses - belum uji browser)
18. Halaman /app/medical: rekam medis per pasien lintas cabang, draft->edit->final. (proses - belum uji browser)
19. 13 tes integrasi kunjungan & rekam medis (isolasi cabang, draft/final terkunci, lintas cabang read). (terverifikasi)
20. Service dashboard: ringkasan per cabang (kunjungan/tagihan hari ini + piutang) + API /api/dashboard. (terverifikasi)
21. Halaman /app (dashboard): kartu total + rincian per cabang + akses modul. (proses - belum uji browser)
22. 4 tes integrasi dashboard (RLS batasi cabang, hitungan kunjungan/tagihan benar, totals). (terverifikasi)

## Langkah berikutnya

1. Uji browser alur inti (login -> pelanggan/hewan -> kunjungan -> kasir/medis) sebagai Staff A / Dokter A.
2. Laporan periode (penjualan/kunjungan per rentang tanggal & zona waktu).
3. Siapkan Supabase & deploy (Vercel) - perlu pengguna (AGENTS.md 12).
