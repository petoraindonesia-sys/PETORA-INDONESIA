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


## 11. Prioritas sumber kebenaran

Jika instruksi atau dokumen berbeda, gunakan urutan berikut:
1. Instruksi Owner yang paling baru dan eksplisit.
2. Keputusan Owner yang sudah disetujui dan tercatat.
3. Spesifikasi produk/fitur yang disetujui.
4. AGENTS.md pada direktori yang berlaku.
5. Dokumentasi teknis dan pola kode repository.
6. Asumsi agen.

Asumsi agen tidak boleh mengubah aturan bisnis, hak akses, alur persetujuan, atau perilaku transaksi. Jika konflik pada tingkat 1–4 tidak dapat diselesaikan dengan jelas, hentikan bagian yang terdampak, catat sebagai BLOCKED/PENDING di progres.md, dan ajukan satu pertanyaan spesifik kepada Owner. Jangan menafsirkan diamnya Owner sebagai persetujuan.

Instruksi AGENTS.md yang lebih dekat dengan file berlaku sebagai tambahan untuk direktori tersebut. Instruksi turunan tidak boleh membatalkan kontrak root atau keputusan Owner. Sebelum membuat AGENTS.md turunan, pastikan ada kebutuhan nyata dan hindari duplikasi aturan.

## 12. Protokol inspeksi repository

Sebelum implementasi, agen wajib:
- Memastikan repository, branch, commit HEAD, dan status perubahan yang sedang berlangsung.
- Membaca AGENTS.md root dan seluruh AGENTS.md yang mencakup area kerja.
- Membaca progres.md serta spesifikasi dan keputusan terkait.
- Memeriksa struktur folder, package manager, scripts, dependensi, konfigurasi, migration, test, dan workflow CI yang benar-benar tersedia.
- Menelusuri implementasi yang sudah ada sebelum menambah atau mengganti pola.
- Mengidentifikasi dampak lintas modul, kompatibilitas, migrasi, keamanan, dan risiko regresi.

Jangan menganggap file, framework, script, environment variable, tabel, atau layanan tersedia sebelum memeriksanya. Jangan mengganti package manager atau merombak struktur proyek tanpa kebutuhan yang terbukti dan persetujuan bila berdampak arsitektural.

## 13. Strategi implementasi fitur

Setiap fitur harus memiliki alur yang lengkap sesuai kebutuhan:
1. Kontrak kebutuhan dan acceptance criteria.
2. UI/UX dan state interaksi.
3. Validasi input pada client untuk pengalaman pengguna dan pada server/database sebagai batas keamanan.
4. Operasi data melalui jalur backend yang diotorisasi.
5. Autentikasi, RBAC, dan branch scope.
6. Penanganan loading, empty, success, error, serta kegagalan jaringan.
7. Test unit, integrasi, database/security, dan end-to-end untuk risiko/alur kritis.
8. Dokumentasi dan catatan progres.

Jangan membuat UI yang menampilkan keberhasilan sebelum operasi persisten berhasil. Aksi mutasi harus memiliki hasil nyata, pencegahan submit ganda yang sesuai, dan umpan balik kegagalan. Operasi yang gagal tidak boleh meninggalkan state UI seolah-olah berhasil.

Sebelum memperluas scope, pastikan acceptance criteria tahap berjalan terpenuhi. Jangan menandai fitur VERIFIED hanya karena halaman tampil, typecheck/build lolos, atau test unit terisolasi berhasil.

## 14. Standar Supabase dan data

