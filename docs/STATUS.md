# STATUS: PETORA

## Gambaran besar

Proyek baru (Mode A) dengan fondasi + lapisan domain/service/auth/cabang yang sudah
terverifikasi. Produk: aplikasi web operasional klinik hewan + pet shop, satu
perusahaan banyak cabang, backend Postgres (local-first, tanpa Supabase — K-009), UI
bergaya Apple, Bahasa Indonesia. Fondasi kode, modul domain murni, skema DB + RLS,
lapis data (withActor), service inventori & billing, service autentikasi lokal, dan
service cabang sudah dibuat & **terverifikasi** (38 tes unit + 81 tes integrasi hijau;
build/lint/typecheck hijau). UI minimal (login, /app dashboard, cabang, kasir,
pelanggan, kunjungan, medis, laporan, inventori, portal pemilik) **teruji end-to-end**
via browser/API.

## Sedang dikerjakan

- **Tugas**: Implementasi fitur v1 tersisa (Vaksinasi, Rawat Inap, Transfer Stok, Pengadaan UI).
- **Branch**: `main`.
- **Titik berhenti**: Inventori UI (`/app/inventory`) + Pet Owner Portal (`/portal`) selesai & teruji. Semua fitur v1 inti (login → pelanggan/hewan → kunjungan → kasir/medis + dashboard + cabang + laporan + inventori + portal) teruji end-to-end sebagai Staff A / Dokter A / Owner.
- **Langkah berikutnya konkret**:
  1. Vaksinasi: model DB (vaccination), service + API (catatan + jadwal booster), UI `/app/vaccination`.
  2. Rawat Inap: service boarding (check-in/out, biaya kandang per 24 jam BR-012), API, UI `/app/boarding`.
  3. Transfer Stok: service transfer antar cabang (draft→kirim→terima, BR-017), API, UI `/app/inventory/transfer`.
  4. Pengadaan UI: PO + batch receive (expand `/app/inventory/receive`).

## Tumpukan jeda

_Kosong._

## Masalah terbuka

- **Supabase belum disiapkan** (keputusan pengguna: lanjut tanpa Supabase, uji lokal —
  K-009). Backend = Postgres lokal (Docker). Saat backend nyata dibutuhkan, ganti
  `DATABASE_URL` ke connection string Supabase; RLS & service tetap.

## Pekerjaan terakhir

