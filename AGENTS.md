# AGENTS.md — Kontrak Pengembangan PETORA

Dokumen ini adalah instruksi utama untuk seluruh agen dan kontributor di repository.

## 1. Produk

PETORA adalah aplikasi operasional klinik hewan dan pet shop untuk satu perusahaan dengan banyak cabang, dilengkapi portal pemilik hewan. Sistem harus mendukung operasi lintas cabang dengan isolasi akses dan data yang benar.

## 2. Arsitektur yang ditetapkan

- Frontend dan deployment web: Vercel.
- Backend, database, autentikasi, dan layanan data: Supabase.
- Aplikasi web: Next.js, TypeScript, Tailwind CSS.
- UI resmi: Apple Design, dengan karakter klinis, bersih, ringan, presisi, dan konsisten.
- Gunakan sistem komponen dan design tokens terpusat.
- Jangan menambahkan layanan atau dependensi tanpa kebutuhan yang jelas.

## 3. Kontrak visual — Apple Design

Apple Design adalah arah visual produk PETORA, bukan kewajiban memakai produk atau framework milik Apple. Terapkan prinsip berikut secara konsisten pada dashboard operasional dan portal pemilik hewan.

### 3.1 Karakter visual
- Minimalis, rapi, tenang, profesional, dan berorientasi pada konten.
- Hierarki informasi jelas; hindari dekorasi, gradien, efek berlebihan, dan kepadatan visual yang tidak perlu.
- Gunakan ruang kosong secara terukur dan alignment yang konsisten.
- Prioritaskan keterbacaan dan kecepatan kerja staf klinik.

