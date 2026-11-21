# ADR-0001: Autentikasi Staf PETORA

- **Status:** PENDING — menunggu rancangan implementasi dan verifikasi end-to-end.
- **Tanggal:** 2026-11-21
- **Area:** Supabase Auth, sesi staf, RBAC.

## Konteks dan keputusan produk

Kontrak produk yang telah ditetapkan Owner:
- Staf masuk menggunakan username dan PIN tepat 6 digit.
- Tidak menambahkan MFA atau langkah login tambahan.
- Satu perusahaan mendukung banyak cabang.
- RBAC bersifat default-deny; hak akses dan cabang yang diizinkan harus bersumber dari data tepercaya.
- PIN tidak boleh disimpan dalam plaintext atau dicatat pada log.

## Fakta kompatibilitas Supabase

Dokumentasi resmi Supabase untuk password-based Auth menjelaskan identifier email atau nomor telepon. API password sign-in bawaan tidak menerima username sebagai identifier langsung.

Rujukan:
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/server-side/creating-a-client

Implikasi: jangan mengimplementasikan pemanggilan signInWithPassword dengan username seolah-olah didukung langsung. Diperlukan rancangan integrasi yang tetap menghasilkan sesi Supabase terverifikasi dan mempertahankan RLS.

## Persyaratan keamanan minimum

1. PIN hanya diproses pada batas server tepercaya; tidak boleh ada PIN plaintext pada database, log, audit metadata, telemetry, atau pesan error.
2. Hash PIN harus menggunakan algoritme password hashing adaptif yang sesuai dan parameter yang dapat ditinjau.
3. Percobaan login harus memiliki rate limit dan penanganan brute force/credential stuffing. Batas harus berlaku per akun dan sumber permintaan, tanpa mengungkap apakah username terdaftar.
4. Respons login gagal harus generik dan tidak membedakan username tidak ada, PIN salah, atau akun nonaktif.
5. Sesi harus dapat dicabut. Operasi sensitif harus memvalidasi status akun/sesi terkini, bukan hanya mengandalkan klaim JWT yang mungkin belum diperbarui.
6. JWT/RLS tidak boleh menggunakan user metadata yang dapat diubah pengguna sebagai sumber otorisasi.
7. Role, permission, status pegawai, assignment, dan branch scope harus diambil dari sumber otoritatif di database.
8. Service-role/secret key hanya boleh berada di lingkungan server tepercaya dan tidak pernah dikirim ke browser.

## Hal yang belum diputuskan

- Mekanisme yang akan menghubungkan username + PIN dengan sesi Supabase Auth yang valid.
- Apakah identitas staf akan dipetakan ke identifier Auth internal atau memakai adapter autentikasi server-side lain yang didukung Supabase.
- Desain lockout, rate-limit, dan pemulihan akun yang sesuai dengan operasional Owner.
- Strategi pengujian terhadap project Supabase aktual.

## Kriteria sebelum implementasi

Jangan membuat tabel kredensial, Edge Function login, custom token, atau policy RLS yang bergantung pada desain autentikasi asumtif sebelum:
- project Supabase PETORA dapat diakses untuk pengujian;
- mekanisme username + PIN disepakati dan dibuktikan dapat menghasilkan sesi Supabase yang valid;
- test membuktikan brute-force protection, generic failure response, session revocation, dan akses RLS allow/deny;
- rancangan tidak menambah MFA atau mengubah kontrak login Owner.

**Status saat ini:** belum ada perubahan schema/Auth pada project cloud. Keputusan implementasi autentikasi tetap PENDING.
