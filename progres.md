

## Koreksi status merge P0.3
- **Status:** MERGED
- **PR:** #1 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/pull/1
- **Merge commit:** 079ab8a4051703866201aa294e83391c86779dde
- **Tanggal tindakan:** 2026-11-21
- **Catatan koreksi:** Catatan P0.3 sebelumnya menyebut UNMERGED karena dibuat sebelum PR digabung. PR #1 kini berhasil digabung ke main; riwayat sebelumnya dipertahankan.
- **CI:** Status commit merge pending, tanpa status check terlapor. Ini bukan bukti verifikasi aplikasi.

## P0.4 — Fondasi Aplikasi Web dan Supabase
- **Status:** IN_PROGRESS
- **Branch:** feat/p0-4-app-foundation
- **Tujuan:** Membuat fondasi teknis pertama PETORA pada repository yang sebelumnya hanya berisi dokumentasi.
- **Scope:** Scaffold Next.js App Router + TypeScript + Tailwind CSS pada apps/web; menetapkan token dasar Apple Design; menyiapkan konfigurasi lokal Supabase tanpa membuat schema bisnis, policy, akun, atau project cloud yang belum disetujui; dokumentasi cara menjalankan.
- **Acceptance criteria:**
  - Aplikasi web memiliki package manifest, konfigurasi TypeScript/Next.js, App Router, dan Tailwind yang saling konsisten.
  - Design tokens Apple Design tersedia secara terpusat dan dipakai pada global styles.
  - Halaman awal hanya menampilkan informasi produk yang benar, tanpa data operasional contoh, CTA palsu, atau navigasi yang belum berfungsi.
  - Konfigurasi Supabase lokal tersimpan di repository; belum menghubungkan atau mengubah project cloud.
  - README menjelaskan prasyarat, instalasi, dan perintah pengembangan yang aktual.
  - Tidak ada secret, credential, atau keputusan bisnis baru.
  - File dibaca kembali; keterbatasan test/build akibat tidak tersedianya runtime lokal dicatat apa adanya.
- **Batasan verifikasi:** Akses saat ini hanya melalui GitHub connector; tidak tersedia terminal repository untuk memasang dependency atau menjalankan lint/typecheck/build/Supabase CLI. Status tidak boleh dinaikkan menjadi VERIFIED tanpa CI/test yang berhasil.
