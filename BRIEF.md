# BRIEF PROYEK: PETORA

---

## 0. Identitas

- Nama proyek: PETORA INDONESIA
- Bahasa antarmuka pengguna: Bahasa Indonesia
- Bahasa dokumentasi: Bahasa Indonesia (kode dan identifier dalam bahasa Inggris)

## 1. Ringkasan

- Produk ini, dalam satu kalimat: Aplikasi web operasional terintegrasi untuk mengelola seluruh aktivitas bisnis klinik hewan dan pet shop dalam satu sistem terpusat, dengan satu perusahaan yang dapat memiliki banyak cabang.
- Masalah yang diselesaikan: Operasional klinik hewan dan pet shop biasanya terpecah (pendaftaran, rekam medis, rawat inap, stok, kasir, dan laporan berjalan terpisah), sehingga data tidak sinkron, stok dan tagihan sulit ditelusuri, dan pemilik hewan tidak punya akses ke informasi hewannya.
- Cara mengatasinya sekarang : catatan manual, spreadsheet, dan aplikasi kasir terpisah. Kekurangannya: data ganda, riwayat medis tersebar, stok tidak akurat antar cabang, dan pemilik harus bertanya langsung ke klinik untuk tahu kondisi hewannya.
- Mengapa dibuat sekarang: Sistem harus siap untuk banyak cabang sejak awal implementasi, bukan ditambal belakangan.

## 2. Pengguna dan peran

Dua area aplikasi: **Operational Application** (Owner, Supervisor, Dokter, Staff) dan **Pet Owner Portal** (pemilik hewan). Setiap pengguna mendapat dashboard, menu, akses data, dan kewenangan sesuai role dan permission.

| Peran | Siapa mereka | Tujuan utama | Perangkat | Kemahiran teknologi | Boleh melakukan apa |
|---|---|---|---|---|---|
| Owner | Pemilik perusahaan | Memantau dan mengendalikan seluruh cabang | Desktop dan HP | Sedang | Semua cabang, semua data, pengaturan organisasi, pajak, role, permission, laporan konsolidasi |
| Supervisor | Penanggung jawab cabang **[ASUMSI]** | Mengendalikan operasional cabang | Desktop | Sedang | Data cabang yang ditugaskan, persetujuan khusus (void, koreksi stok, selisih transfer, diskon di atas batas), laporan cabang |
| Dokter | Dokter hewan | Memeriksa, mendiagnosis, merawat, dan mencatat | Desktop dan tablet | Sedang | Membuat dan mengisi rekam medis, resep, tindakan, catatan rawat inap; membagikan informasi ke portal |
| Staff | Resepsionis, kasir, perawat, petugas gudang (**Dikonfirmasi: satu role**) | Menjalankan tugas harian | Desktop dan tablet | Rendah-sedang | Sesuai permission yang diberikan per pengguna |
| Pemilik hewan | Pelanggan klinik | Melihat informasi hewan peliharaannya | HP (utama) | Rendah | Hanya membaca data hewan miliknya yang diizinkan |

- **Staff adalah satu role.** Fungsinya (resepsionis, kasir, perawat, gudang) dibedakan oleh permission, bukan oleh role terpisah. Tersedia templat permission bawaan (Resepsionis, Kasir, Perawat, Gudang) untuk mempercepat pemberian, dan Owner bisa mengubahnya per pengguna.
- Role dan permission dapat dikonfigurasi, bukan hardcode.
- Satu pengguna operasional ditugaskan ke satu atau lebih cabang.

## 3. Fitur inti

