/**
 * Migrasi 0008: Pengadaan / Purchase Order (PO).
 *
 * PO: draft → dikirim supplier → diterima (bisa parsial per batch).
 * Setiap penerimaan membuat batch di stock_batch (via receiveStock).
 * PO terhubung ke supplier (bisa pakai customer type supplier atau tabel terpisah).
 * Untuk v1: PO sederhana, supplier = customer dengan type supplier.
 */
create type po_status as enum ('draft', 'ordered', 'partial', 'received', 'cancelled');

create table if not exists purchase_order (
  id uuid primary key default gen_random_uuid(),
  po_no text not null unique,
  supplier_id uuid not null references customer(id) on delete restrict,
  branch_id uuid not null references branch(id) on delete restrict,
  status po_status not null default 'draft',
  notes text,
  ordered_at timestamptz,
  ordered_by uuid references profiles(id) on delete set null,
  expected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_purchase_order_branch on purchase_order(branch_id);
create index if not exists idx_purchase_order_status on purchase_order(status);
create index if not exists idx_purchase_order_supplier on purchase_order(supplier_id);

create table if not exists purchase_order_item (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_order(id) on delete cascade,
  product_id uuid not null references product(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  cost_price numeric(12,2) not null, -- harga beli per unit
  received_quantity integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_po_item_po on purchase_order_item(po_id);
create index if not exists idx_po_item_product on purchase_order_item(product_id);

-- RLS
alter table purchase_order enable row level security;
alter table purchase_order_item enable row level security;

-- Staff cabang bisa CRUD PO di cabang mereka
create policy po_branch_all on purchase_order
  for all using (
    branch_id = current_setting('app.branch_id', true)::uuid
  )
  with check (
    branch_id = current_setting('app.branch_id', true)::uuid
  );

create policy po_item_branch_all on purchase_order_item
  for all using (
    exists (
      select 1 from purchase_order po where po.id = purchase_order_item.po_id
        and po.branch_id = current_setting('app.branch_id', true)::uuid
    )
  )
  with check (
    exists (
      select 1 from purchase_order po where po.id = purchase_order_item.po_id
        and po.branch_id = current_setting('app.branch_id', true)::uuid
    )
  );

-- Supervisor/Owner bisa baca semua PO
create policy po_supervisor on purchase_order
  for select using (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code in ('inventory.supervisor', 'owner.all')
    )
  );

create policy po_item_supervisor on purchase_order_item
  for select using (
    exists (
      select 1 from user_permission up
      join permission p on p.id = up.permission_id
      where up.user_id = auth.uid()
        and p.code in ('inventory.supervisor', 'owner.all')
    )
  );

grant select, insert, update on purchase_order to authenticated;
grant select, insert, update on purchase_order_item to authenticated;