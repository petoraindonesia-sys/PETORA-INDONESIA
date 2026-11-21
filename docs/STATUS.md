# STATUS: PETORA

## Gambaran besar

Proyek baru (Mode A) dengan fondasi yang sudah berdiri. Produk: aplikasi web
operasional klinik hewan + pet shop, satu perusahaan banyak cabang, backend Supabase,
UI bergaya Apple, Bahasa Indonesia. Fondasi kode (Next.js + TS + Tailwind + tooling),
modul domain murni (uang, pajak, pembulatan, kandang, FEFO, tagihan), dan skema DB +
RLS sudah dibuat dan **terverifikasi** (38 tes unit + 12 tes RLS/DB hijau; build/lint/
typecheck hijau). Belum ada UI fitur & alur end-to-end; itu langkah berikutnya.

## Sedang dikerjakan

- **Tugas**: Menyelesaikan fondasi — scaffold, tooling, migrasi DB + RLS, modul domain.
  Status: **selesai & terverifikasi** (lihat Pekerjaan terakhir). Bersiap masuk build
  fitur inti.
- **Branch**: `main`.
- **Titik berhenti**: Fondasi hijau & ter-commit (`16f06d5`). Belum ada fitur UI / alur ujung-ke-ujung.
- **Langkah berikutnya konkret**:
  1. Autentikasi (Supabase Auth) + halaman login; middleware proteksi rute area
     `(operational)` dan `(portal)`.
  2. Fitur Organisasi & cabang: halaman pengaturan (Owner) tambah cabang + zona waktu,
     CRUD via RLS; uji BR-001 dari UI.
  3. Fitur Pelanggan & Pasien hewan: daftar/cari pelanggan lintas cabang (BR-003).
  4. Integrasi Supabase nyata (butuh akun — lihat Tumpukan/Masalah terbuka).

## Tumpukan jeda

_Kosong._

## Masalah terbuka

- **Supabase belum disiapkan** (akun/kredensial belum ada). Saat ini migrasi diuji
  terhadap Postgres lokal (Docker) dengan shim `auth.uid()`. Untuk backend nyata perlu
  akun Supabase (proyek) — ini hal di luar kendali agent (AGENTS.md §12), menunggu
  keputusan/akun dari pengguna. Pekerjaan yang tidak bergantung (UI dengan data contoh,
  modul domain) tetap bisa lanjut.

## Pekerjaan terakhir

1. Scaffold Next.js 15 + TS + Tailwind v4 + ESLint/Prettier/Vitest — build/lint/typecheck hijau. (terverifikasi)
2. Modul domain murni + 38 tes unit; contoh baku brief = Rp296.500 persis. (terverifikasi)
3. Migrasi `0001_init.sql` (schema + RLS BR-001/002/003/004) + harness `pnpm test:db`; 12 tes RLS hijau. (terverifikasi)
4. Sanity: tes terbukti bisa gagal saat kode dirusak (5 merah), hijau saat dipulihkan. (terverifikasi)
5. README + docs (PRODUK/FITUR/ATURAN-BISNIS/KEPUTUSAN/KONVENSI/MASALAH/STATUS). (selesai)

## Langkah berikutnya

1. Autentikasi Supabase + login + proteksi rute (operational/portal).
2. Fitur Organisasi & cabang (Owner) dengan CRUD via RLS.
3. Fitur Pelanggan & Pasien hewan (terpusat lintas cabang, BR-003).
4. Rekam medis UI (Dokter) memakai kebijakan RLS yang sudah ada.
5. Siapkan akun Supabase & deploy (Vercel) — perlu pengguna (AGENTS.md §12).
