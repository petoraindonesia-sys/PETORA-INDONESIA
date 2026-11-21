# AGENTS.md — Frontend PETORA

Instruksi ini berlaku untuk seluruh file di bawah `apps/web/`. Instruksi ini melengkapi `/AGENTS.md`; tidak menggantikan keputusan Owner atau kontrak root. Jika ada konflik, ikuti prioritas sumber kebenaran pada AGENTS.md root dan hentikan pekerjaan yang membutuhkan asumsi.

## 1. Tanggung jawab area

- Area ini bertanggung jawab atas antarmuka web PETORA, termasuk dashboard staf dan portal pemilik hewan.
- Frontend berjalan dan di-deploy melalui Vercel.
- Backend, database, autentikasi, dan layanan data utama menggunakan Supabase sesuai kontrak root.
- Jangan mengasumsikan struktur folder, routing, package manager, versi Next.js, atau library tersedia sebelum memeriksa repository dan konfigurasi aktual.

## 2. Apple Design adalah standar UI wajib

- Terapkan kontrak Apple Design pada AGENTS.md root dan gunakan design tokens terpusat.
- Pertahankan light appearance, permukaan putih, latar abu-abu sangat terang, teks utama hampir hitam, teks sekunder yang terbaca, dan aksen Apple Blue (#007AFF).
- Gunakan system font stack; jangan mengunduh atau mendistribusikan font proprietary Apple.
- Terapkan spacing, radius, border, elevation, ukuran kontrol, dan focus state secara konsisten.
- Hindari gradien dekoratif, glassmorphism, shadow berat, animasi berlebihan, dan komponen yang sekadar meniru tampilan tanpa fungsi.
- Dashboard desktop dapat menggunakan sidebar ringkas, header kontekstual, pemilih cabang, dan konten terstruktur. Pada tablet/mobile, ubah pola navigasi dan tata letak secara sengaja.
- Tabel, filter, form, dialog, menu, toast, dan navigasi harus mendukung kebutuhan kerja operasional yang cepat.
- Warna status tidak boleh menjadi satu-satunya pembeda; sertakan teks atau ikon yang bermakna.
- Jangan memperkenalkan tema visual atau design system kedua tanpa persetujuan Owner.

## 3. Design system dan komponen

- Periksa design tokens dan komponen yang sudah ada sebelum membuat yang baru.
- Tempatkan tokens dan primitive UI pada lokasi yang konsisten dengan struktur aktual proyek; jangan mengarang konvensi folder.
- Gunakan semantic tokens, bukan menyebarkan nilai warna, spacing, radius, dan shadow secara acak di halaman.
- Komponen reusable harus menerima props bertipe, memiliki API yang jelas, dan tidak mengandung aturan bisnis yang seharusnya berada di server.
- Definisikan state yang relevan: default, hover, focus-visible, active, disabled, loading, empty, success, dan error.
- Hindari duplikasi komponen dan abstraksi berlebihan. Buat abstraksi saat pola penggunaan berulang dan kontraknya jelas.
- Ikon harus berasal dari satu pendekatan konsisten yang telah disetujui/tersedia di repository.

## 4. Next.js dan TypeScript

- Ikuti versi dan konvensi Next.js yang benar-benar dipasang; jangan menulis API berdasarkan versi yang diasumsikan.
- Gunakan TypeScript strict sesuai konfigurasi proyek. Hindari `any`; jika benar-benar diperlukan, beri alasan dan batasi area penggunaannya.
- Pilih Server Components secara default bila sesuai; gunakan Client Components hanya untuk interaksi/state browser yang memang memerlukannya.
- Jangan menambahkan `use client` ke layout atau subtree luas tanpa kebutuhan.
- Hindari fetch berulang, waterfall yang tidak perlu, dan state duplikat antara server dan client.
- Gunakan route handler/server action hanya sesuai pola proyek dan lakukan otorisasi server-side untuk setiap operasi sensitif.
- Tangani loading, error, not-found, dan error boundary pada segmen yang relevan. Jangan mengganti error dengan data contoh.
- Validasi parameter route, query string, dan input form; jangan mempercayai data dari browser.

## 5. Keamanan frontend dan sesi

- Semua nilai `NEXT_PUBLIC_*` dapat terekspos ke browser. Jangan pernah menaruh secret, service-role key, private key, atau credential di sana.
- Jangan menyimpan token sesi atau credential di localStorage/sessionStorage.
- Gunakan integrasi Supabase Auth/session yang sesuai dengan versi library dan dokumentasi yang dipakai proyek.
- Periksa sesi dan otorisasi pada server untuk setiap operasi yang dilindungi. Middleware, layout guard, menu tersembunyi, dan disabled button bukan pengganti otorisasi server/database.
- Jangan menerima role, permission, user ID, atau daftar cabang dari client sebagai data tepercaya.
- Pastikan pergantian cabang hanya memilih cabang yang memang diizinkan oleh sesi dan assignment otoritatif.
- Jangan membocorkan detail internal, stack trace, token, atau informasi sensitif pada pesan error UI maupun log browser.
- Jangan memasukkan data pelanggan/pasien nyata ke fixture, screenshot, test snapshot, atau seed tanpa kebutuhan dan perlindungan yang disetujui.

## 6. Konteks cabang dan alur operasional

- Tampilkan konteks cabang aktif dengan jelas pada halaman operasional yang relevan.
- Jangan menganggap branch ID pada URL, form, atau request sebagai bukti akses.
- Jangan menyimpan state cabang yang dapat memperluas hak akses; server/database harus memvalidasi branch scope.
- Saat cabang berubah, reset atau muat ulang data yang bergantung pada cabang agar data cabang sebelumnya tidak tercampur.
- Tindakan transaksi tidak boleh menampilkan sukses sebelum server mengonfirmasi hasil persisten.
- Cegah submit ganda untuk mutasi/transaksi dengan mekanisme yang sesuai; jangan hanya mengandalkan tombol disabled.
- Pertahankan aturan bisnis Owner; jangan menghitung ulang pajak, diskon, retur, stok, shift, atau persetujuan dengan aturan frontend yang berbeda dari backend.

## 7. Form dan feedback

- Setiap input memiliki label yang terlihat, instruksi/helper text bila perlu, dan pesan validasi yang terhubung secara aksesibel.
- Validasi client membantu pengalaman pengguna, tetapi validasi server/database tetap menjadi sumber keputusan.
- Pesan error harus menjelaskan tindakan berikutnya tanpa membocorkan informasi sensitif.
- Pertahankan input pengguna saat kegagalan jika aman dan relevan.
- Gunakan konfirmasi untuk tindakan destruktif atau berdampak finansial sesuai risiko.
- Jangan menggunakan alert browser sebagai pola umum untuk feedback aplikasi.
- Pastikan empty state menjelaskan kondisi dan tindakan yang benar-benar tersedia; jangan menampilkan CTA palsu.

## 8. Aksesibilitas dan responsive

- Gunakan semantic HTML dan heading hierarchy yang benar.
- Semua fungsi harus dapat dioperasikan dengan keyboard; focus-visible harus jelas dan tidak terpotong.
- Gunakan label accessible untuk kontrol, dialog, tabel, dan ikon-only action.
- Jaga kontras teks dan komponen sesuai standar WCAG yang relevan.
- Hormati `prefers-reduced-motion`; jangan menyampaikan informasi hanya melalui animasi.
- Periksa layout pada lebar mobile, tablet, dan desktop. Pastikan tabel operasional memiliki strategi mobile yang dapat digunakan, bukan sekadar overflow yang tidak terkendali.
- Target sentuh harus memadai dan kontrol penting tidak boleh terlalu rapat.

## 9. Data fetching dan performa

- Ambil data melalui jalur yang telah ditetapkan dan tetap tunduk pada Supabase RLS serta otorisasi server.
- Jangan membuat query browser dengan privilege tinggi atau melewati RLS.
- Tentukan loading, error, empty, dan stale state dengan jelas.
- Hindari render ulang mahal, bundle besar, dependency berlebihan, dan pemuatan library berat pada halaman yang tidak membutuhkannya.
- Gunakan pagination/filter server-side untuk dataset operasional besar bila sesuai.
- Jangan meng-cache data personal atau data lintas cabang dengan key/cache scope yang tidak aman.

## 10. Pengujian frontend

- Temukan script yang tersedia pada package manifest dan workflow CI sebelum menjalankan test.
- Tambahkan test untuk perilaku pengguna dan aturan tampilan yang penting, bukan hanya snapshot yang rapuh.
- Uji akses tanpa sesi, sesi tidak valid, role tanpa izin, dan konteks cabang yang tidak diizinkan melalui jalur yang relevan.
- Uji form invalid/valid, submit gagal, loading, empty, success, error, dan pencegahan double submit.
- Uji navigasi keyboard, focus, label aksesibel, responsive behavior, dan reduced motion untuk komponen/halaman penting.
- Jalankan lint, typecheck, test, dan build yang tersedia serta catat hasil aktual di progres.md.
- Jika test tidak dapat dijalankan karena dependency atau environment belum tersedia, tandai sebagai BLOCKED; jangan mengarang hasil.

## 11. Larangan

- Tidak boleh ada halaman demo, mock data produksi, placeholder, tombol tanpa aksi, atau tautan navigasi kosong.
- Jangan menambahkan library UI atau chart sebelum memeriksa apakah kebutuhan sudah dipenuhi oleh komponen yang tersedia.
- Jangan mengubah keputusan bisnis atau alur otorisasi demi mempermudah UI.
- Jangan menyembunyikan kegagalan backend dengan optimistic success yang tidak direkonsiliasi.
- Jangan menandai UI selesai hanya karena tampil di browser; alur data dan otorisasinya harus diuji.
