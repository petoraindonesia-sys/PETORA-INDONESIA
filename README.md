# PETORA Indonesia

Platform operasional klinik hewan dan pet shop untuk satu perusahaan dengan banyak cabang, dilengkapi portal pemilik hewan.

## Repository

- `apps/web`: aplikasi web Next.js.
- `supabase`: konfigurasi lokal dan migration database.
- `AGENTS.md`: kontrak pengembangan utama.
- `progres.md`: riwayat pekerjaan dan status verifikasi.

## Prasyarat

- Node.js 20.9 atau lebih baru (CI menggunakan Node.js 22).
- npm.
- Untuk menjalankan Supabase lokal: Supabase CLI dan Docker Desktop/compatible Docker runtime.

## Menjalankan aplikasi web

```bash
cd apps/web
npm ci
npm run dev
```

Buka http://localhost:3000.

Perintah pemeriksaan dari direktori `apps/web`:

```bash
npm run lint
npm run typecheck
npm run build
```

Lockfile npm berada di `apps/web/package-lock.json`. Gunakan `npm ci` untuk instalasi yang konsisten dengan lockfile; jika dependency diubah, jalankan `npm install` dan commit perubahan `package-lock.json` bersama `package.json`.

## Continuous integration

GitHub Actions menjalankan workflow **PETORA Web CI** saat perubahan aplikasi web didorong atau pull request dibuka ke `main`. Workflow melakukan instalasi dari lockfile, ESLint, TypeScript typecheck, dan production build.

## Menjalankan Supabase lokal

Pasang Supabase CLI dan Docker terlebih dahulu, kemudian dari root repository:

```bash
supabase start
supabase status
supabase stop
```

Konfigurasi lokal berada di `supabase/config.toml`. Belum ada project cloud yang di-link, migration bisnis, atau konfigurasi secret. Jangan menjalankan `supabase link` atau migration ke project cloud tanpa persetujuan Owner.

## Arsitektur

- Frontend dan deployment web: Vercel.
- Database, autentikasi, dan layanan backend: Supabase.
- Framework web: Next.js App Router, TypeScript, Tailwind CSS.
- UI: Apple Design dengan semantic design tokens.
