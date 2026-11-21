

## P0.1 — Penetapan Arah UI Apple Design

- **Status:** IN_PROGRESS
- **Branch:** main
- **Tujuan:** Menetapkan Apple Design sebagai kontrak visual resmi PETORA.
- **Scope:** Memperbarui pedoman UI pada AGENTS.md dan mencatat keputusan Owner pada progres.md.
- **Acceptance criteria:**
  - Apple Design dinyatakan sebagai arah visual resmi.
  - Pedoman mencakup tipografi, warna, permukaan, komponen, interaksi, dan responsivitas.
  - Aturan bisnis, arsitektur, dan keputusan sebelumnya tidak berubah.
  - Tidak mengklaim UI telah diimplementasikan sebelum kode dan pengujian tersedia.


### Catatan penyelesaian P0.1
- **Status akhir:** IMPLEMENTED
- **File diubah:** AGENTS.md, progres.md.
- **Perubahan:** Apple Design ditetapkan sebagai kontrak visual resmi, termasuk karakter visual, palet, tipografi, komponen, layout, interaksi, aksesibilitas, dan konsistensi antar modul.
- **Pengujian:** Tidak ada pengujian UI karena belum ada kode frontend.
- **Verifikasi dokumentasi:** AGENTS.md berhasil diperbarui pada branch main; progres.md dibaca kembali sebelum penutupan entri.
- **Commit AGENTS.md:** e487a39c46e00077e8310d4a7a52de778ef2f620
- **Commit entri IN_PROGRESS:** 702d53501c69888627d75683b13472df870c7a60
- **Status merge:** Langsung berada di main; tidak ada PR.
- **Catatan:** Kontrak visual sudah ditetapkan, tetapi implementasi UI Apple Design belum dimulai dan belum VERIFIED.


## P0.2 — Penguatan Kontrak Operasional Agen

- **Status:** IN_PROGRESS
- **Branch:** main
- **Tujuan:** Melengkapi AGENTS.md agar agen dapat mengembangkan PETORA secara konsisten, aman, dan dapat diverifikasi.
- **Scope:** Menambahkan aturan prioritas sumber kebenaran, inspeksi repository, strategi implementasi vertikal, standar Supabase/RLS, integrasi Vercel, pengujian, pengelolaan dependensi, serta kriteria penyelesaian.
- **Acceptance criteria:**
  - Agen wajib membaca instruksi dan kondisi repository sebelum bertindak.
  - Perubahan database, autentikasi, otorisasi, dan UI memiliki aturan implementasi serta verifikasi yang eksplisit.
  - Tidak ada asumsi konfigurasi, keputusan bisnis, atau klaim hasil yang tidak didukung bukti.
  - Aturan yang telah disetujui Owner dan kontrak Apple Design tetap dipertahankan.


### Catatan penyelesaian P0.2
- **Status akhir:** IMPLEMENTED
- **File diubah:** AGENTS.md, progres.md.
- **Perubahan:** Ditambahkan kontrak prioritas sumber kebenaran, protokol inspeksi repository, implementasi vertikal, standar Supabase/RLS, Vercel, autentikasi/RBAC/audit, pengujian, dependensi, Git/review, dan format laporan.
- **Pemeriksaan:** AGENTS.md berhasil dibaca kembali setelah commit dan memuat bagian 11–20. progres.md dibaca sebelum penutupan entri.
- **Pengujian aplikasi:** Tidak dijalankan; repository belum memiliki implementasi aplikasi yang dapat diuji dalam pekerjaan ini.
- **Commit entri IN_PROGRESS:** dc1fa7978e8e3f19cd26d93c19045fb40ea836e6
- **Commit AGENTS.md:** 12cc4d0e8e5492338549744a0a11fac9254fdbe5
- **Commit penutupan progres:** akan dicatat oleh commit ini.
- **Status merge:** Perubahan langsung pada main; tidak ada PR.
- **Catatan:** Kontrak agen diperluas pada level dokumentasi. Belum ada implementasi aplikasi, test runtime, atau deployment yang diverifikasi.


#### Koreksi bukti commit P0.2
- **Commit penutupan progres yang sebenarnya:** 5db565897c8fff72b94358909725af4abeb3f28e
- Catatan sebelumnya yang menyebut SHA akan dicatat oleh commit tersebut dilengkapi dengan SHA aktual ini. Riwayat sebelumnya dipertahankan.


## P0.3 — Instruksi Agen Turunan per Area

