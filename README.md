# PETORA Indonesia

Platform operasional klinik hewan dan pet shop untuk satu perusahaan dengan banyak cabang, dilengkapi portal pemilik hewan.

## Repository

- `apps/web`: aplikasi web Next.js.
- `supabase`: konfigurasi lokal dan migration database.
- `AGENTS.md`: kontrak pengembangan utama.
- `progres.md`: riwayat pekerjaan dan status verifikasi.

## Prasyarat

- Node.js 20.9 atau lebih baru.
- npm.
- Untuk menjalankan Supabase lokal: Supabase CLI dan Docker Desktop/compatible Docker runtime.

## Menjalankan aplikasi web

```bash
cd apps/web
npm install
npm run dev
```

Buka http://localhost:3000.

Perintah pemeriksaan yang tersedia dari direktori `apps/web`:

```bash
npm run lint
npm run typecheck
npm run build
```

Jalankan `npm install` terlebih dahulu. Commit pertama ini belum menyertakan `package-lock.json`; setelah dependency terpasang, commit lockfile yang dihasilkan agar instalasi CI/deployment dapat memakai `npm ci`.

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
