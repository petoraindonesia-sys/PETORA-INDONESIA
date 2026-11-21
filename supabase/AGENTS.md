# AGENTS.md — Supabase PETORA

Instruksi ini berlaku untuk seluruh file di bawah `supabase/`. Instruksi ini melengkapi `/AGENTS.md`; tidak menggantikan keputusan Owner atau kontrak root. Jika ada konflik, ikuti prioritas sumber kebenaran pada AGENTS.md root dan hentikan pekerjaan yang membutuhkan asumsi.

## 1. Tanggung jawab area

- Supabase adalah backend, database PostgreSQL, autentikasi, dan layanan data utama PETORA.
- Perubahan pada schema, migration, RLS, Auth, Storage, Realtime, RPC, atau Edge Functions harus mengikuti kontrak ini.
- Periksa struktur dan konfigurasi Supabase aktual sebelum membuat file atau memilih pola. Jangan mengasumsikan direktori, versi CLI, extension, project ref, atau environment sudah tersedia.
- Jangan membuat backend terpisah atau memindahkan sumber data tanpa keputusan Owner.

## 2. Prinsip data dan schema

- Semua perubahan schema harus berupa migration SQL berurutan yang disimpan dalam repository.
- Migration harus idempotent bila sesuai, aman untuk deployment berulang, dan mempertimbangkan urutan dependensi.
- Gunakan foreign key, unique/check constraints, not-null, default, index, dan tipe data yang tepat untuk menjaga integritas pada database.
- Jangan mengandalkan validasi frontend untuk integritas data.
- Gunakan transaksi database untuk operasi multi-langkah yang harus atomik.
- Hindari trigger/function yang menyembunyikan efek samping penting atau menimbulkan coupling yang tidak jelas.
- Beri nama schema object secara konsisten dan eksplisit. Hindari nama ambigu serta perubahan destruktif tanpa rencana migrasi.
- Untuk perubahan yang berpotensi menghapus atau mengubah data, rancang strategi kompatibilitas, backfill, dan rollback/recovery sebelum eksekusi.
- Jangan menjalankan migration destruktif terhadap production tanpa persetujuan eksplisit dan rencana pemulihan.
- Jangan menambahkan seed berisi data pelanggan, hewan, pegawai, transaksi, atau rekam medis nyata.

## 3. Multi-branch dan integritas relasi

- PETORA adalah satu perusahaan dengan banyak cabang. Model data harus mendukung isolasi cabang tanpa mengorbankan relasi dan konsistensi perusahaan.
- Setiap tabel operasional yang terikat cabang harus memiliki relasi/cakupan cabang yang eksplisit sesuai model domain.
- Validasi konsistensi branch ID pada relasi: child record tidak boleh menghubungkan parent dari cabang yang tidak kompatibel.
- Jangan mengandalkan filter aplikasi sebagai satu-satunya batas data.
- Terapkan scope pada SELECT, INSERT, UPDATE, DELETE, join, view, function, RPC, dan operasi Storage yang relevan.
- Uji akses lintas cabang, termasuk manipulasi UUID/ID, relasi bertingkat, dan operasi bulk.
- Jangan menyimpulkan semua data harus memiliki branch_id; data master tingkat perusahaan dapat memiliki scope berbeda jika ditetapkan oleh model domain.

## 4. Row Level Security (RLS)

- Aktifkan RLS untuk setiap tabel yang dapat diakses oleh role API/Data API.
- Policy harus default-deny. Buat policy spesifik untuk operasi dan role yang benar-benar diperlukan.
- Evaluasi SELECT, INSERT, UPDATE, DELETE secara terpisah; untuk UPDATE/DELETE gunakan kondisi lama dan kondisi hasil sesuai semantik policy.
- Jangan menggunakan policy permissive global, `USING (true)`, atau `WITH CHECK (true)` untuk akses pengguna umum.
- Jangan menganggap menyembunyikan data di frontend sebagai perlindungan.
- Periksa efek view, function, RPC, SECURITY DEFINER, search_path, grants, dan role inheritance terhadap RLS.
- Jika memakai SECURITY DEFINER, batasi privilege, tetapkan search_path secara aman, validasi caller, dan dokumentasikan alasan penggunaannya.
- Hindari policy yang memanggil query rekursif ke tabel yang policy-nya sama tanpa desain yang aman.
- Jangan menonaktifkan RLS untuk memperbaiki test atau mempermudah development.
- Test harus membuktikan akses yang sah berhasil dan akses tanpa sesi, lintas role, serta lintas cabang ditolak.

## 5. Auth, identitas, dan RBAC

- Ikuti keputusan Owner: staf login dengan username dan PIN tepat 6 digit; jangan menambah MFA atau langkah login tanpa persetujuan.
- Jangan menyimpan PIN dalam plaintext atau reversible encryption. Gunakan mekanisme verifikasi yang aman dan terukur, dengan proteksi brute force/rate limiting sesuai rancangan.
- Sebelum implementasi, validasi apakah alur username + PIN dapat dipenuhi secara aman oleh mekanisme Supabase Auth yang dipilih. Jika membutuhkan custom auth flow atau fungsi server tepercaya, dokumentasikan risiko dan minta persetujuan Owner sebelum mengubah model keamanan.
- Jangan menyimpan PIN atau credential dalam log, audit metadata, analytics, test output, atau pesan error.
- Jangan menganggap user metadata yang dapat diubah pengguna sebagai sumber role/permission tepercaya.
- RBAC default-deny. Role, permission, status akun, assignment pegawai, dan daftar cabang harus berasal dari sumber otoritatif yang terlindungi.
- Jangan menerima user ID, role, permission, atau authorized branch IDs dari payload browser sebagai dasar otorisasi.
- Perubahan role, assignment cabang, status akun, dan pencabutan sesi harus memiliki perilaku konsisten serta test.
- Pastikan session revocation dan perubahan status akun berdampak pada akses berikutnya.