| Fitur | Deskripsi singkat | Prioritas | Kriteria selesai yang bisa dicek |
|---|---|---|---|
| Organisasi dan cabang | Satu perusahaan, banyak cabang tanpa batas jumlah; tiap cabang punya nama, alamat, dan **zona waktu sesuai lokasinya**; pengguna, role, permission, penugasan cabang | Wajib v1 | Owner menambah cabang baru lewat pengaturan tanpa mengubah kode; staf cabang A tidak bisa melihat data operasional cabang B |
| Autentikasi dan akses | Login, role, permission, dashboard dan menu sesuai role | Wajib v1 | Menu dan data berubah sesuai role; akses tanpa izin ditolak di level database, bukan hanya disembunyikan di UI |
| Pelanggan | Data pemilik hewan, kontak, riwayat; terpusat lintas cabang | Wajib v1 | Pelanggan didaftarkan sekali, dicari dari cabang mana pun, dan riwayat kunjungannya terlihat |
| Pasien hewan | Profil hewan (jenis, ras, kelamin, tanggal lahir, berat, ciri), terhubung ke pemilik | Wajib v1 | Satu pemilik punya banyak hewan; profil dan riwayat hewan lengkap |
| Pelayanan klinik | Pendaftaran kunjungan, antrean, pemeriksaan, tindakan, resep | Wajib v1 | Kunjungan berjalan dari terdaftar sampai selesai dan menghasilkan tagihan otomatis |
| Rekam medis | Anamnesis, pemeriksaan fisik, diagnosis, tindakan, resep, lampiran; **riwayat dapat dipakai lintas cabang** | Wajib v1 | Hewan yang pernah diperiksa di cabang A, ketika berkunjung ke cabang B, riwayat medisnya terlihat lengkap oleh Dokter cabang B; hanya Dokter yang menulis; entri terkunci setelah final; koreksi lewat addendum dengan jejak audit; tiap entri mencatat cabang asalnya |
| Vaksinasi | Catatan vaksin dan jadwal ulang (booster) | Wajib v1 | Vaksin tercatat per hewan; hewan yang jatuh tempo muncul di daftar pengingat |
| Rawat inap | Check-in, kandang/ruang, catatan perkembangan harian, pemberian obat, check-out; biaya kandang **per 24 jam sejak check-in** | Wajib v1 | Catatan harian bisa dibuat; biaya kandang dihitung otomatis sesuai BR-012 dan masuk tagihan; pemilik melihat perkembangannya di portal |
| Pet shop | Katalog produk, penjualan retail | Wajib v1 | Produk dijual di kasir dan stok cabang berkurang |
| Inventori | Stok per cabang, batch, kedaluwarsa, penyesuaian stok | Wajib v1 | Stok tidak pernah minus; setiap mutasi stok punya jejak lengkap |
| **Transfer stok antar cabang** | Pengiriman stok dari satu cabang ke cabang lain dengan penerimaan terkonfirmasi | Wajib v1 | Transfer berjalan draft → dikirim → diterima; stok asal berkurang saat dikirim dan stok tujuan bertambah saat diterima; barang dalam perjalanan tercatat; selisih penerimaan tidak hilang diam-diam |
| Pengadaan | Pemasok, pesanan pembelian, penerimaan barang | Wajib v1 | Penerimaan barang menambah stok dan mencatat harga beli |
| Kasir dan transaksi | Tagihan terpadu (jasa, tindakan, obat, produk, kandang), diskon, **PPN**, **pembulatan**, void | Wajib v1 | Satu tagihan menampung semua item; diskon, PPN, dan pembulatan dihitung sesuai BR-020 dan BR-021 dan tampil sebagai baris terpisah; tagihan bisa dicetak |
| Pembayaran | **Dicatat manual oleh kasir**: tunai, transfer, QRIS, kartu; penuh atau sebagian | Wajib v1 | Kasir mencatat metode, jumlah, dan referensi; tunai mencatat uang diterima dan kembalian; status tagihan benar (belum lunas, sebagian, lunas); tidak bisa tercatat ganda; tidak ada integrasi payment gateway |
| Laporan operasional | Penjualan, kunjungan, stok, pembayaran per metode, pajak, pembulatan; per cabang dan konsolidasi | Wajib v1 | Angka laporan sama dengan jumlah transaksi sumbernya; batas hari mengikuti zona waktu tiap cabang |
| Pet Owner Portal | **Hanya untuk melihat**: profil hewan, riwayat pemeriksaan, rekam medis yang diizinkan, vaksinasi, tagihan, perkembangan rawat inap | Wajib v1 | Pemilik login dan hanya melihat hewannya sendiri dan data yang dibagikan; tagihan tampil dengan rincian dan status tanpa tombol bayar; tidak ada aksi ubah data selain pengaturan akunnya sendiri |
| Pembayaran online di portal | Pemilik membayar tagihan lewat portal | Nanti | |
| Booking janji temu online | Pemilik memesan jadwal dari portal | Nanti | |
| Notifikasi WhatsApp/email | Pengingat vaksin, tagihan, kabar rawat inap | Nanti | |

