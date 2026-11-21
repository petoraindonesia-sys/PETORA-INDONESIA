# KEPUTUSAN: PETORA

Format tiap entri: **Apa** (keputusan) — **Kenapa** — **Alternatif yang ditolak**.

## K-001 Framework aplikasi: Next.js (App Router) + TypeScript — Diterima

- **Apa**: Aplikasi web full-stack memakai Next.js App Router dengan TypeScript,
  di-deploy ke Vercel.
- **Kenapa**: Kesesuaian terbaik dengan Supabase (SSR, Server Components, Route
  Handlers) dan Vercel (platform hosting yang dipilih). Satu basis kode untuk UI dan
  endpoint server; TypeScript untuk keamanan tipe pada domain uang dan status.
- **Alternatif ditolak**:
  - SPA (React/Vite) + API terpisah: memecah dua deployment, SSR/SEO portal lebih sulit.
  - Cloudflare Workers: ekosistem Next.js kurang native dibanding Vercel.

## K-002 Backend: Supabase (Postgres, Auth, RLS, Storage, Realtime) — Diterima

- **Apa**: Seluruh backend di Supabase. Keamanan & integritas data ditegakkan di
  Postgres via Row Level Security (RLS) dan fungsi/trigger, bukan hanya di klien.
- **Kenapa**: Kebutuhan inti brief (isolasi cabang, hak akses, stok atomik, jejak
  audit) paling aman ditegakkan di database. RLS + fungsi server mencegah kebocoran
  lintas cabang walau klien termanipulasi. Hemat biaya (tier gratis).
- **Alternatif ditolak**:
  - Firebase/Firestore: model dokumen kurang cocok untuk stok atomik + laporan relasional.
  - Backend custom (Express/Nest) + Postgres polos: menambah lapisan & biaya tanpa
    kebutuhan terukur; RLS tetap diperlukan.

## K-003 Gaya UI: Tailwind CSS + komponen khusus (Apple-inspired) — Diterima

- **Apa**: Tailwind CSS untuk styling, dengan komponen React khusus PETORA (bukan
  template). Tema terang/gelap via token warna di `PRODUK.md`.
- **Kenapa**: Iterasi cepat, konsisten dengan arah visual, tanpa dependensi UI kit
  berat yang sulit dikustomisasi ke gaya yang diminta.
- **Alternatif ditolak**:
  - shadcn/Radix penuh: menambah kompleksitas; sebagian primitif (mis. dialog/fokus)
    boleh diadopsi bila perlu aksesibilitas, dicatat terpisah.
  - Material UI: identitas visual terlalu "Material", bukan Apple-inspired.

## K-004 Uang sebagai bilangan bulat Rupiah (bigint / integer) — Diterima

- **Apa**: Semua nilai uang disimpan dan dihitung sebagai bilangan bulat Rupiah.
  Tidak ada float. Pembulatan eksplisit dan tercatat (BR-008, BR-021).
- **Kenapa**: Menghindari error pembulatan floating point pada domain uang.
- **Alternatif ditolak**: `numeric` dengan skala desimal untuk IDR — pecahan sen tidak
  dipakai; bilangan bulat lebih sederhana & tepat untuk Rupiah.

## K-005 Mesin uang & perhitungan (pajak, pembulatan, kandang) sebagai modul murni — Diterima

- **Apa**: Logika kalkulasi (subtotal, diskon, dasar pajak, PPN, pembulatan, biaya
  kandang per 24 jam, FEFO) ditulis sebagai fungsi murni TypeScript di `src/lib/domain`,
  terpisah dari UI/DB, dengan tes unit. Logika yang sama di-enforce di DB (trigger)
  untuk transaksi yang menentukan uang.
- **Kenapa**: Dapat diuji tanpa DB, mudah dipastikan benar (contoh perhitungan brief),
  dan menjadi sumber kebenaran tunggal. DB tetap tegakkan integritas (tidak minus, dst).
- **Alternatif ditolak**: Logika hanya di UI — tidak aman; hanya di SQL — sulit diuji
  dan dibaca ulang.

## K-006 Pengujian: Vitest (unit) + skrip node-postgres untuk RLS — Diterima

- **Apa**: Vitest untuk unit/fungsi. Pengujian RLS/DB menjalankan migrasi pada Postgres
  lokal (Docker) dan memverifikasi isolasi cabang dengan role `authenticated` + klaim
  JWT yang di-emulasikan.
- **Kenapa**: Membuktikan BR-001/002/003 di level database (tuntutan brief), bukan hanya
  di UI. Reproducible di CI tanpa akun Supabase.
- **Alternatif ditolak**: Hanya tes unit — tidak membuktikan RLS.

## K-007 Manajemen paket: pnpm — Diterima

- **Apa**: pnpm dengan `pnpm-lock.yaml` yang di-commit (dependensi di-pin).
- **Kenapa**: Deterministik, hemat disk, cepat di CI.

## K-008 Bahasa dokumentasi: Bahasa Indonesia — Diterima

- **Apa**: Dokumentasi & teks antarmuka Bahasa Indonesia; kode & identifier Inggris.

## K-009 Local-first tanpa Supabase (aturan terkunci) — Diterima

- **Apa**: Implementasi & pengujian **tidak** terhubung ke Supabase. Backend nyata
  selama pengembangan adalah **Postgres lokal (Docker)**, diakses lewat modul data
  `src/lib/db` yang:
  - membuka koneksi `pg`, menetapkan `set_config('app.user_id', <uuid>, false)` dan
    `set role authenticated` sebelum tiap operasi permintaan, sehingga **seluruh
    kebijakan RLS dijalankan persis seperti di produksi**;
  - memakai peran `postgres`/`service_role` (bypass RLS) hanya untuk seed & tugas admin.
  - `auth.uid()` di-shim membaca `app.user_id` (lihat migrasi/harness).
- **Mengapa**: Aturan pengguna: lanjutkan tanpa Supabase, uji lokal. Memisahkan lapisan
  data dari penyedia Auth membuat logika bisnis & RLS identis antara lokal dan produksi;
  saat Supabase disiapkan, hanya perlu mengganti adapter koneksi & Auth.
- **Konsekuensi**: Autentikasi produksi (Supabase Auth) diganti sementara oleh aktor
  eksplisit pada lapisan service (di UI nanti: dari sesi lokal). RLS tetap penjaga utama.
- **Alternatif ditolak**: Menulis fitur langsung untuk Supabase SDK — tidak dapat diuji
  tanpa akun; Melonggarkan RLS — melanggar keamanan wajib brief.

## K-010 Pola data: koneksi + service per domain, diuji integrasi (Docker) — Diterima

- **Apa**: Lapisan `src/lib/db` (koneksi & konteks RLS) + service per domain
  (`src/lib/inventory`, `src/lib/billing`) berisi operasi tervalidasi. Tes integrasi
  (Vitest) menyalakan Postgres Docker sekali (globalSetup), menerapkan migrasi, lalu
  menjalankan skenario (termasuk konkurensi) terhadap DB nyata.
- **Kenapa**: Membuktikan integritas (stok tidak minus walau dua transaksi bersamaan,
  pembayaran tidak ganda, isolasi cabang) dengan bukti, bukan klaim.
- **Alternatif ditolak**: Mock DB untuk stok/pembayaran — tidak membuktikan atomicitas.
