

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


## Koreksi status merge P0.4
- **Status:** MERGED
- **PR:** #2 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/pull/2
- **Merge commit:** 025e304fba97fb2f9b8b46efd75a38721b5d9b5f
- **Tanggal tindakan:** 2026-11-21
- **Catatan koreksi:** Catatan P0.4 sebelumnya menyebut PR masih terbuka. PR #2 telah digabung ke main atas instruksi Owner.

## P0.5 — Dependency Lockfile dan CI Build
- **Status:** IN_PROGRESS
- **Branch:** ci/p0-5-lockfile-github-actions
- **Tujuan:** Membuat instalasi dependency reproducible dan memverifikasi kualitas dasar aplikasi web secara otomatis pada GitHub Actions.
- **Scope:** Menghasilkan package-lock.json dari apps/web/package.json; menambahkan workflow GitHub Actions untuk Node.js, npm ci, ESLint, TypeScript check, dan production build; memperbarui README dan progres.md.
- **Acceptance criteria:**
  - package-lock.json di-commit dan konsisten dengan package.json.
  - GitHub Actions menjalankan npm ci, lint, typecheck, dan build.
  - Workflow memakai versi Node yang didukung Next.js dan tidak memerlukan secrets.
  - CI berjalan pada pull request ke main dan push ke main.
  - Hasil workflow dibaca dari run aktual; status VERIFIED hanya jika seluruh job relevan sukses.
  - Tidak ada perubahan schema Supabase atau keputusan bisnis.
- **Batasan:** Pekerjaan ini menggunakan GitHub Actions sebagai runtime build karena sesi tidak memiliki terminal repository lokal. Jika workflow gagal, perbaikan dicatat dan diuji ulang; kegagalan tidak boleh disembunyikan.


### Catatan penyelesaian P0.5
- **Status akhir:** VERIFIED
- **File dibuat/diubah:** apps/web/package-lock.json, .github/workflows/web-ci.yml, README.md, progres.md.
- **Lockfile:** package-lock.json dihasilkan oleh npm pada GitHub Actions, menggunakan lockfileVersion 3; manifest root di lockfile sesuai dengan apps/web/package.json.
- **Commit lockfile:** fa4ccff5c74a9839b0f589a71615ed9a50824bd1
- **Workflow:** PETORA Web CI, Node.js 22, npm cache berdasarkan apps/web/package-lock.json, permission minimum contents: read, menjalankan npm ci, ESLint, TypeScript typecheck, dan production build.
- **Verifikasi CI:** Run #4 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/actions/runs/44845663991
- **Hasil CI:** SUCCESS. Verify npm lockfile, npm ci, lint, typecheck, production build, dan cleanup seluruhnya selesai sukses.
- **Commit konfigurasi CI final:** cf81de23a970404cc2ea0fcb4db24e174e4c59f7
- **Commit awal workflow/bootstrap:** 5385ff5e2b1f843487a74551002ab324f9eab046. Lockfile kemudian dibuat sebagai commit bot terpisah dan workflow disederhanakan menjadi read-only.
- **PR:** #3 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/pull/3
- **Status merge:** UNMERGED — PR #3 masih terbuka; belum masuk main.
- **Batas verifikasi:** Yang diverifikasi adalah install, lint, typecheck, dan production build frontend. Belum ada pengujian browser/E2E, integrasi Supabase, atau deployment Vercel.


## P0.6 — Fondasi Design System Apple

- **Status:** IN_PROGRESS
- **Branch:** feat/p0-6-apple-design-system
- **Tujuan:** Mengubah token visual dasar menjadi fondasi Design System Apple yang reusable dan aksesibel untuk seluruh area frontend PETORA.
- **Scope:** Audit implementasi frontend yang sudah ada; menyempurnakan design tokens; membuat komponen dasar Button, Input, Select, Card, Badge, dan komponen status; menerapkan komponen pada halaman awal tanpa menambahkan data operasional palsu atau navigasi/aksi semu; menambahkan state interaksi dan responsive/accessibility styling.
- **Acceptance criteria:**
  - Token warna, tipografi, spacing, radius, border, elevation, dan focus konsisten serta terpusat.
  - Komponen dasar reusable memiliki API TypeScript yang jelas dan state relevan (default, hover, focus, disabled, invalid/loading bila sesuai).
  - Form controls memiliki label dan pesan/helper text yang aksesibel.
  - Layout mendukung mobile, tablet, dan desktop serta prefers-reduced-motion.
  - Tidak ada dependensi UI tambahan tanpa kebutuhan terukur.
  - Halaman awal menggunakan sistem visual yang sama dan tidak menampilkan data operasional palsu atau tombol tanpa aksi.
  - GitHub Actions berhasil menjalankan install, lint, typecheck, dan production build.
- **Batas verifikasi:** Belum ada test runner unit/component atau browser E2E pada package saat tahap dimulai. CI build/lint/typecheck tidak membuktikan interaksi browser atau aksesibilitas secara menyeluruh; keterbatasan ini harus dicatat.