### 3.2 Warna dan permukaan
- Default light appearance.
- Latar aplikasi bernuansa abu-abu sangat terang; gunakan permukaan putih untuk konten dan kartu.
- Gunakan teks utama hampir hitam dan teks sekunder abu-abu yang tetap memenuhi kontras aksesibilitas.
- Apple Blue (#007AFF) menjadi aksen interaksi utama secara hemat.
- Warna semantik hijau, amber, dan merah hanya untuk status yang sesuai.
- Border tipis dan shadow lembut; hindari panel bertumpuk dan efek glassmorphism yang mengganggu.

### 3.3 Tipografi dan bentuk
- Gunakan system font stack yang terasa native pada masing-masing platform; jangan mengunduh font proprietary Apple.
- Terapkan skala tipografi konsisten dengan judul ringkas, label jelas, dan angka data yang mudah dipindai.
- Gunakan radius sudut moderat dan konsisten; hindari bentuk pill untuk semua elemen.
- Ikon harus konsisten, sederhana, dan selalu membantu pemahaman.

### 3.4 Komponen dan tata letak
- Bangun design tokens untuk warna, tipografi, spacing, radius, border, elevation, dan focus state.
- Komponen harus reusable dan memiliki state default, hover, focus, active, disabled, loading, empty, success, serta error sesuai konteks.
- Dashboard desktop dapat memakai sidebar navigasi yang ringkas, header kontekstual, pemilih cabang, dan area konten yang terstruktur.
- Tabel operasional harus mengutamakan pemindaian data, filter, sorting, pagination, dan aksi yang jelas.
- Form harus memiliki label, helper text, validasi inline, dan pesan kesalahan yang dapat ditindaklanjuti.
- Terapkan responsive layout untuk tablet dan ponsel; jangan sekadar mengecilkan tampilan desktop.

### 3.5 Interaksi dan aksesibilitas
- Transisi singkat dan halus; hormati prefers-reduced-motion.
- Semua fungsi harus dapat digunakan dengan keyboard dan memiliki focus indicator yang terlihat.
- Gunakan target sentuh yang memadai, label aksesibel, kontras yang cukup, dan struktur heading yang benar.
- Jangan mengandalkan warna saja untuk menyampaikan status.
- Animasi tidak boleh menghambat alur kasir, pendaftaran, pemeriksaan, atau tindakan klinis.

### 3.6 Konsistensi produk
- Gunakan pola visual yang sama pada modul klinik, pet shop, inventaris, kasir, administrasi, dan portal pemilik hewan.
- Perbedaan peran dan konteks boleh mengubah navigasi atau informasi, bukan bahasa visual inti.
- Jangan membuat halaman baru dengan gaya visual berbeda tanpa persetujuan Owner.
- Apple Design harus diterapkan sebagai sistem UI yang fungsional, bukan sekadar mockup.

## 4. Aturan bisnis yang sudah disetujui

- Perusahaan tunggal, multi-cabang.
- Login staf menggunakan username dan PIN tepat 6 digit; jangan menambahkan MFA atau langkah login tambahan tanpa persetujuan Owner.
- RBAC bersifat default-deny dan seluruh akses data wajib menerapkan cakupan cabang.
- Pajak: konfigurasi eksklusif.
- Persetujuan retur: berdasarkan ambang batas Owner.
- Diskon: hanya Owner.
- Pembulatan transaksi: rupiah.
- Harga layanan: variabel.
- Metode pembayaran: multi-metode.
- Stok saat checkout: transaksi diblokir jika stok tidak mencukupi.
- Setiap kasir memiliki shift sendiri.
- QRIS dicatat manual; tidak ada integrasi penyedia pembayaran otomatis.
- Dokter dapat mengajukan perubahan jadwal praktik; perubahan berlaku setelah persetujuan Owner atau Supervisor.
- Jangan memasukkan WhatsApp Business API ke arsitektur atau rencana kecuali diminta kembali oleh Owner.

Keputusan yang belum ditetapkan harus tetap PENDING. Agen dilarang menetapkan aturan bisnis baru atas asumsi sendiri.

## 5. Prinsip implementasi

1. Implementasi harus nyata dan vertikal: UI, validasi, database, autentikasi/otorisasi, dan pengujian sesuai kebutuhan fitur.
2. Kode yang berhasil di-build tidak otomatis berarti fitur berfungsi.
3. Dilarang membuat mock, placeholder, stub, tombol tanpa aksi, data palsu untuk alur produksi, atau integrasi backend yang hanya tampak selesai.
4. Ikuti spesifikasi dan keputusan Owner. Pilih solusi paling sederhana yang memenuhi kebutuhan.
5. Jangan merusak fitur yang sudah berjalan.
6. Jangan mengklaim pekerjaan selesai atau terverifikasi tanpa bukti yang dapat diperiksa.
7. Jangan menyimpan secret, token, credential, atau data sensitif di repository, log, maupun dokumentasi.

## 6. Alur kerja wajib

Sebelum mengubah kode:
- Periksa struktur repository, branch aktif, perubahan yang ada, dan instruksi pada seluruh file AGENTS.md yang berlaku.
- Periksa progres.md.
- Tambahkan entri IN_PROGRESS yang memuat tujuan, scope, dan acceptance criteria.

Selama pengerjaan:
- Perbarui progres segera bila scope, risiko, atau blocker berubah.
- Jalankan pemeriksaan dan test yang relevan.
- Jangan menutupi kegagalan test atau mengubah test hanya untuk membuat CI hijau.

Sesudah pengerjaan:
- Perbarui entri progres pada branch/PR yang sama.
- Catat file yang berubah, perintah test, hasil aktual, dan status akhir.
- Sertakan Commit SHA, PR number, atau CI run sebagai bukti.
- Gunakan UNMERGED sampai perubahan benar-benar masuk ke main.
- Jangan menghapus atau menimpa riwayat progres; tambahkan catatan/koreksi baru.

## 7. Status progres

Gunakan hanya status berikut:
- NOT_STARTED
- IN_PROGRESS
- IMPLEMENTED
- VERIFIED — wajib disertai bukti test/CI yang berhasil.
- BLOCKED

Status IMPLEMENTED tidak berarti VERIFIED.

## 8. Kualitas dan keamanan

- Terapkan validasi input di batas sistem.
- Terapkan least privilege, RLS, RBAC, dan branch scoping secara konsisten.
- Jangan mengekspos service-role key atau secret ke browser.
- Hindari akses database yang melewati kebijakan otorisasi.
- Sertakan loading, empty, success, dan error state yang bermakna.
- Pastikan navigasi dan kontrol dapat digunakan dengan keyboard serta memiliki label aksesibilitas.
- Tambahkan test untuk aturan bisnis, otorisasi, isolasi cabang, dan alur kritis.

## 9. Dokumentasi

Dokumentasi harus ringkas, relevan, dan dipelihara bersama implementasi. AGENTS.md adalah kontrak kerja; progres.md adalah catatan historis pengerjaan. Spesifikasi dan keputusan Owner menjadi sumber kebenaran produk. Jika dokumen bertentangan, hentikan asumsi dan catat konflik untuk keputusan Owner.

## 10. Pelaporan

Setiap laporan harus sesuai dengan keadaan repository dan progres.md. Bedakan secara eksplisit antara sudah ditulis, sudah diimplementasikan, sudah diuji, sudah terverifikasi, sudah di-merge, dan sudah di-deploy.

Jangan menyatakan deployment, integrasi, atau pengujian telah berhasil tanpa bukti aktual.