## 4. Alur utama

- **Kunjungan klinik:**
  1. Staff mendaftarkan kunjungan (pelanggan dan hewan sudah ada, termasuk dari cabang lain, atau didaftarkan baru).
  2. Hewan masuk antrean; Dokter memanggil dan memeriksa, dengan riwayat medis lintas cabang terlihat.
  3. Dokter mencatat rekam medis: anamnesis, diagnosis, tindakan, resep, vaksin bila ada.
  4. Tindakan dan obat otomatis masuk ke tagihan; stok obat berkurang saat tagihan difinalkan.
  5. Tagihan dihitung: subtotal, diskon, PPN (bila aktif), pembulatan (bila aktif).
  6. Kasir mencatat pembayaran manual (penuh atau sebagian) dan mencetak bukti.
  7. Hasil yang dibagikan Dokter dan tagihan muncul di portal pemilik hewan (hanya lihat).
- **Rawat inap:**
  1. Dokter memutuskan rawat inap; Staff melakukan check-in (waktu check-in tercatat) dan menempatkan hewan di kandang.
  2. Perawat dan Dokter mencatat perkembangan harian (kondisi, pemberian obat, makan, minum).
  3. Biaya kandang dihitung per 24 jam sejak check-in; biaya, tindakan, dan obat terakumulasi di satu tagihan; deposit bisa diterima di awal.
  4. Check-out (pulang, rujuk, atau meninggal), tagihan dilunasi, ringkasan perawatan tersedia di portal.
- **Pet shop:** Kasir memilih produk, menambah ke keranjang, menerima pembayaran manual, stok cabang berkurang.
- **Pengadaan:** Staff gudang membuat pesanan pembelian, barang diterima, stok bertambah, harga beli tercatat.
- **Transfer stok antar cabang:**
  1. Staff gudang cabang asal membuat transfer (barang, batch, jumlah, cabang tujuan).
  2. Transfer dikirim: stok cabang asal berkurang, status "dalam perjalanan".
  3. Cabang tujuan menerima dan mengonfirmasi jumlah; stok tujuan bertambah dengan batch dan tanggal kedaluwarsa yang sama.
  4. Bila jumlah diterima berbeda dari yang dikirim, selisih dicatat dengan alasan dan ditinjau Supervisor.
- **Alur alternatif:** kunjungan dibatalkan sebelum dilayani; tagihan di-void dengan alasan dan persetujuan Supervisor; pembayaran sebagian dilunasi di hari berikutnya; pesanan pembelian diterima sebagian; transfer dibatalkan sebelum dikirim; hewan dipindahkan antar kandang.
- **Saat gagal:** pembayaran ganda dicegah (satu aksi bayar tidak boleh tercatat dua kali meski ditekan berulang); stok tidak cukup menolak penjualan dengan pesan jelas; koneksi putus tidak membuat transaksi setengah tersimpan.

## 5. Aturan bisnis