### Catatan penyelesaian P0.6
- **Status akhir:** VERIFIED untuk pemeriksaan CI yang tersedia; verifikasi visual/browser masih belum dilakukan.
- **File dibuat:** apps/web/components/ui/button.tsx, input.tsx, select.tsx, card.tsx, badge.tsx, status-message.tsx, index.ts.
- **File diubah:** apps/web/app/globals.css, apps/web/app/page.tsx, progres.md.
- **Implementasi:** Design tokens Apple diperluas untuk surface, warna semantik, aksen, border, typography, radius, focus, dan elevation. Komponen reusable memiliki API TypeScript, varian/status yang sesuai, label/helper/error untuk kontrol form, loading/disabled untuk Button, role status/alert, focus-visible, responsive layout, dan reduced-motion.
- **Dependensi:** Tidak ada dependency UI baru.
- **Verifikasi CI:** GitHub Actions run #16 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/actions/runs/44846077441 — SUCCESS pada commit 0dea6c0391de95e80a7f95412c0d27f1f832a7bd. Verify lockfile, npm ci, lint, typecheck, dan production build seluruhnya sukses.
- **Catatan PR CI:** PR-triggered run #17 masih berjalan saat catatan ini dibuat; run #16 adalah push run pada SHA yang sama persis dengan head PR #4 dan semua langkahnya sukses.
- **Pengujian yang belum dilakukan:** Tidak tersedia unit/component test runner atau browser E2E. Belum dilakukan inspeksi visual langsung, pengujian keyboard di browser, screen reader, atau audit kontras otomatis. Build CI bukan bukti penerimaan UX penuh.
- **Branch:** feat/p0-6-apple-design-system.
- **PR:** #4 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/pull/4.
- **Head commit:** 0dea6c0391de95e80a7f95412c0d27f1f832a7bd.
- **Status merge:** UNMERGED — PR #4 masih terbuka dan belum masuk main.


#### Koreksi hasil CI P0.6
- **PR-triggered run #17:** https://github.com/petoraindonesia-sys/PETORA-INDONESIA/actions/runs/44846100096 — SUCCESS.
- Run #17 menguji commit aplikasi 0dea6c0391de95e80a7f95412c0d27f1f832a7bd, yaitu commit yang sama dengan kode frontend pada head PR saat ini; setelah itu hanya progres.md yang berubah.
- Catatan sebelumnya yang menyebut run #17 masih berjalan adalah status sementara saat entri penyelesaian ditulis. Riwayat tersebut dipertahankan dan dikoreksi melalui catatan ini.
- **Head PR terkini:** e468118833b2673efc0ce4ea231b6c4732dd56e2 (perubahan progres.md).


## Koreksi status merge P0.5
- **Status:** MERGED
- **PR:** #3 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/pull/3
- **Merge commit:** c9e8ee30fa938281b2ceeb98eb0eb7329ad1d957
- **Tanggal tindakan:** 2026-11-21
- **Catatan:** PR #3 berhasil digabung ke main setelah CI run #4 SUCCESS. Catatan UNMERGED sebelumnya dipertahankan sebagai riwayat.

## Koreksi status merge P0.6
- **Status:** MERGED
- **PR:** #4 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/pull/4
- **Merge commit:** 0f1ddac8a131c28a3de96b158e947e2f7a5bbfff
- **Tanggal tindakan:** 2026-11-21
- **Verifikasi setelah retarget ke main:** GitHub Actions run #19 pada head PR #4 SUCCESS.
- **Catatan:** PR #4 berhasil digabung setelah PR #3 masuk main dan target PR #4 dipindahkan ke main. Catatan UNMERGED sebelumnya dipertahankan sebagai riwayat.

## Koreksi dan rebase P0.7 — Dashboard Workspace
- **Status:** IN_PROGRESS
- **Branch kerja baru:** feat/p0-7-dashboard-shell-rebased
- **Tujuan:** Mempertahankan implementasi P0.7 setelah squash merge P0.6 mengubah ancestry dan menimbulkan konflik pada PR #5.
- **Scope:** Membuat ulang branch dari main terbaru, membawa hanya perubahan P0.7 yang relevan, mempertahankan komponen Apple Design yang kini sudah ada di main, dan menghindari duplikasi commit P0.6.
- **Perubahan yang dibawa:** apps/web/app/dashboard/page.tsx, apps/web/components/app-shell.tsx, apps/web/app/page.tsx, progres.md.
- **Pemeriksaan:** Branch dibuat dari main setelah merge P0.6. Komponen UI P0.6 tidak disalin ulang karena sudah tersedia di main. Perubahan CSS tidak diperlukan karena design tokens di main sudah memuat aturan yang dipakai shell.
- **Bukti awal:** PR #5 lama mengalami merge conflict setelah base dipindahkan ke main; percobaan merge ditolak GitHub (HTTP 405: merge conflicts). Tidak ada perubahan yang dipaksa ke main.
- **Status merge:** UNMERGED — branch rebased menunggu CI dan PR baru.
- **Catatan verifikasi:** Hasil CI lama P0.7 run #23 SUCCESS pada commit aplikasi 15d7b8878efc3700715c9b5f37e53adc45f8385e. Rebase baru harus diuji ulang pada branch/PR baru sebelum VERIFIED untuk keadaan akhir.


