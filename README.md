# PETORA Indonesia

Aplikasi web operasional terintegrasi untuk mengelola aktivitas bisnis klinik hewan
dan pet shop dalam satu sistem terpusat. Satu perusahaan dapat memiliki banyak cabang.

- Bahasa antarmuka & dokumentasi: Bahasa Indonesia (kode & identifier: Inggris).
- Backend: Supabase (Postgres, Auth, Row Level Security). Keamanan & integritas data
  ditegakkan di database, bukan hanya di UI.
- Aplikasi: Next.js (App Router) + TypeScript, Tailwind CSS. Hosting: Vercel.

## Status

Fondasi + lapisan domain/service v1 sedang dibangun. Lihat `docs/STATUS.md` untuk
keadaan terkini dan `docs/FITUR.md` untuk daftar fitur. Gambaran produk ada di
`docs/PRODUK.md`, aturan bisnis (BR-001..BR-021) di `docs/ATURAN-BISNIS.md`, keputusan
teknis di `docs/KEPUTUSAN.md`.

Backend memakai **Postgres lokal (Docker)** selama pengembangan (tanpa Supabase —
lihat `docs/KEPUTUSAN.md` K-009). Keamanan & integritas ditegakkan RLS di database.

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
pnpm test         # Vitest (unit, logika domain) - tanpa Docker
pnpm build        # build produksi Next.js
pnpm test:db      # Tes integrasi RLS/DB terhadap Postgres lokal (Docker)
```

Seluruh pemeriksaan harus hijau sebelum sebuah pekerjaan dianggap selesai
(AGENTS.md §7).

## Struktur

```
docs/                 # Ingatan proyek
src/
  app/                # Next.js App Router
  components/         # Komponen UI PETORA
  lib/
    domain/           # Logika bisnis murni (uang, pajak, pembulatan, kandang, FEFO, tagihan)
    db/               # Lapisan data (pool + withActor yang menjalankan RLS)
    inventory/        # Service inventori (terima stok, FEFO atomik, penyesuaian)
    billing/          # Service kasir (buat tagihan, pembayaran idempoten, void)
  db/
    migrations/       # Migrasi SQL (schema + RLS) 0001, 0002
    tests/            # globalSetup + fixture + tes integrasi `.itest.ts`
tests/                # Tes unit (Vitest)
```

## Aturan bisnis yang sudah punya tes

- BR-007/008/009/012/020/021: `src/lib/domain/*.test.ts` (unit, 38 tes).
- BR-001/002/003/004 (isolasi cabang, permission, rekam medis lintas cabang):
  `pnpm test:db` — `src/db/tests/rls.integration.itest.ts`.
- BR-006/007 (stok atomik & FEFO, termasuk dua transaksi bersamaan):
  `src/db/tests/inventory.integration.itest.ts`.
- BR-009/010/011/018/020/021 (tagihan, pembayaran sebagian/lunas, anti bayar ganda, void):
  `src/db/tests/billing.integration.itest.ts`.
