# KONVENSI: PETORA

## Struktur folder

```
docs/            # Ingatan proyek (PRODUK, FITUR, ATURAN-BISNIS, KEPUTUSAN, dst.)
src/
  app/           # Next.js App Router (rute & halaman)
    (operational)/  # area operasional (butuh auth + izin)
    (portal)/       # area pemilik hewan (butuh auth portal)
    api/            # route handlers bila perlu
  components/    # Komponen UI PETORA (button, sheet, list, dst.)
  lib/
    domain/      # Logika bisnis murni (uang, pajak, pembulatan, kandang, FEFO)
    supabase/    # Klien & helper Supabase (browser/server)
  db/
    migrations/  # Migrasi SQL (di-commit, bisa diulang)
    tests/       # Skrip & tes RLS/DB (node-postgres)
supabase/        # (bila dipakai CLI) config & seed
tests/           # Tes unit (Vitest) bila di luar src
```

## Gaya kode

- TypeScript `strict`. Nama file `kebab-case.tsx` untuk komponen, `camelCase.ts`
  untuk modul. Identifier domain bahasa Inggris (`invoice`, `branch`, `stockBatch`).
- Uang: `bigint`/integer Rupiah. **Tidak ada `number` float untuk uang.**
- Tanggal/waktu: simpan UTC; tampil sesuai zona cabang (BR-016). Pakai `Date`/ISO 8601.
- Komentar hanya menjelaskan **kenapa**, bukan **apa**.
- Tanpa `any` tanpa alasan; tanpa `TODO`/stub/kode mati di kode final.

## Perintah penting

```bash
pnpm install            # pasang dependensi
pnpm dev                # jalankan aplikasi (Next.js)
pnpm build              # build produksi
pnpm lint               # ESLint
pnpm typecheck          # tsc --noEmit
pnpm test               # Vitest (unit)
pnpm test:db            # Tes RLS/DB terhadap Postgres lokal (Docker)
```

## Tes

- Unit (Vitest): fungsi murni di `src/lib/domain`. Setiap tes menyebut BR yang diuji.
- DB/RLS: `pnpm test:db` menyalakan Postgres (Docker), menerapkan migrasi, lalu
  memverifikasi isolasi cabang (BR-001/002/003) sebagai role `authenticated`.
- Tes harus **benar-benar bisa gagal**: ubah kode → tes merah.

## Commit

Pesan singkat, konsisten: `fitur:`, `perbaikan:`, `refactor:`, `dokumen:`, `tes:`.
Commit kecil, utuh, hijau. Jangan commit tanpa diminta.

## Akhir tiap tugas

Lint, typecheck, test, build hijau; dokumentasi terkait & `STATUS.md` diperbarui
di commit yang sama (AGENTS.md §13).