| ID | Aturan | Kondisi | Hasil | Pengecualian |
|---|---|---|---|---|
| BR-001 | Isolasi cabang | Pengguna mengakses data operasional (stok, transaksi, pembayaran, rawat inap) | Hanya data cabang yang ditugaskan kepadanya | Owner melihat semua cabang; data pelanggan, hewan, dan rekam medis mengikuti BR-003 |
| BR-002 | Akses berbasis role dan permission | Pengguna melakukan aksi | Diizinkan hanya jika permission-nya ada; ditegakkan di database | — |
| BR-003 | Pelanggan, hewan, dan riwayat medis terpusat lintas cabang | Hewan dilayani di cabang mana pun | Pengguna dengan permission medis membaca riwayat medis lengkap dari semua cabang; setiap entri mencatat cabang asalnya | Penulisan rekam medis hanya di cabang tempat pelayanan terjadi; stok dan keuangan tetap per cabang |
| BR-004 | Rekam medis hanya ditulis Dokter | Entri dibuat atau diubah | Hanya Dokter; entri final terkunci | Koreksi lewat addendum bertanda waktu dan penulis, bukan menimpa |
| BR-005 | Visibilitas ke portal | Entri medis ingin dilihat pemilik | Tampil hanya jika ditandai "dibagikan" oleh Dokter | Vaksinasi dan tagihan pemilik tampil otomatis |
| BR-006 | Stok per cabang tidak boleh minus | Penjualan, pemakaian obat, atau pengiriman transfer | Ditolak bila stok tidak cukup; pengurangan atomik | Penyesuaian stok oleh Supervisor dengan alasan |
| BR-007 | Pengurangan stok memakai batch yang paling cepat kedaluwarsa (FEFO) | Barang berbatch | Batch terdekat kedaluwarsa dipakai lebih dulu | Barang tanpa kedaluwarsa |
| BR-008 | Uang disimpan sebagai bilangan bulat Rupiah | Semua perhitungan | Tanpa float; semua pembulatan eksplisit dan tercatat | — |
| BR-009 | Tagihan terpadu | Kunjungan atau rawat inap | Satu tagihan menampung jasa, tindakan, obat, produk, kandang | Penjualan retail murni (tanpa pasien) |
| BR-010 | Pembayaran boleh sebagian | Pelanggan membayar kurang dari total | Status "sebagian"; sisa tercatat; lunas bila total terbayar | — |
| BR-011 | Transaksi final tidak dihapus | Ada kesalahan transaksi atau pembayaran | Dibatalkan lewat void atau retur dengan alasan | Void di atas batas butuh persetujuan Supervisor |
| BR-012 | Biaya kandang per 24 jam sejak check-in | Hewan dirawat inap | Jumlah hari = durasi sejak waktu check-in dibagi 24 jam, dibulatkan ke atas, minimal 1 hari; biaya = tarif harian kandang × jumlah hari | Contoh: check-in 10 Nov 14:00, check-out 12 Nov 15:00 = 49 jam = 3 hari | Dikonfirmasi (pembulatan ke atas untuk sisa kurang dari 24 jam:) |
| BR-013 | Jadwal vaksin ulang | Vaksin tercatat | Tanggal jatuh tempo dihitung dari jenis vaksin | Interval bisa diubah Dokter per kasus |
| BR-014 | Jejak audit | Perubahan pada rekam medis, transaksi, pembayaran, stok, pajak, role dan permission | Dicatat siapa, kapan, apa yang berubah | — |
| BR-015 | Akun portal terikat ke kepemilikan | Pemilik membuat akun | Ditautkan ke data pelanggan oleh klinik (undangan/verifikasi); hanya melihat hewan miliknya | Pemilik bersama (beberapa akun per hewan): Nanti |
| BR-016 | Zona waktu mengikuti lokasi cabang | Semua waktu | Tiap cabang punya zona waktu (WIB, WITA, atau WIT); waktu disimpan UTC dan ditampilkan sesuai zona cabang; batas "hari" di laporan mengikuti zona cabang; laporan konsolidasi menjumlahkan per hari lokal tiap cabang | — |
| BR-017 | Transfer stok antar cabang | Stok dipindah dari cabang asal ke tujuan | Status draft → dikirim → diterima, atau dibatalkan (hanya sebelum dikirim); stok asal berkurang saat dikirim, stok tujuan bertambah saat diterima; batch dan kedaluwarsa terbawa; barang dalam perjalanan tercatat; selisih penerimaan dicatat dengan alasan dan ditinjau Supervisor | — |
| BR-018 | Pembayaran dicatat manual oleh kasir | Pelanggan membayar | Kasir mencatat metode (tunai, transfer, QRIS, kartu), jumlah, waktu, dan referensi (opsional); tunai mencatat uang diterima dan kembalian; tidak ada integrasi payment gateway; pembayaran yang sudah tercatat tidak diubah, hanya dibatalkan lewat BR-011 | Total pembayaran non-tunai tidak boleh melebihi sisa tagihan |
| BR-019 | Portal hanya untuk melihat | Pemilik mengakses portal | Hanya membaca data hewan miliknya yang diizinkan; tagihan tampil (rincian, status, sisa) tanpa pembayaran online | Pemilik boleh mengatur akunnya sendiri (kata sandi) | Dikonfirmasi |
| BR-020 | PPN dapat dikonfigurasi | Tagihan dibuat | Pengaturan di level perusahaan: PPN aktif atau tidak, tarif, dan apakah harga katalog sudah termasuk pajak; tiap produk dan layanan ditandai kena atau tidak kena pajak; perhitungan: subtotal item → dikurangi diskon → dasar pajak → PPN; tagihan menyimpan salinan tarif dan nilai pajak saat dibuat sehingga perubahan tarif tidak mengubah tagihan lama; tarif tercatat dengan tanggal berlaku | Tidak ada tarif atau status PKP bawaan: default PPN nonaktif sampai Owner mengisinya |
| BR-021 | Pembulatan tagihan dapat dikonfigurasi | Total tagihan dihitung | Pengaturan di level perusahaan: tanpa pembulatan atau ke kelipatan Rp100, Rp500, atau Rp1.000 terdekat; dihitung pada total akhir setelah PPN; tampil sebagai baris "Pembulatan" terpisah (bisa positif atau negatif) dan tercatat di laporan; tidak mengubah nilai PPN | Default: tanpa pembulatan |

