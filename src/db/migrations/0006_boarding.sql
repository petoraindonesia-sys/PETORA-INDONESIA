/**
 * Migrasi 0006: Rawat Inap / Boarding (BR-012, BR-014).
 *
 * Tabel boarding mencatat check-in/check-out hewan rawat inap.
 * Biaya kandang dihitung otomatis per 24 jam (minimal 1 hari).
 * BR-012: check-in dan check-out pada timestamp yang sama = 1 hari.
 * Catatan: total_days dan total_cage_fee dihitung di aplikasi (service),
 * bukan generated column, karena now() tidak immutable untuk generated column.
 */
create type boarding_status as enum ('checked_in', 'checked_out', 'cancelled');

-- Kandang (cage) - referensi untuk tarif & kapasitas (harus dibuat dulu karena boarding FK ke cage)
create table if not exists cage (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  code text not null,
  name text,
  size text, -- 'small' | 'medium' | 'large'
  rate_per_day numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(branch_id, code)
);

create index if not exists idx_cage_branch on cage(branch_id);

create table if not exists boarding (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pet(id) on delete cascade,
  visit_id uuid references visit(id) on delete set null,
  cage_id uuid references cage(id) on delete set null,
  branch_id uuid not null references branch(id) on delete restrict,
  checked_in_at timestamptz not null,
  checked_out_at timestamptz,
  cage_rate_per_day numeric(12,2) not null, -- tarif kandang per hari (dari cage atau override)
  notes text,
  status boarding_status not null default 'checked_in',
  checked_in_by uuid references profiles(id) on delete set null,
  checked_out_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_boarding_pet on boarding(pet_id);
create index if not exists idx_boarding_branch_status on boarding(branch_id, status);
create index if not exists idx_boarding_checked_in on boarding(checked_in_at);

-- RLS
alter table boarding enable row level security;
alter table cage enable row level security;

-- Staff cabang yang sama bisa CRUD boarding di cabang mereka
create policy boarding_branch_all on boarding
  for all using (
    branch_id = current_setting('app.branch_id', true)::uuid
  )
  with check (
    branch_id = current_setting('app.branch_id', true)::uuid
  );

-- Staff dengan medical.read bisa baca semua boarding (lintas cabang)
create policy boarding_medical_read on boarding
  for select using (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code = 'medical.read'
    )
  );

-- Portal user bisa baca boarding hewan mereka (checked_out only)
create policy boarding_portal_read on boarding
  for select using (
    exists (
      select 1 from portal_user pu
      join pet p on p.customer_id = pu.customer_id
      where pu.id = auth.uid() and boarding.pet_id = p.id
        and boarding.status = 'checked_out'
    )
  );

-- Cage: staff cabang bisa baca/update cage di cabang mereka
create policy cage_branch_all on cage
  for all using (
    branch_id = current_setting('app.branch_id', true)::uuid
  )
  with check (
    branch_id = current_setting('app.branch_id', true)::uuid
  );

grant select, insert, update on boarding to authenticated;
grant select, insert, update on cage to authenticated;