# PRODUK: PETORA INDONESIA

## Tujuan

Aplikasi web operasional terintegrasi untuk mengelola seluruh aktivitas bisnis klinik
hewan dan pet shop dalam satu sistem terpusat. Satu perusahaan dapat memiliki banyak
cabang tanpa batas jumlah. Sistem dirancang siap multi-cabang sejak awal, bukan
ditambal belakangan.

## Masalah yang diselesaikan

Operasional klinik hewan dan pet shop biasanya terpecah: pendaftaran, rekam medis,
rawat inap, stok, kasir, dan laporan berjalan di alat yang berbeda. Akibatnya data
ganda, riwayat medis tersebar, stok tidak akurat antar cabang, dan pemilik hewan harus
bertanya langsung ke klinik untuk tahu kondisi hewannya.

PETORA menyatukan semuanya: satu tagihan menampung jasa, tindakan, obat, produk, dan
kandang; stok per cabang akurat dan tidak pernah minus; riwayat medis hewan terbaca
lintas cabang oleh Dokter berizin; pemilik hewan punya portal untuk melihat data
peliharaannya.

## Pengguna dan peran

Dua area aplikasi:

1. **Operational Application** (desktop + tablet): Owner, Supervisor, Dokter, Staff.
2. **Pet Owner Portal** (utama HP): pemilik hewan, hanya baca.

| Peran         | Tujuan utama                                | Catatan                                                                           |
| ------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| Owner         | Memantau & mengendalikan seluruh cabang     | Lihat semua cabang; atur organisasi, pajak, role, permission, laporan konsolidasi |
| Supervisor    | Mengendalikan operasional satu/lebih cabang | Persetujuan khusus: void, koreksi stok, selisih transfer, diskon di atas batas    |
| Dokter        | Memeriksa, mendiagnosis, merawat, mencatat  | Menulis rekam medis, resep, tindakan, rawat inap; membagi info ke portal          |
| Staff         | Menjalankan tugas harian                    | Satu role; fungsi (resepsionis/kasir/perawat/gudang) dibedakan permission         |
| Pemilik hewan | Melihat informasi hewan peliharaannya       | Hanya baca data hewannya sendiri yang diizinkan                                   |

Role dan permission dapat dikonfigurasi (tidak hardcode). Staff adalah **satu role**;
perbedaan fungsi diselesaikan oleh permission, dengan templat bawaan (Resepsionis,
Kasir, Perawat, Gudang) yang dapat diubah Owner per pengguna.

## Arah visual (identitas PETORA)

Karakter: tenang, profesional, ramah, bersih — dipakai di tengah kesibukan klinik.
Mengikuti prinsip Apple Human Interface Guidelines (kejelasan, hierarki tegas, ruang
kosong lega, fokus konten, kontrol yang terasa alami) tanpa menyalin aset/merek Apple.

- **Tipografi**: font sistem (`-apple-system`, `SF Pro` bila ada, fallback `system-ui`).
  Judul besar, skala ukuran konsisten.
- **Warna**:
  - Aksen utama — **Teal PETORA** `#0F766E` (tenang, medis, tepercaya).
  - Aksen hangat sekunder — **Amber tanah liat** `#C2683C` (kehangatan, hewan), dipakai hemat.
  - Netral hangat: teks `#1C1C1E` di atas permukaan `#FAFAF8` (terang);
    teks `#F5F5F7` di atas `#0B0F0E` (gelap).
  - Semantik: sukses `#248A3D`, peringatan `#B25E09`, bahaya `#C0392B`.
  - Mode terang dan gelap.
- **Bentuk**: sudut membulat kontinu, bayangan halus, efek kaca/blur hemat
  (bilah atas & sheet). Ikon garis tipis open-source (mis. Lucide), bukan SF Symbols.
- **Navigasi**: sidebar di desktop; tab bar / navigasi bawah di HP (portal).
- **Komponen khas**: sheet/modal dari bawah, segmented control, daftar bergrup,
  toggle, pencarian di atas.
- **Gerak**: animasi halus & bermakna, menghormati `prefers-reduced-motion`.
  Target sentuh minimal 44 px.
- **Bahasa antarmuka**: Bahasa Indonesia sehari-hari yang sopan dan singkat; istilah
  klinik lazim (anamnesis, diagnosis, rawat inap). Portal memakai bahasa awam.

Yang dihindari: dashboard template generik, gradien ungu-biru, emoji sebagai dekorasi,
kartu seragam tanpa hierarki, teks isian klise.

## Asumsi (diambil saat brief tidak eksplisit)

- **ASUMSI-1**: "Supervisor" adalah penanggung jawab operasional cabang, ditugaskan ke
  satu atau lebih cabang (mengikuti pola penugasan pengguna operasional).
- **ASUMSI-2**: Satu perusahaan (tenant tunggal). Multi-tenant antar perusahaan di luar
  cakupan.
- **ASUMSI-3**: Pembayaran dicatat manual oleh kasir; tidak ada payment gateway.
- **ASUMSI-4**: Tarif PPN awal nonaktif sampai Owner mengisinya (default aman).
- **ASUMSI-5**: Mata uang tunggal Rupiah (IDR), disimpan sebagai bilangan bulat Rupiah.
- **ASUMSI-6**: Setiap cabang wajib punya zona waktu (WIB/WITA/WIT); waktu disimpan UTC.

## Lingkup

Lihat `FITUR.md` untuk daftar fitur dan status, `KEPUTUSAN.md` untuk keputusan teknis,
dan `BRIEF.md` untuk gambaran produk lengkap dari pengguna.
