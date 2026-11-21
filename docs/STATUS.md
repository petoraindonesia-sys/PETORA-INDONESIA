# STATUS: PETORA

## Gambaran besar

Proyek baru (Mode A) dengan fondasi + lapisan domain/service/auth yang sudah
terverifikasi. Produk: aplikasi web operasional klinik hewan + pet shop, satu
perusahaan banyak cabang, backend Postgres (local-first, tanpa Supabase — K-009), UI
bergaya Apple, Bahasa Indonesia. Fondasi kode, modul domain murni, skema DB + RLS,
lapisan data (withActor), service inventori & billing, dan **service autentikasi lokal
(sesi + password scrypt)** sudah dibuat & **terverifikasi** (38 tes unit + 37 tes
integrasi hijau; build/lint/typecheck hijau). Belum ada UI fitur lengkap (hanya login
& placeholder /app).

## Sedang dikerjakan

- **Tugas**: Autentikasi lokal (gerbang masuk) + rute login/logout/me + middleware.
  Status: **selesai & terverifikasi**. Bersiap membangun UI fitur (cabang, kasir, dst).
- **Branch**: `main`.
- **Titik berhenti**: Auth hijau; UI masih minimal (login + /app placeholder).
- **Langkah berikutnya konkret**:
  1. UI Organisasi & cabang (Owner): CRUD cabang + zona waktu via service (RLS).
  2. UI Kasir: buat tagihan (pakai `createInvoice`) + catat pembayaran (`recordPayment`).
  3. UI Rekam medis (Dokter) & Pelanggan/Pasien.
  4. Integrasi Supabase (ganti `DATABASE_URL`) & deploy — butuh akun (di luar kendali).

## Tumpukan jeda

_Kosong._

## Masalah terbuka

- **Supabase belum disiapkan** (keputusan pengguna: lanjut tanpa Supabase, uji lokal —
  K-009). Backend = Postgres lokal (Docker). Saat backend nyata dibutuhkan, ganti
  `DATABASE_URL` ke connection string Supabase; RLS & service tetap.

## Pekerjaan terakhir

1. Migrasi `0003_auth_session.sql`: `app_session` (token hash) + `password_hash`/`email` di profiles + RLS deny. (terverifikasi)
2. Service auth (`src/lib/auth/service.ts`): hashPassword/verifyPassword (scrypt), createSession (hash+salt), authenticate, destroySession, destroyAllSessions, login. (terverifikasi)
3. Helper route (`src/lib/auth/session.ts`): getSession/requireActor/startSession/endSession. (terverifikasi)
4. Rute `/api/auth/login|logout|me` + halaman login + `/app` terproteksi + middleware. (terverifikasi build)
5. 14 tes integrasi auth (hash, login benar/salah, token hanya hash di DB, sesi dicabut/kedaluwarsa, RLS via sesi). (terverifikasi)

## Langkah berikutnya

1. UI Organisasi & cabang (Owner) memakai service + RLS.
2. UI Kasir & pembayaran (pakai service billing yang sudah teruji).
3. UI Rekam medis + Pelanggan & hewan.
4. Siapkan Supabase & deploy (Vercel) — perlu pengguna (AGENTS.md §12).