1. Migrasi `0003_auth_session.sql` (sesi + password_hash/email) + service auth (scrypt, hash token) + rute login/logout/me + middleware. (terverifikasi)
2. Service cabang (`src/lib/branches`): list/get/create/update/deactivate + validasi zona waktu; RLS Owner-only. (terverifikasi)
3. API /api/branches (GET/POST) + /[id] (PATCH/DELETE) dengan requireActor. (terverifikasi)
4. Halaman /app/branches (Owner): daftar + form tambah + zona waktu. **Teruji browser — Owner CRUD berjalan, Staff ditolak RLS.**
5. 12 tes integrasi cabang (Owner CRUD, Staff ditolak RLS, zona waktu invalid ditolak). (terverifikasi)
6. Service billing: `listInvoices` + `getInvoice` (RLS, detail item+pembayaran). (terverifikasi)
7. API /api/invoices (GET/POST) + /[id] (GET) + /[id]/payments (POST). (terverifikasi)
8. Halaman /app/cashier: buat tagihan (item/diskon/PPN/pembulatan) + catat pembayaran. **Teruji browser — Staff A buat tagihan & bayar tunai + kembalian, idempoten.**
9. 4 tes integrasi listInvoices/getInvoice (RLS batasi cabang, filter branchId, detail benar). (terverifikasi)
10. Service pelanggan (list/get/create/update) + hewan (list by customer/get/create/update). (terverifikasi)
11. API /api/customers (GET/POST, /[id] GET/PATCH) + /api/pets (GET/POST) dengan requireActor. (terverifikasi)
12. Halaman /app/customers: daftar + cari + form pelanggan + kelola hewan per pelanggan. **Teruji browser — Staff A CRUD pelanggan/hewan lintas cabang.**
13. 11 tes integrasi pelanggan/hewan (CRUD, terpusat lintas cabang, validasi). (terverifikasi)
14. Service kunjungan (list by branch/create/get) + transisi status + nomor antrean harian. (terverifikasi)
15. Service rekam medis (listByPet/createDraft/updateDraft/finalize) - RLS draft/final. (terverifikasi)
16. API /api/visits (GET/POST) + /[id]/status (PATCH); /api/medical-records (GET/POST) + /[id] (GET/PATCH/POST). (terverifikasi)
17. Halaman /app/visits: daftar kunjungan cabang + buat kunjungan + ubah status. **Teruji browser — Staff A buat kunjungan, antrean harian, transisi status terdaftar→menunggu→diperiksa→selesai.**
18. Halaman /app/medical: rekam medis per pasien lintas cabang, draft→edit→final. **Teruji browser — Dokter A buat draft, edit, finalisasi; Staff A ditolak medical.write.**
19. 13 tes integrasi kunjungan & rekam medis (isolasi cabang, draft/final terkunci, lintas cabang read). (terverifikasi)
20. Service dashboard: ringkasan per cabang (kunjungan/tagihan hari ini + piutang) + API /api/dashboard. (terverifikasi)
21. Halaman /app (dashboard): kartu total + rincian per cabang + akses modul. **Teruji browser — ringkasan per cabang (WIB/WITA/WIT) benar.**
22. 4 tes integrasi dashboard (RLS batasi cabang, hitungan kunjungan/tagihan benar, totals). (terverifikasi)
23. **Browser testing alur inti (Staff A / Dokter A / Owner):** login → pelanggan/hewan → kunjungan → kasir/medis + dashboard + cabang. **Semua lolos.**
24. **Service & API laporan periode (`src/lib/reports`, `/api/reports`):** agregasi penjualan & kunjungan per hari lokal per cabang (BR-016 zona waktu). RLS Owner lihat semua, Staff hanya cabang tugas. **Teruji API.**
25. **Halaman /app/reports:** filter jenis (penjualan/kunjungan), rentang tanggal, cabang; tabel + chart harian per cabang. **Teruji browser.**
26. **Service inventori (`src/lib/inventory/service.ts`):** receiveStock (BR-006), adjustStock (Supervisor), getStock (per cabang/produk/batch). RLS batasi cabang. **5 tes integrasi hijau.**
27. **API /api/inventory (GET), /api/inventory/receive (POST), /api/inventory/adjust (POST), /api/inventory/mutations (GET).** (terverifikasi)
28. **Halaman /app/inventory:** 4 tab (Stok, Terima Stok, Sesuaikan, Mutasi). **Teruji browser.**
29. **Migrasi `0004_portal.sql` (portal_user, portal_session, RLS pemilik hewan).** (terverifikasi)
30. **Service auth portal (`src/lib/auth/portal.ts`):** login, create account, session, password. **Teruji.**
31. **API portal:** /api/portal/auth/login, /logout, /me, /pets, /medical, /invoices. (terverifikasi)
32. **Halaman /portal/login + /portal/dashboard:** login, hewan, riwayat medis (final+shared), tagihan. **Teruji browser.**
33. **API /api/admin/portal-accounts (POST):** Owner buat akun portal untuk customer. (terverifikasi)
34. **Migrasi `0005_vaccination.sql` (vaccination table, RLS, enum status).** (terverifikasi)
35. **Service vaksinasi (`src/lib/vaccination/service.ts`):** create/update/cancel, listByPet, due/upcoming (BR-013 interval default + override). **Teruji.**
36. **API vaksinasi:** /api/vaccination (GET/POST), /[id] (GET/PATCH/DELETE), /api/products?type=vaccine. (terverifikasi)
37. **Halaman /app/vaccination:** 4 tab (Semua, Jatuh Tempo, Akan Datang, Tambah); CRUD vaksinasi + filter hewan/status. **Teruji browser.**
38. **Dashboard:** link "Vaksinasi" ditambahkan ke navigasi.
39. **Migrasi `0006_boarding.sql` (boarding, cage tables, RLS).** (terverifikasi)
40. **Service boarding (`src/lib/boarding/service.ts`):** check-in/out, hitung biaya per 24 jam (BR-012 min 1 hari), cage management. **Teruji.**
41. **API boarding:** /api/boarding (GET/POST), /[id] (GET/PATCH checkout/cancel), /api/cages (GET/POST). (terverifikasi)
42. **Halaman /app/boarding:** 4 tab (Aktif, Riwayat, Check-in, Kandang); CRUD boarding + kelola kandang. **Teruji browser.**
43. **Dashboard:** link "Rawat Inap" ditambahkan ke navigasi.
44. **Migrasi `0007_stock_transfer.sql` (stock_transfer table, RLS, enum status).** (terverifikasi)
45. **Service transfer stok (`src/lib/stock_transfer/service.ts`):** draft→kirim (FEFO asal)→terima (batch terbawa), cancel (hanya draft), selisih catat (BR-017). **Teruji.**
46. **API transfer:** /api/stock-transfer (GET/POST), /[id] (GET/PATCH send/receive/cancel). (terverifikasi)
47. **Halaman /app/transfer:** 4 tab (Keluar, Masuk, Semua, Buat Transfer); CRUD transfer + filter status. **Teruji browser.**
48. **Dashboard:** link "Transfer Stok" ditambahkan ke navigasi.

## Langkah berikutnya

1. Pengadaan UI: expand `/app/inventory/receive` untuk PO + batch.
2. (Opsional) Supabase & deploy (Vercel) — perlu pengguna (AGENTS.md 12).