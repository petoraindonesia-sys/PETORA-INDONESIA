

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