## Koreksi status merge P0.7 — Dashboard Workspace
- **Status merge:** MERGED
- **PR pengganti:** #6 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/pull/6
- **Merge commit:** a6f708a8ea580bb241d0a798d562ee014a91a925
- **Tanggal tindakan:** 2026-11-21
- **PR lama:** #5 ditutup tanpa merge karena mengalami konflik setelah P0.6 di-squash merge.
- **Status implementasi:** IMPLEMENTED dan MERGED. CI run #23 SUCCESS pada implementasi P0.7 sebelum rebase; belum tersedia hasil CI baru pada head rebase PR #6. Belum ada browser E2E atau pemeriksaan runtime drawer.

## P0.8 — Fondasi Database dan Autentikasi Supabase
- **Status:** IN_PROGRESS
- **Branch:** feat/p0-8-supabase-foundation
- **Tujuan:** Menyiapkan fondasi database, identitas staf, sesi, RBAC, audit, dan isolasi multi-cabang menggunakan Supabase sebagai backend tunggal.
- **Scope awal:** Audit konfigurasi dan instruksi Supabase yang ada; validasi dukungan Auth untuk kontrak username + PIN 6 digit; rancangan company/branch, user profile, role/permission, employee assignment, session revocation, dan RLS; siapkan migration serta database security tests setelah pola Auth dan environment dapat diverifikasi.
- **Acceptance criteria:** Migration tersimpan dan berurutan; RLS default-deny; branch isolation diuji positif/negatif; role/permission tidak berasal dari payload browser; PIN tidak tersimpan plaintext; session revocation diuji; CI/database test sukses; tidak ada credential atau data sensitif di repository.
- **Temuan awal:** supabase/config.toml hanya berisi project_id lokal. Supabase MCP account saat inspeksi mengembalikan daftar project kosong. Repository belum menunjukkan migration SQL atau database test pada konfigurasi yang diperiksa.
- **Temuan Auth:** Dokumentasi resmi Supabase menyatakan password-based Auth memakai email atau nomor telepon, bukan username sebagai identifier langsung. Karena itu, implementasi username + PIN tidak boleh diasumsikan kompatibel dengan signInWithPassword tanpa rancangan perantara yang aman.
- **Status:** BLOCKED untuk penerapan dan verifikasi database/Auth aktual sampai tersedia project Supabase yang dapat diakses dan desain alur username + PIN yang dapat diuji end-to-end. Pekerjaan dokumentasi/rancangan non-destruktif dapat dilanjutkan; tidak ada perubahan database cloud.
- **Keamanan:** Tidak membuat akun dummy, tidak mengirim PIN melalui log, tidak memakai service-role di browser, dan tidak membuat custom JWT/session yang belum tervalidasi.


### Catatan pekerjaan P0.8 — validasi autentikasi
- **File dibuat:** docs/architecture/adr-0001-staff-authentication.md.
- **Isi:** Kontrak login staf yang telah disetujui, batas dukungan Supabase Auth, persyaratan keamanan PIN, daftar keputusan implementasi yang masih pending, dan kriteria sebelum implementasi.
- **Sumber teknis:** Dokumentasi resmi Supabase password-based Auth menyatakan identifier email atau nomor telepon; username bukan identifier bawaan untuk signInWithPassword.
- **Pemeriksaan:** File ADR dibuat pada branch dan belum diterapkan ke project cloud.
- **Tidak dilakukan:** Tidak membuat tabel credential/PIN, custom JWT, Edge Function login, policy RLS, akun uji, atau migration spekulatif.
- **Blocker:** Supabase account yang terhubung tidak memiliki project yang terdaftar pada saat pemeriksaan; project ref dan environment untuk pengujian end-to-end belum tersedia. Mekanisme username + PIN juga belum dapat ditetapkan tanpa pembuktian sesi Supabase yang valid.
- **Status tahap:** BLOCKED untuk schema/Auth implementation dan database verification. ADR dokumentasi IMPLEMENTED, keputusan autentikasi PENDING.


### Koreksi status PR P0.8
- **PR:** #7 — https://github.com/petoraindonesia-sys/PETORA-INDONESIA/pull/7
- **Status:** MERGED
- **Merge commit:** 687b3d979c87eb6e54093460c6fbca29fa9c2d3a
- **File yang masuk main:** docs/architecture/adr-0001-staff-authentication.md, progres.md.
- **Catatan:** PR ini hanya menggabungkan dokumentasi/ADR dan catatan progres. Tidak ada migration, perubahan schema/Auth, database test, atau perubahan project Supabase.
- **Status tahap P0.8:** BLOCKED untuk implementasi database/Auth dan verifikasi end-to-end. ADR telah MERGED; keputusan mekanisme autentikasi tetap PENDING.
