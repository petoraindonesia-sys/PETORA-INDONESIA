/**
 * Migrasi 0007: Transfer Stok antar Cabang (BR-017).
 *
 * Alur: draft → dikirim → diterima, atau dibatalkan (hanya sebelum dikirim).
 * Stok asal berkurang saat dikirim (FEFO), tujuan bertambah saat diterima.
 * Batch & kedaluwarsa terbawa. Selisih dicatat & ditinjau Supervisor.
 */
create type transfer_status as enum ('draft', 'sent', 'received', 'cancelled');

create table if not exists stock_transfer (
  id uuid primary key default gen_random_uuid(),
  from_branch_id uuid not null references branch(id) on delete restrict,
  to_branch_id uuid not null references branch(id) on delete restrict,
  product_id uuid not null references product(id) on delete restrict,
  batch_id uuid references stock_batch(id) on delete set null,
  quantity integer not null check (quantity > 0),
  status transfer_status not null default 'draft',
  notes text,
  requested_by uuid references profiles(id) on delete set null,
  sent_at timestamptz,
  sent_by uuid references profiles(id) on delete set null,
  received_at timestamptz,
  received_by uuid references profiles(id) on delete set null,
  received_quantity integer, -- aktual diterima (bisa beda dari quantity)
  discrepancy_notes text,
  cancelled_at timestamptz,
  cancelled_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_branch_id <> to_branch_id)
);

create index if not exists idx_stock_transfer_from on stock_transfer(from_branch_id);
create index if not exists idx_stock_transfer_to on stock_transfer(to_branch_id);
create index if not exists idx_stock_transfer_status on stock_transfer(status);

-- RLS
alter table stock_transfer enable row level security;

-- Staff cabang asal bisa baca/buat transfer dari cabang mereka
create policy stock_transfer_from_branch on stock_transfer
  for all using (
    from_branch_id = current_setting('app.branch_id', true)::uuid
  )
  with check (
    from_branch_id = current_setting('app.branch_id', true)::uuid
  );

-- Staff cabang tujuan bisa baca/update transfer ke cabang mereka
create policy stock_transfer_to_branch on stock_transfer
  for select using (
    to_branch_id = current_setting('app.branch_id', true)::uuid
  );

-- Staff cabang tujuan bisa update status ke received (saat menerima)
create policy stock_transfer_to_branch_receive on stock_transfer
  for update using (
    to_branch_id = current_setting('app.branch_id', true)::uuid
    and status = 'sent'
  )
  with check (
    to_branch_id = current_setting('app.branch_id', true)::uuid
    and status in ('sent', 'received')
  );

-- Supervisor/Owner bisa baca semua transfer (via permission)
create policy stock_transfer_supervisor on stock_transfer
  for select using (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code in ('inventory.supervisor', 'owner.all')
    )
  );

-- Supervisor bisa update semua transfer (termasuk approve selisih)
create policy stock_transfer_supervisor_update on stock_transfer
  for update using (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code = 'inventory.supervisor'
    )
  )
  with check (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code = 'inventory.supervisor'
    )
  );

grant select, insert, update on stock_transfer to authenticated;