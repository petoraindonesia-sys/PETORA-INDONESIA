/**
 * Migrasi 0005: Vaksinasi (BR-013).
 *
 * Tabel vaccination mencatat vaksin yang diberikan ke hewan.
 * Jadwal booster dihitung dari jenis vaksin (interval hari),
 * dokter bisa override per kasus.
 */
-- Enum untuk status vaksin
create type vaccination_status as enum ('scheduled', 'completed', 'cancelled');

-- Tabel vaksinasi
create table if not exists vaccination (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pet(id) on delete cascade,
  visit_id uuid references visit(id) on delete set null,
  product_id uuid not null references product(id) on delete restrict,
  batch_id uuid references stock_batch(id) on delete set null,
  name text not null,               -- nama vaksin (denormalized dari product)
  manufacturer text,                -- produsen
  administered_at timestamptz,      -- kapan diberikan (null = belum/terjadwal)
  next_due_at timestamptz,          -- jadwal booster berikutnya
  interval_days integer,            -- interval booster (hari), override dokter
  status vaccination_status not null default 'scheduled',
  notes text,
  administered_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vaccination_pet on vaccination(pet_id);
create index if not exists idx_vaccination_due on vaccination(next_due_at) where status = 'scheduled';
create index if not exists idx_vaccination_status on vaccination(status);

-- RLS
alter table vaccination enable row level security;

-- Staff cabang yang sama bisa baca vaksinasi hewan di cabang mereka (via visit)
create policy vaccination_branch_read on vaccination
  for select using (
    exists (
      select 1 from visit v
      join branch b on b.id = v.branch_id
      where v.id = vaccination.visit_id
        and b.id = current_setting('app.branch_id', true)::uuid
    )
  );

-- Staff dengan medical.read bisa baca semua vaksinasi (lintas cabang)
create policy vaccination_medical_read on vaccination
  for select using (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code = 'medical.read'
    )
  );

-- Staff dengan medical.write bisa insert/update vaksinasi
create policy vaccination_medical_write on vaccination
  for insert with check (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code = 'medical.write'
    )
  );

create policy vaccination_medical_update on vaccination
  for update using (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code = 'medical.write'
    )
  )
  with check (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code = 'medical.write'
    )
  );

-- Portal user bisa baca vaksinasi hewan mereka (completed only)
create policy vaccination_portal_read on vaccination
  for select using (
    exists (
      select 1 from portal_user pu
      join pet p on p.customer_id = pu.customer_id
      where pu.id = auth.uid() and vaccination.pet_id = p.id
        and vaccination.status = 'completed'
    )
  );

grant select, insert, update on vaccination to authenticated;