

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