- **Contoh perhitungan** (angka dan tarif PPN 10% hanya ilustrasi, bukan tarif yang berlaku; semua item dianggap kena pajak, harga belum termasuk pajak, pembulatan ke Rp500 terdekat): konsultasi Rp75.000 + vaksin Rp150.000 + obat 2 × Rp22.350 (Rp44.700) = subtotal Rp269.700 → PPN 10% Rp26.970 → Rp296.670 → pembulatan −Rp170 → **total tagihan Rp296.500**. Pelanggan membayar DP Rp100.000 tunai → status "sebagian", sisa Rp196.500. Hari berikutnya melunasi Rp196.500 → "lunas".
- **Status yang ada dan perpindahan yang boleh:**
  - Kunjungan: terdaftar → menunggu → diperiksa → selesai; atau dibatalkan (hanya sebelum diperiksa).
  - Rawat inap: dirawat → pulang / dirujuk / meninggal.
  - Tagihan: draft → belum lunas → sebagian → lunas; atau void (dengan persetujuan).
  - Pesanan pembelian: draft → dipesan → diterima sebagian → diterima; atau dibatalkan.
  - Transfer stok: draft → dikirim → diterima; atau dibatalkan (hanya sebelum dikirim).
- **Kesalahan yang pernah terjadi di bisnis ini:** belum diketahui. Kasus uji wajib dari risiko umum: stok minus karena dua kasir menjual barang terakhir bersamaan; tagihan terbayar ganda karena tombol ditekan berulang; Dokter mengubah catatan Dokter lain; data operasional cabang A bocor ke staf cabang B; pemilik hewan melihat hewan milik orang lain; transfer stok yang diterima dua kali; stok hilang saat transfer terputus di tengah proses; tarif PPN berubah dan tagihan lama ikut berubah; pembulatan yang membuat total pembayaran dan tagihan tidak cocok; hari laporan bergeser untuk cabang di zona WITA/WIT.

## 6. Data

- Objek utama: perusahaan, pengaturan pajak dan pembulatan, cabang (dengan zona waktu), pengguna, role, permission, pelanggan, hewan, kunjungan, rekam medis, vaksinasi, rawat inap, kandang, produk, layanan, batch stok, mutasi stok, transfer stok, pemasok, pesanan pembelian, tagihan, baris tagihan, pembayaran, akun portal, jejak audit.
- Data sensitif: data pribadi pemilik (nama, telepon, email, alamat), rekam medis hewan, data keuangan, kredensial. Perlakukan sebagai data pribadi (UU Pelindungan Data Pribadi): akses dibatasi, tidak ada data pribadi di log, jejak audit untuk akses dan perubahan.
- Jumlah cabang: **tidak dibatasi**, ditambah lewat pengaturan. Target uji beban : 10 cabang, puluhan pengguna operasional per cabang, ribuan pemilik dan hewan, ratusan transaksi per hari secara total.
- Retensi: rekam medis, transaksi, pembayaran, dan jejak audit tidak dihapus permanen; data yang "dihapus" memakai penghapusan lunak.
- Data awal : belum ada. Agent menyiapkan data contoh yang realistis (hewan, pemilik, produk klinik, obat, beberapa cabang di zona waktu berbeda) untuk pengembangan, serta jalur impor dari CSV.