- Supabase adalah backend dan sumber data utama; jangan menambahkan backend server terpisah tanpa keputusan Owner.
- Semua perubahan skema harus melalui migration SQL yang tersimpan dan berurutan di repository. Jangan mengubah database produksi secara manual sebagai pengganti migration.
- Migration harus mempertimbangkan constraint, foreign key, index, default, nullability, uniqueness, dan strategi rollback/kompatibilitas yang relevan.
- Aktifkan RLS pada seluruh tabel yang dapat diakses melalui API/Data API. Setiap policy harus menerapkan prinsip default-deny dan diuji untuk akses yang diizinkan maupun ditolak.
- Jangan menganggap menyembunyikan tombol atau membatasi query di UI sebagai otorisasi.
- Branch scope harus ditegakkan pada setiap operasi baca dan tulis, termasuk relasi, fungsi database, RPC, Storage, dan Edge Functions jika digunakan.
- Gunakan privilege minimum. Bedakan akses anon, authenticated, dan service role. Service-role key hanya boleh berada pada lingkungan server tepercaya dan tidak boleh masuk ke bundle browser, log, screenshot, atau dokumentasi.
- Jangan membuat policy RLS permisif seperti akses penuh untuk semua pengguna demi mempermudah development.
- Operasi sensitif seperti perubahan role, persetujuan, retur, diskon, penyesuaian stok, dan transaksi wajib memvalidasi otorisasi di sisi tepercaya dan mencatat audit sesuai kebutuhan.
- Hindari mengambil data lintas cabang melalui join atau endpoint turunan ketika parent record sudah dibatasi. Uji juga IDOR dengan mengganti identifier milik cabang lain.
- Perubahan pada schema, policy, trigger, function, atau seed harus disertai test database yang relevan. Seed hanya untuk data referensi atau lingkungan non-produksi; jangan menyamarkan data palsu sebagai data operasional.
- Jangan menaruh kredensial Supabase dalam source code. Gunakan environment variable sesuai kebutuhan runtime dan dokumentasikan nama variabel tanpa nilainya.

## 15. Standar Vercel dan frontend

- Vercel menjadi platform deployment frontend. Jangan mengklaim deployment aktif sebelum ada deployment URL dan status aktual yang dapat diperiksa.
- Pisahkan environment development, preview, dan production. Jangan menyalin secret production ke file repository atau log.
- Environment variable yang berawalan `NEXT_PUBLIC_` dianggap dapat dibaca browser; hanya isi yang memang aman untuk publik yang boleh memakai prefix tersebut.
- Akses data dari browser harus menggunakan mekanisme Supabase yang sesuai dengan RLS dan sesi pengguna. Operasi privileged harus dijalankan pada server tepercaya, bukan browser.
- Jangan mengandalkan middleware atau guard UI sebagai satu-satunya lapisan keamanan.
- Hindari menyimpan token sesi di localStorage/sessionStorage. Ikuti mekanisme sesi yang aman dan dokumentasi resmi library yang benar-benar dipakai.
- Pastikan redirect setelah login, logout, expiry, refresh sesi, dan akses tanpa izin diuji.
- Halaman operasional harus mempertahankan konteks cabang yang aktif dan tidak boleh mengubah cakupan akses hanya dengan mengganti parameter URL.
- Gunakan server/client component sesuai kebutuhan; jangan menambahkan client-side state atau fetch berulang jika server rendering atau cache yang tepat lebih sederhana.
- Setiap halaman penting harus memiliki metadata yang sesuai, layout responsif, dan state aksesibilitas yang benar.

## 16. Autentikasi, otorisasi, dan audit

- Pertahankan kebijakan login staf username + PIN tepat 6 digit. PIN tidak boleh disimpan atau dicatat dalam bentuk plaintext.
- Jangan mengimplementasikan autentikasi kustom yang melemahkan keamanan. Verifikasi rancangan autentikasi Supabase yang dipakai terhadap kebutuhan username + PIN sebelum memilih mekanisme; jika ada konflik teknis atau konsekuensi keamanan, laporkan dan minta keputusan Owner.
- Sesi harus dapat dicabut dan ditangani dengan benar saat logout, pergantian role, penonaktifan akun, atau perubahan assignment cabang.
- RBAC harus default-deny: izin yang tidak secara eksplisit diberikan berarti ditolak.
- Evaluasi izin pada server/database untuk setiap operasi. Validasi role saja tidak cukup; periksa permission spesifik, status pengguna, assignment, dan branch scope.
- Jangan menerima user_id, role, permission, atau authorized branch IDs dari payload browser sebagai fakta tepercaya. Ambil dari sesi/claims tepercaya dan data otorisasi server.
- Catat audit untuk tindakan kritis dengan actor, waktu, target, cabang, tindakan, dan metadata minimum yang diperlukan. Jangan mencatat PIN, token, secret, atau informasi sensitif yang tidak diperlukan.

## 17. Standar kualitas dan pengujian