## 6. Functions, RPC, dan Edge Functions

- Gunakan SQL function/RPC atau Edge Functions hanya jika sesuai kebutuhan; jangan menambah lapisan tanpa manfaat jelas.
- Validasi input, caller identity, permission, branch scope, dan invariants pada batas tepercaya.
- Jangan percaya parameter identitas/role/cabang yang dikirim client.
- Batasi privilege function. SECURITY DEFINER hanya dengan alasan dan review keamanan khusus.
- Operasi finansial atau inventory yang multi-langkah harus atomik dan tahan terhadap race condition/duplicate request sesuai kebutuhan.
- Tetapkan strategi idempotency untuk operasi yang dapat terkirim ulang atau dipanggil bersamaan.
- Jangan mengekspos secret melalui response, log, atau source code.
- Edge Function yang privileged wajib memvalidasi autentikasi dan otorisasi sebelum melakukan mutasi.
- Catat kontrak request/response dan error yang aman bila function digunakan.

## 7. Storage dan Realtime

- Jika Storage digunakan, definisikan bucket, batas ukuran/tipe file, kepemilikan, dan policy akses secara eksplisit.
- Jangan menggunakan public bucket untuk dokumen privat, rekam medis, atau data sensitif.
- Path file tidak boleh menjadi satu-satunya mekanisme otorisasi; validasi pemilik dan branch scope pada policy.
- Uji upload, download, overwrite, delete, dan akses lintas pengguna/cabang.
- Jika Realtime digunakan, pastikan publikasi dan policy tidak membocorkan data lintas role/cabang.
- Jangan mengaktifkan Realtime pada tabel hanya demi kemudahan; tentukan kebutuhan dan dampak performanya.

## 8. Audit dan keamanan operasional

- Tindakan kritis seperti persetujuan, perubahan role, retur, diskon, penyesuaian stok, transaksi, dan perubahan data klinis harus memiliki audit trail sesuai kebutuhan domain.
- Audit harus mengidentifikasi actor tepercaya, timestamp, target, cabang, tindakan, dan metadata minimum.
- Audit log harus terlindungi dari manipulasi oleh pengguna biasa.
- Jangan mencatat PIN, password, token, secret, atau payload sensitif yang tidak diperlukan.
- Gunakan least privilege pada database role, grants, function, dan service credentials.
- Service-role key hanya boleh dipakai pada lingkungan server tepercaya; tidak boleh dikirim ke browser.
- Jangan menambahkan policy bypass atau grant luas sebagai workaround sementara.

## 9. Testing database dan security

- Temukan versi Supabase CLI, konfigurasi, dan command test yang benar-benar tersedia.
- Untuk setiap migration, tambahkan atau perbarui test database yang sesuai.
- Uji constraint dan invariants, bukan hanya keberhasilan query.
- Uji RLS sebagai anon, authenticated, beberapa role, dan beberapa cabang dengan skenario allow/deny.
- Uji IDOR dengan mengganti identifier resource milik pengguna/cabang lain.
- Uji INSERT, SELECT, UPDATE, DELETE, relasi, RPC, Storage policy, serta function privileged yang terdampak.
- Uji race condition/idempotency untuk transaksi sensitif bila relevan.
- Jangan melemahkan policy atau assertion untuk membuat test lulus. Cari akar masalah.
- Jika membutuhkan project credentials, database lokal, atau service yang tidak tersedia, tandai pengujian sebagai BLOCKED dan sebutkan prasyaratnya.
- Catat command aktual, jumlah test, hasil, dan bukti CI/commit di progres.md.

## 10. Pengelolaan environment dan deployment

- Jangan commit `.env`, access token, database password, service-role key, signing secret, atau credential.
- Gunakan file contoh environment hanya dengan nama variabel dan placeholder yang aman; jangan menyalin nilai asli.
- Pisahkan project/environment development, preview, dan production.
- Jangan mengubah project ref atau menghubungkan repository ke project Supabase tertentu tanpa konfirmasi Owner.
- Migration production hanya dijalankan melalui proses deployment yang disetujui dan dapat diaudit.
- Jangan menyatakan migration, Auth, Edge Function, Storage, atau database telah ter-deploy tanpa bukti aktual.
- Periksa workflow CI/CD dan dokumentasi resmi sesuai versi tool yang terpasang sebelum mengubah proses deployment.

## 11. Larangan

- Tidak boleh ada tabel tanpa kebijakan akses yang ditinjau ketika dapat diakses melalui API.
- Tidak boleh ada RLS permissive untuk seluruh pengguna umum.
- Tidak boleh ada secret di source, migration, fixture, atau log.
- Tidak boleh ada keputusan bisnis baru yang disimpulkan dari struktur database.
- Tidak boleh ada migration destruktif tanpa rencana dan persetujuan yang diperlukan.
- Tidak boleh mengklaim aman hanya karena RLS aktif; policy dan skenario negatif harus diuji.
- Tidak boleh mengklaim VERIFIED jika database test atau CI yang relevan belum berhasil.