## 7. Integrasi dan sistem luar

| Layanan | Untuk apa | Status |
|---|---|---|
| Supabase | Backend penuh: database, autentikasi, penyimpanan berkas, realtime, fungsi server | Belum ada akun, perlu dibuatkan |
| Vercel atau Cloudflare | Hosting aplikasi web | Belum ada akun, perlu dibuatkan |
| Payment gateway | Pembayaran online | **Tidak ada** : pembayaran dicatat manual oleh kasir |
| WhatsApp/email | Notifikasi ke pemilik | Tidak di v1 |

## 8. Batasan

- Anggaran dan biaya bulanan : harus muat di tier gratis atau terendah Supabase dan hosting selama pengembangan dan tahap awal.
- Hosting: Vercel atau Cloudflare untuk aplikasi, Supabase untuk seluruh backend.
- Regulasi: pelindungan data pribadi pemilik hewan; catatan keuangan dan pajak harus bisa diaudit. Perlakuan pajak tiap layanan dan produk ditentukan Owner bersama konsultan pajaknya, bukan diasumsikan sistem.
- Perangkat: browser modern di desktop dan tablet untuk aplikasi operasional; **portal pemilik mengutamakan HP**. Semua layar responsif.
- Ketersediaan dan performa: kasir dan pendaftaran harus terasa instan; halaman utama termuat cepat di jaringan seluler biasa.
- Keamanan (wajib, tidak bisa ditawar): isolasi cabang dan hak akses ditegakkan di database dengan Row Level Security, bukan hanya disembunyikan di antarmuka. Akses lintas cabang untuk riwayat medis (BR-003) juga diatur oleh RLS dan permission, bukan terbuka untuk semua. Aksi sensitif (void, koreksi stok, perubahan role, perubahan pengaturan pajak) berjalan di sisi server dengan jejak audit.
- Aksesibilitas: navigasi keyboard, kontras memadai, label formulir, dukungan teks besar.

## 9. Tampilan dan nada

- Arah desain: **konsep UI/UX bergaya Apple**, merujuk pada prinsip Apple Human Interface Guidelines: kejelasan, hierarki yang tegas, ruang kosong yang lega, fokus pada konten, dan kontrol yang terasa alami.
- Penerapannya:
  - Tipografi memakai font sistem (`-apple-system`, `SF Pro` bila tersedia, fallback `system-ui`), judul besar, skala ukuran yang konsisten.
  - Sidebar navigasi di desktop, tab bar atau navigasi bawah di HP untuk portal.
  - Permukaan bersih dengan sudut membulat kontinu, bayangan halus, efek kaca/blur dipakai hemat (misalnya bilah atas dan sheet).
  - Warna semantik (status sukses, peringatan, bahaya), satu warna aksen utama, mode terang dan gelap.
  - Komponen khas: sheet/modal dari bawah, segmented control, daftar bergrup, toggle, pencarian di atas.
  - Animasi halus dan bermakna, menghormati `prefers-reduced-motion`. Target sentuh minimal 44 px.
- Batas peniruan: meniru gaya dan prinsipnya, **bukan** aset atau merek Apple (tanpa logo Apple, SF Symbols, atau font berlisensi yang tidak boleh didistribusikan). Gunakan set ikon open-source bergaya garis tipis yang serasi.
- Warna dan merek PETORA : belum ada. Agent menetapkan identitas visual yang spesifik untuk produk hewan dan klinik (hangat, tepercaya, bersih), dicatat di `PRODUK.md`.
- Yang dihindari: tampilan dashboard template generik, gradien ungu-biru default, ikon emoji sebagai dekorasi, kartu seragam tanpa hierarki, teks isian klise.
- Karakter: tenang, profesional, ramah; ringkas dan jelas karena dipakai di tengah kesibukan klinik.
- Gaya bahasa antarmuka: Bahasa Indonesia sehari-hari yang sopan dan singkat; istilah klinik hewan yang lazim (anamnesis, diagnosis, rawat inap). Portal pemilik memakai bahasa yang mudah dipahami awam, bukan istilah medis mentah.