- **Status:** IN_PROGRESS
- **Branch:** docs/p0-3-scoped-agent-guides
- **Tujuan:** Menambahkan instruksi teknis khusus frontend dan Supabase tanpa menduplikasi atau bertentangan dengan kontrak root.
- **Scope:** Membuat apps/web/AGENTS.md dan supabase/AGENTS.md. Keduanya menjadi pedoman direktori yang akan digunakan saat struktur implementasi dibuat.
- **Acceptance criteria:**
  - Instruksi frontend mencakup Apple Design, Next.js/TypeScript, aksesibilitas, keamanan browser/server, state UI, dan pengujian.
  - Instruksi Supabase mencakup migration, schema, RLS, branch isolation, Auth, Edge Functions/Storage bila digunakan, audit, dan database testing.
  - Tidak mengarang struktur aplikasi, nama tabel, environment variable, atau fitur yang belum ditetapkan.
  - Kedua dokumen menyatakan bahwa aturan root dan keputusan Owner tetap mengikat.
  - File dibaca kembali setelah commit; keterbatasan pengujian dicatat secara jujur.


### Catatan penyelesaian P0.3
- **Status akhir:** IMPLEMENTED
- **File dibuat:** apps/web/AGENTS.md, supabase/AGENTS.md; progres.md diperbarui.
- **Frontend guide:** Apple Design, Next.js/TypeScript, komponen, keamanan sesi, branch context, form, aksesibilitas, performa, dan pengujian.
- **Supabase guide:** schema/migration, multi-branch, RLS, Auth/RBAC, RPC/Edge Functions, Storage/Realtime, audit, environment, dan database security testing.
- **Pemeriksaan:** Kedua file berhasil dibaca kembali dari branch dan bagian penutup masing-masing ditemukan.
- **Pengujian aplikasi/database:** Tidak dijalankan. Repository belum menyediakan implementasi aplikasi/database untuk diuji; pekerjaan ini hanya menambahkan pedoman.
- **Commit IN_PROGRESS:** f5c0592ad819de9fa8276ada4c42c330ed2a0170
- **Commit apps/web/AGENTS.md:** 639d21bd9697b68382adcfe7693b7d7dffc847a5
- **Commit supabase/AGENTS.md:** cb2942289ee3ec51da51cb34be55352ba5cf45be
- **Branch:** docs/p0-3-scoped-agent-guides
- **Status merge:** UNMERGED — belum dibuat PR dan belum masuk main.
- **Catatan:** Dokumen instruksi tersedia di branch kerja. Belum ada verifikasi runtime, test, atau deployment.


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


### Catatan penyelesaian P0.4
- **Status akhir:** IMPLEMENTED
- **File dibuat:** README.md, .gitignore, apps/web/package.json, apps/web/tsconfig.json, apps/web/next.config.ts, apps/web/postcss.config.mjs, apps/web/eslint.config.mjs, apps/web/next-env.d.ts, apps/web/app/layout.tsx, apps/web/app/page.tsx, apps/web/app/globals.css, supabase/config.toml; progres.md diperbarui.
- **Implementasi frontend:** Scaffold Next.js App Router + TypeScript + Tailwind CSS v4; metadata Bahasa Indonesia; halaman awal informatif tanpa data operasional palsu atau tombol/navigasi yang belum berfungsi; token Apple Design dasar terpusat.
- **Implementasi Supabase:** Konfigurasi CLI lokal minimal. Belum ada schema bisnis, migration, policy, Auth, project ref, atau perubahan project cloud.
- **Dependency yang ditetapkan:** Next.js 16.4.6, React 19.3.1, Tailwind CSS 4.3.5; versi langsung dipatok di package.json.
- **Pemeriksaan repository:** Seluruh file yang dibuat berhasil dibaca kembali dari branch. JSON package.json dan tsconfig.json dapat diperiksa secara tekstual; belum dilakukan instalasi dependency.
- **Test/lint/typecheck/build:** Tidak dijalankan karena akses eksekusi repository/terminal tidak tersedia pada sesi ini. Belum ada CI run. Status bukan VERIFIED.
- **Keterbatasan:** package-lock.json belum tersedia; README mencatat agar npm install menghasilkan lockfile yang kemudian di-commit sebelum mengaktifkan instalasi CI/deployment yang reproducible.
- **Commit progres awal:** f2d273c3ee6f973e79bb7b56494ad503e5870164 (dikoreksi dengan commit pemulihan riwayat 7e608e0fb8b0db90d8f1bd8aab1969c3369c3aa1).
- **Commit scaffold:** a4e41cd25ec0dff2f86bbca8bcd529a579b392b3
- **Branch:** feat/p0-4-app-foundation
- **Status merge:** UNMERGED — PR belum dibuat pada saat catatan ini ditulis.


#### Koreksi status PR P0.4
- **PR:** #2 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/pull/2
- **Status PR:** OPEN, UNMERGED
- **Head commit:** 394725c9e6533bb06e5e117debccdec17d26c758
- **Catatan koreksi:** Baris sebelumnya menyebut PR belum dibuat karena ditulis sebelum PR dibuka. PR #2 kini sudah dibuat; belum digabung ke main.
