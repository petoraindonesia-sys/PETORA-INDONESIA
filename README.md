# PETORA Indonesia

Aplikasi web operasional terintegrasi untuk mengelola aktivitas bisnis klinik hewan
dan pet shop dalam satu sistem terpusat. Satu perusahaan dapat memiliki banyak cabang.

- Bahasa antarmuka & dokumentasi: Bahasa Indonesia (kode & identifier: Inggris).
- Backend: Supabase (Postgres, Auth, Row Level Security). Keamanan & integritas data
  ditegakkan di database, bukan hanya di UI.
- Aplikasi: Next.js (App Router) + TypeScript, Tailwind CSS. Hosting: Vercel.

## Status

Fondasi v1 sedang dibangun. Lihat `docs/STATUS.md` untuk keadaan terkini dan
`docs/FITUR.md` untuk daftar fitur. Gambaran produk ada di `docs/PRODUK.md`,
aturan bisnis (BR-001..BR-021) di `docs/ATURAN-BISNIS.md`, keputusan teknis di
`docs/KEPUTUSAN.md`.

## Prasyarat

- Node.js 20+ dan pnpm 10+
- Docker (untuk menjalankan tes DB/RLS lokal `pnpm test:db`)
- Akun Supabase (untuk menjalankan backend nyata — belum disiapkan)

## Menjalankan (pengembangan)

```bash
pnpm install
pnpm dev          # aplikasi di http://localhost:3000
```

## Pemeriksaan

```bash
pnpm lint         # ESLint
pnpm typecheck    # TypeScript (tsc --noEmit)
pnpm test         # Vitest (unit, logika domain)
pnpm build        # build produksi Next.js
pnpm test:db      # Tes RLS/DB terhadap Postgres lokal (Docker)
```

Seluruh pemeriksaan harus hijau sebelum sebuah pekerjaan dianggap selesai
(AGENTS.md §7).

## Struktur

```
docs/                 # Ingatan proyek
src/
  app/                # Next.js App Router
  components/         # Komponen UI PETORA
  lib/domain/         # Logika bisnis murni (uang, pajak, pembulatan, kandang, FEFO)
  db/
    migrations/       # Migrasi SQL (RLS, schema)
    tests/            # Harness & tes RLS/DB
tests/                # Tes unit (Vitest)
```

## Aturan bisnis yang sudah punya tes

- BR-008 (uang bulat Rupiah), BR-012 (biaya kandang/24 jam), BR-020 (PPN),
  BR-021 (pembulatan), BR-007 (FEFO): `src/lib/domain/*.test.ts`.
- BR-001/002/003/004 (isolasi cabang, permission, rekam medis lintas cabang):
  `pnpm test:db` (dibuktikan di level database).
