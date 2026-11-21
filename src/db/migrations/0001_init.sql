-- Migrasi awal PETORA: skema inti + Row Level Security (BR-001, BR-002, BR-003, BR-016).
--
-- Keamanan ditegakkan di database, bukan hanya di UI (BRIEF bagian 8 & 12).
-- Migrasi ini kompatibel dengan Supabase (memakai auth.uid()) dan Postgres polos
-- (auth.uid() di-shim oleh harness tes). Dapat dijalankan berulang (idempoten via
-- IF NOT EXISTS / CREATE OR REPLACE).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Perusahaan (tenant tunggal) + pengaturan pajak & pembulatan (BR-020, BR-021)
-- ---------------------------------------------------------------------------
create table if not exists company (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  tax_enabled          boolean not null default false,
  tax_rate_percent     numeric(5,2) not null default 0 check (tax_rate_percent >= 0 and tax_rate_percent <= 100),
  tax_prices_include   boolean not null default false,
  rounding_step        integer not null default 0 check (rounding_step in (0, 100, 500, 1000)),
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Cabang (BR-016: zona waktu per lokasi)
-- ---------------------------------------------------------------------------
create table if not exists branch (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references company(id) on delete restrict,
  name        text not null,
  address     text,
  timezone    text not null check (timezone in ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Role & permission (BR-002, dapat dikonfigurasi)
-- ---------------------------------------------------------------------------
create table if not exists role (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text
);

create table if not exists permission (
  id    uuid primary key default gen_random_uuid(),
  code  text not null unique,
  name  text not null
);

create table if not exists role_permission (
  role_id       uuid not null references role(id) on delete cascade,
  permission_id uuid not null references permission(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Pengguna operasional (Owner, Supervisor, Dokter, Staff).
-- id = id pengguna Supabase Auth.
create table if not exists profiles (
  id          uuid primary key,
  full_name   text not null,
  is_owner    boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists user_role (
  user_id uuid not null references profiles(id) on delete cascade,
  role_id uuid not null references role(id) on delete cascade,
  primary key (user_id, role_id)
);

-- Override permission per pengguna (Owner dapat mengubah per pengguna).
create table if not exists user_permission (
  user_id       uuid not null references profiles(id) on delete cascade,
  permission_id uuid not null references permission(id) on delete cascade,
  granted       boolean not null default true,
  primary key (user_id, permission_id)
);

-- Penugasan pengguna ke cabang (BR-001).
create table if not exists branch_members (
  user_id   uuid not null references profiles(id) on delete cascade,
  branch_id uuid not null references branch(id) on delete cascade,
  primary key (user_id, branch_id)
);

-- ---------------------------------------------------------------------------
-- Pelanggan & hewan (terpusat lintas cabang, BR-003)
-- ---------------------------------------------------------------------------
create table if not exists customer (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text,
  email       text,
  address     text,
  created_at  timestamptz not null default now(),
  created_by  uuid references profiles(id)
);

create table if not exists pet (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references customer(id) on delete restrict,
  name          text not null,
  species       text not null,
  breed         text,
  sex           text check (sex in ('male','female','unknown')),
  birth_date    date,
  weight_grams  integer check (weight_grams is null or weight_grams >= 0),
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_pet_customer on pet(customer_id);

-- ---------------------------------------------------------------------------
-- Kunjungan klinik (operasional, per cabang — BR-001)
-- ---------------------------------------------------------------------------
create table if not exists visit (
  id            uuid primary key default gen_random_uuid(),
  branch_id     uuid not null references branch(id) on delete restrict,
  customer_id   uuid not null references customer(id) on delete restrict,
  pet_id        uuid not null references pet(id) on delete restrict,
  status        text not null default 'terdaftar'
                  check (status in ('terdaftar','menunggu','diperiksa','selesai','dibatalkan')),
  queue_number  integer,
  registered_by uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create index if not exists idx_visit_branch on visit(branch_id);

-- ---------------------------------------------------------------------------
-- Rekam medis (BR-003 lintas cabang, BR-004 hanya Dokter, BR-005 dibagikan)
-- ---------------------------------------------------------------------------
create table if not exists medical_record (
  id            uuid primary key default gen_random_uuid(),
  visit_id      uuid references visit(id) on delete set null,
  branch_id     uuid not null references branch(id) on delete restrict, -- cabang ASAL entri
  pet_id        uuid not null references pet(id) on delete restrict,
  author_id     uuid not null references profiles(id),
  status        text not null default 'draft' check (status in ('draft','final')),
  shared        boolean not null default false,  -- BR-005 dibagikan ke portal
  anamnesis    text,
  examination  text,
  diagnosis    text,
  treatment    text,
  prescription text,
  created_at    timestamptz not null default now(),
  finalized_at  timestamptz
);

create index if not exists idx_medical_pet on medical_record(pet_id);
create index if not exists idx_medical_branch on medical_record(branch_id);

-- ---------------------------------------------------------------------------
-- Jejak audit (BR-014) — append-only
-- ---------------------------------------------------------------------------
create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   text,
  data        jsonb,
  created_at  timestamptz not null default now()
);

-- ===========================================================================
-- Helper RLS (SECURITY DEFINER agar tidak memicu rekursi RLS)
-- ===========================================================================

-- True bila pengguna aktif adalah Owner (lihat semua cabang — BR-001 pengecualian).
create or replace function public.is_active_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.is_owner and p.is_active
  );
$$;

-- Daftar cabang yang dapat diakses pengguna aktif (BR-001).
-- Owner -> semua cabang aktif. Selain itu -> cabang tempat ia ditugaskan.
create or replace function public.user_branch_ids()
returns table(branch_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select b.id from branch b
  where b.is_active
    and (
      public.is_active_owner()
      or exists (select 1 from branch_members m where m.branch_id = b.id and m.user_id = auth.uid())
    );
$$;

-- True bila pengguna aktif memiliki sebuah permission (BR-002).
-- Owner dianggap memiliki semua permission.
-- Override per pengguna (user_permission) bersifat otoritatif: bila ada baris untuk
-- permission ini, nilai granted-nya yang dipakai (boleh mencabut izin dari peran);
-- bila tidak ada, jatuh ke permission dari peran.
create or replace function public.has_permission(perm_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_owner()
     or (
       case
         when exists (
           select 1 from user_permission up
           join permission p on p.id = up.permission_id
           where up.user_id = auth.uid() and p.code = perm_code
         )
         then exists (
           select 1 from user_permission up
           join permission p on p.id = up.permission_id
           where up.user_id = auth.uid() and p.code = perm_code and up.granted
         )
         else exists (
           select 1
           from user_role ur
           join role_permission rp on rp.role_id = ur.role_id
           join permission p on p.id = rp.permission_id
           where ur.user_id = auth.uid() and p.code = perm_code
         )
       end
     );
$$;

-- True bila pengguna aktif adalah pengguna operasional (punya profil & aktif).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.is_active);
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

-- Perusahaan: hanya Owner yang membaca/mengubah.
alter table company enable row level security;
create policy company_read on company for select to authenticated
  using (public.is_active_owner());
create policy company_write on company for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

-- Cabang: Owner baca semua; staf baca cabang yang ditugaskan.
alter table branch enable row level security;
create policy branch_read on branch for select to authenticated
  using (public.is_active_owner() or exists (select 1 from public.user_branch_ids() u where u.branch_id = branch.id));
create policy branch_write on branch for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

-- Role & permission: semua staf boleh membaca; hanya Owner yang mengubah.
alter table role enable row level security;
create policy role_read on role for select to authenticated using (public.is_staff());
create policy role_write on role for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

alter table permission enable row level security;
create policy permission_read on permission for select to authenticated using (public.is_staff());
create policy permission_write on permission for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

alter table role_permission enable row level security;
create policy role_permission_read on role_permission for select to authenticated using (public.is_staff());
create policy role_permission_write on role_permission for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

alter table user_permission enable row level security;
create policy user_permission_read on user_permission for select to authenticated using (public.is_staff());
create policy user_permission_write on user_permission for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

alter table user_role enable row level security;
create policy user_role_read on user_role for select to authenticated using (public.is_staff());
create policy user_role_write on user_role for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

-- Profil: pengguna baca profil terbatas; Owner kelola semua.
alter table profiles enable row level security;
create policy profiles_read on profiles for select to authenticated using (public.is_staff());
create policy profiles_write on profiles for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

alter table branch_members enable row level security;
create policy branch_members_read on branch_members for select to authenticated using (public.is_staff());
create policy branch_members_write on branch_members for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

-- Pelanggan & hewan: terpusat lintas cabang (BR-003). Staf boleh baca; staf boleh tulis
-- (pembuatan dicatat oleh created_by). Tidak dibatasi per cabang.
alter table customer enable row level security;
create policy customer_read on customer for select to authenticated using (public.is_staff());
create policy customer_write on customer for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

alter table pet enable row level security;
create policy pet_read on pet for select to authenticated using (public.is_staff());
create policy pet_write on pet for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Kunjungan: operasional, per cabang (BR-001).
alter table visit enable row level security;
create policy visit_read on visit for select to authenticated
  using (exists (select 1 from public.user_branch_ids() u where u.branch_id = visit.branch_id));
create policy visit_write on visit for all to authenticated
  using (exists (select 1 from public.user_branch_ids() u where u.branch_id = visit.branch_id))
  with check (exists (select 1 from public.user_branch_ids() u where u.branch_id = visit.branch_id));

-- Rekam medis (BR-003/BR-004/BR-005):
-- * Baca lintas cabang bila punya permission 'medical.read' (BR-003).
-- * Tulis (insert/update) hanya Dokter (permission 'medical.write') di cabang tempat
--   pelayanan, dan hanya entri draft miliknya sendiri; entri final terkunci (BR-004).
alter table medical_record enable row level security;
create policy medical_select on medical_record for select to authenticated
  using (public.has_permission('medical.read'));
create policy medical_insert on medical_record for insert to authenticated
  with check (
    public.has_permission('medical.write')
    and author_id = auth.uid()
    and status = 'draft'
    and exists (select 1 from public.user_branch_ids() u where u.branch_id = medical_record.branch_id)
  );
create policy medical_update on medical_record for update to authenticated
  using (
    public.has_permission('medical.write')
    and author_id = auth.uid()
    and status = 'draft'
    and exists (select 1 from public.user_branch_ids() u where u.branch_id = medical_record.branch_id)
  )
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.user_branch_ids() u where u.branch_id = medical_record.branch_id)
  );

-- Audit: append-only. Staf boleh baca; sisip via fungsi server (security definer).
alter table audit_log enable row level security;
create policy audit_read on audit_log for select to authenticated using (public.is_active_owner());

-- ===========================================================================
-- Seed minimal: peran bawaan & permission inti (idempoten)
-- ===========================================================================
insert into permission (code, name) values
  ('visit.manage', 'Mengelola kunjungan'),
  ('medical.read', 'Membaca rekam medis'),
  ('medical.write', 'Menulis rekam medis'),
  ('invoice.manage', 'Mengelola tagihan'),
  ('payment.record', 'Mencatat pembayaran'),
  ('stock.manage', 'Mengelola stok'),
  ('stock.adjust', 'Penyesuaian stok'),
  ('invoice.void', 'Membatalkan tagihan (void)')
on conflict (code) do nothing;

insert into role (code, name) values
  ('owner', 'Owner'),
  ('supervisor', 'Supervisor'),
  ('vet', 'Dokter'),
  ('staff', 'Staff')
on conflict (code) do nothing;

-- Permission inti per peran (Owner mendapat semua via is_active_owner).
insert into role_permission (role_id, permission_id)
select r.id, p.id
from role r, permission p
where r.code = 'vet' and p.code in ('visit.manage','medical.read','medical.write','invoice.manage','stock.manage')
on conflict do nothing;

insert into role_permission (role_id, permission_id)
select r.id, p.id
from role r, permission p
where r.code = 'staff' and p.code in ('visit.manage','invoice.manage','payment.record','stock.manage')
on conflict do nothing;

insert into role_permission (role_id, permission_id)
select r.id, p.id
from role r, permission p
where r.code = 'supervisor' and p.code in ('visit.manage','invoice.manage','payment.record','stock.manage','stock.adjust','invoice.void','medical.read')
on conflict do nothing;