## 10. Di luar cakupan

- Banyak perusahaan (multi-tenant antar perusahaan); sistem ini sengaja **satu perusahaan, banyak cabang**.
- Aplikasi mobile native (cukup web responsif).
- Payment gateway, pembayaran online, dan verifikasi otomatis pembayaran transfer/QRIS/kartu (kasir memverifikasi sendiri).
- Pemilik mengubah data apa pun di portal (portal hanya baca, kecuali pengaturan akunnya sendiri).
- Booking janji temu online oleh pemilik.
- Notifikasi WhatsApp, SMS, dan email otomatis.
- Integrasi alat laboratorium atau radiologi.
- Akuntansi penuh, e-Faktur, dan pelaporan pajak. Sistem hanya menghitung dan menampilkan PPN di tagihan serta menyediakan laporan pajak operasional.
- Grooming, penitipan, atau layanan lain di luar klinik dan pet shop.
- Toko online (e-commerce) untuk publik.

## 11. Tanda berhasil v1

v1 dianggap selesai jika:
- Satu perusahaan dengan minimal tiga cabang, termasuk satu di zona waktu berbeda (WITA atau WIT), berjalan; cabang baru bisa ditambah lewat pengaturan tanpa mengubah kode.
- Pengguna cabang A terbukti tidak bisa melihat atau mengubah data operasional cabang B (diuji otomatis di level database).
- Riwayat medis hewan dari cabang A terbaca oleh Dokter cabang B yang berizin, tetapi tidak oleh pengguna tanpa permission medis.
- Alur kunjungan klinik berjalan penuh: daftar → periksa → rekam medis → tagihan (diskon, PPN, pembulatan) → pembayaran manual → hasil tampil di portal.
- Alur rawat inap berjalan penuh, dan biaya kandang per 24 jam sejak check-in dihitung benar (termasuk kasus 49 jam = 3 hari).
- Penjualan pet shop, inventori, dan pengadaan berjalan dengan stok akurat dan tidak pernah minus, termasuk saat dua transaksi bersamaan.
- Transfer stok antar cabang berjalan penuh (kirim, terima, selisih, batal), dan stok total lintas cabang selalu konsisten.
- Pembayaran tunai, transfer, QRIS, dan kartu bisa dicatat; pembayaran sebagian dan pelunasan benar; pembayaran ganda tercegah.
- PPN dan pembulatan dikonfigurasi dari pengaturan; perubahan tarif tidak mengubah tagihan lama; contoh perhitungan di bagian 5 menghasilkan angka yang sama persis.
- Pemilik hewan bisa login ke portal dan hanya melihat hewan serta data yang dibagikan kepadanya, termasuk tagihan, tanpa opsi bayar.
- Laporan operasional cocok dengan data transaksi sumbernya, termasuk batas hari per zona waktu cabang.
- Seluruh aturan BR-001 sampai BR-021 punya tes otomatis.
- Aplikasi ter-deploy ke Vercel/Cloudflare dengan Supabase, dan README bisa diikuti dari nol.
- Tidak ada masalah kritis atau tinggi yang terbuka (sesuai `AGENTS.md`).

## 12. Preferensi teknis

- Deployment akhir: **Cloudflare atau Vercel** untuk aplikasi + **Supabase sebagai full backend** (Postgres, Auth, Row Level Security, Storage, Realtime, Edge Functions bila diperlukan).
- Agent memilih framework web dan bahasa yang paling sederhana dan sesuai, serta memilih antara Vercel dan Cloudflare berdasarkan kecocokan dengan framework; alasannya dicatat di `docs/KEPUTUSAN.md`.
- Seluruh logika yang menentukan keamanan dan integritas data (hak akses, isolasi cabang, stok, transfer, status tagihan, perhitungan pajak dan pembulatan) berada di database atau fungsi server, bukan hanya di klien.
- Migrasi database tersimpan di repo dan bisa diulang.
- Tidak ada layanan tambahan di luar Supabase dan hosting tanpa alasan terukur.