- Temukan perintah test/lint/typecheck/build dari package.json, konfigurasi, dan workflow yang ada; jangan mengarang command.
- Jalankan pemeriksaan yang relevan untuk setiap area yang berubah dan catat hasil aktual, termasuk test yang gagal atau tidak dapat dijalankan.
- Untuk perubahan UI, periksa responsive layout, keyboard navigation, focus visibility, label aksesibel, kontras, reduced motion, dan state loading/empty/error.
- Untuk perubahan database/otorisasi, uji skenario positif dan negatif, lintas pengguna, lintas role, lintas cabang, akses tanpa sesi, dan akses dengan identifier yang dimanipulasi.
- Untuk transaksi, uji batas nilai, stok tidak cukup, duplikasi submit, pembatalan/kegagalan, pembulatan rupiah, dan konsistensi data sesuai aturan yang berlaku.
- Test harus menguji perilaku yang diharapkan, bukan sekadar memeriksa bahwa fungsi dipanggil. Jangan melemahkan assertion atau menghapus test yang gagal tanpa analisis akar masalah.
- Jika test memerlukan layanan atau secret yang tidak tersedia, nyatakan sebagai BLOCKED dan sebutkan prasyaratnya. Jangan mengklaim lulus.
- Jalankan build akhir setelah perubahan yang memengaruhi build. Simpan bukti CI/commit yang dapat diverifikasi.

## 18. Dependensi dan perubahan arsitektur

- Pilih dependensi sesedikit mungkin dan utamakan kemampuan platform/framework yang sudah digunakan.
- Sebelum menambah dependensi, pastikan kebutuhan tidak dapat dipenuhi secara wajar oleh dependensi yang sudah ada atau API platform.
- Evaluasi pemeliharaan, lisensi, ukuran bundle, keamanan, kompatibilitas, dan kebutuhan runtime.
- Jangan memasang beberapa library yang memiliki fungsi tumpang tindih tanpa alasan terukur.
- Perubahan arsitektur, provider, strategi autentikasi, package manager, atau pola data lintas modul harus dicatat dan mendapat persetujuan Owner jika mengubah keputusan yang sudah dikunci.

## 19. Git, review, dan penyelesaian

- Jangan melakukan force-push, menghapus branch, menulis ulang riwayat, atau mengubah commit milik pihak lain tanpa instruksi eksplisit.
- Kelompokkan perubahan dalam commit kecil dengan pesan yang menjelaskan maksud. Jangan mencampur refactor tidak terkait ke dalam satu perubahan fitur.
- Untuk pekerjaan implementasi, gunakan branch/PR bila workflow repository mendukungnya; jangan mengklaim PR ada jika belum dibuat.
- Sebelum commit, tinjau diff untuk mendeteksi secret, file generated yang tidak perlu, perubahan tak terkait, dan regresi kontrak.
- Setelah perubahan, baca kembali file yang diubah dan periksa commit/CI. Catat SHA aktual.
- Status akhir harus dibedakan:
  - **IMPLEMENTED:** perubahan sudah ditulis dan tersimpan, tetapi belum memiliki bukti verifikasi lengkap.
  - **VERIFIED:** acceptance criteria yang relevan telah diuji dan bukti test/CI berhasil tersedia.
  - **BLOCKED:** ada prasyarat atau kegagalan yang mencegah penyelesaian.
- Jika commit langsung ke main, nyatakan secara eksplisit. Jika branch/PR belum digabung, beri label UNMERGED.
- Jangan menyatakan fitur selesai jika sebagian acceptance criteria masih belum terpenuhi.

## 20. Format laporan agen

Setiap laporan pekerjaan harus memuat secara ringkas:
- Tujuan dan scope yang dikerjakan.
- File yang berubah.
- Implementasi yang benar-benar tersedia.
- Test/pemeriksaan yang dijalankan dan hasil aktual.
- Hal yang belum diuji atau blocker.
- Status akhir sesuai progres.md.
- Commit SHA, PR number, atau CI run; serta status merge/deploy bila relevan.

Gunakan istilah secara presisi:
- "Ditulis" untuk perubahan dokumentasi/kode yang tersimpan.
- "Diimplementasikan" untuk perilaku yang sudah dibuat.
- "Diuji" hanya untuk test yang benar-benar dijalankan.
- "Terverifikasi" hanya bila acceptance criteria didukung bukti test/CI.
- "Di-merge" hanya bila sudah masuk branch target.
- "Di-deploy" hanya bila deployment aktual dapat diperiksa.
