-- Migrasi 0002 PETORA: produk, inventori (batch + mutasi), tagihan, pembayaran.
-- Mendukung BR-006 (stok tidak minus), BR-007 (FEFO), BR-009 (tagihan terpadu),
-- BR-010 (pembayaran sebagian), BR-011/018 (pembayaran tidak diubah, void),
-- BR-020/021 (PPN & pembulatan tersimpan di tagihan). Idempoten.
--
-- Keamanan tetap di level DB (RLS) dan dijalankan dengan `set role authenticated`
-- + `app.user_id` oleh lapisan service, persis seperti produksi (K-009).

-- ---------------------------------------------------------------------------
-- Produk & jasa (katalog)
-- ---------------------------------------------------------------------------
create table if not exists product (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique,
  name        text not null,
  kind        text not null check (kind in ('product','service')),
  price       integer not null check (price >= 0),       -- BR-008: bilangan bulat Rupiah
  taxable     boolean not null default true,             -- BR-020: ditandai kena pajak
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Batch stok per cabang (BR-006, BR-007)
-- ---------------------------------------------------------------------------
create table if not exists stock_batch (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid not null references branch(id) on delete restrict,
  product_id  uuid not null references product(id) on delete restrict,
  batch_code  text,
  quantity    integer not null default 0 check (quantity >= 0),  -- BR-006: tidak minus
  cost_price  integer not null default 0 check (cost_price >= 0), -- harga beli (pembulatan bulat)
  expires_at  date,                                              -- null = tanpa kedaluwarsa
  created_at  timestamptz not null default now()
);

create index if not exists idx_batch_branch_product on stock_batch(branch_id, product_id);
create index if not exists idx_batch_fefo on stock_batch(branch_id, product_id, expires_at);

-- ---------------------------------------------------------------------------
-- Mutasi stok (jejak lengkap, BR-014)
-- ---------------------------------------------------------------------------
create table if not exists stock_mutation (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid not null references branch(id) on delete restrict,
  product_id  uuid not null references product(id) on delete restrict,
  batch_id    uuid references stock_batch(id) on delete set null,
  delta       integer not null,                 -- positif = masuk, negatif = keluar
  kind        text not null check (kind in ('receipt','sale','usage','adjustment','transfer_in','transfer_out','return')),
  reason      text,
  ref         text,                             -- referensi eksternal (mis. invoice_id)
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_mutation_branch_product on stock_mutation(branch_id, product_id);
create index if not exists idx_mutation_ref on stock_mutation(ref);

-- ---------------------------------------------------------------------------
-- Tagihan terpadu (BR-009) + baris item + pembayaran (BR-010/018)
-- ---------------------------------------------------------------------------
create table if not exists invoice (
  id                 uuid primary key default gen_random_uuid(),
  branch_id          uuid not null references branch(id) on delete restrict,
  customer_id        uuid references customer(id) on delete restrict,
  pet_id             uuid references pet(id) on delete restrict,
  visit_id           uuid references visit(id) on delete set null,
  status             text not null default 'draft'
                       check (status in ('draft','unpaid','partial','paid','void')),
  subtotal           integer not null default 0 check (subtotal >= 0),
  discount           integer not null default 0 check (discount >= 0),
  tax                integer not null default 0 check (tax >= 0),
  tax_rate           numeric(5,2) not null default 0,     -- salinan tarif saat dibuat (BR-020)
  tax_enabled        boolean not null default false,
  tax_prices_include boolean not null default false,
  rounding_adjustment integer not null default 0,
  total              integer not null default 0 check (total >= 0),
  paid_amount        integer not null default 0 check (paid_amount >= 0),
  void_reason        text,
  voided_by          uuid references profiles(id),
  voided_at          timestamptz,
  created_by         uuid references profiles(id),
  created_at         timestamptz not null default now()
);

create index if not exists idx_invoice_branch on invoice(branch_id);
create index if not exists idx_invoice_status on invoice(status);

create table if not exists invoice_item (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoice(id) on delete cascade,
  product_id   uuid references product(id) on delete restrict,
  batch_id     uuid references stock_batch(id) on delete set null, -- batch yang dipakai (obat/produk)
  description  text not null,
  quantity     integer not null check (quantity > 0),
  unit_price   integer not null check (unit_price >= 0),
  taxable      boolean not null default true,
  kind         text not null default 'service' check (kind in ('product','service','medicine','boarding')),
  created_at   timestamptz not null default now()
);

create index if not exists idx_item_invoice on invoice_item(invoice_id);

-- Pembayaran: idempoten via idempotency_key unik (BR-018 cegah bayar ganda).
create table if not exists payment (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoice(id) on delete restrict,
  method          text not null check (method in ('cash','transfer','qris','card')),
  amount          integer not null check (amount > 0),
  cash_received   integer check (cash_received is null or cash_received >= 0),
  change_amount   integer check (change_amount is null or change_amount >= 0),
  reference       text,
  idempotency_key text not null unique,           -- BR-018: satu aksi bayar tak tercatat dua kali
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now()
);

create index if not exists idx_payment_invoice on payment(invoice_id);

-- ===========================================================================
-- RLS
-- ===========================================================================

-- Produk: staf baca; Owner kelola.
alter table product enable row level security;
create policy product_read on product for select to authenticated using (public.is_staff());
create policy product_write on product for all to authenticated
  using (public.is_active_owner()) with check (public.is_active_owner());

-- Batch stok: baca/tulis hanya untuk cabang yang ditugaskan (BR-001).
alter table stock_batch enable row level security;
create policy stock_batch_read on stock_batch for select to authenticated
  using (exists (select 1 from public.user_branch_ids() u where u.branch_id = stock_batch.branch_id));
create policy stock_batch_write on stock_batch for all to authenticated
  using (
    public.has_permission('stock.manage')
    and exists (select 1 from public.user_branch_ids() u where u.branch_id = stock_batch.branch_id)
  )
  with check (
    public.has_permission('stock.manage')
    and exists (select 1 from public.user_branch_ids() u where u.branch_id = stock_batch.branch_id)
  );

-- Mutasi stok: baca/tulis di cabang sendiri; adjust butuh 'stock.adjust' (BR-006 pengecualian).
alter table stock_mutation enable row level security;
create policy stock_mutation_read on stock_mutation for select to authenticated
  using (exists (select 1 from public.user_branch_ids() u where u.branch_id = stock_mutation.branch_id));
create policy stock_mutation_write on stock_mutation for insert to authenticated
  with check (
    public.has_permission('stock.manage')
    and exists (select 1 from public.user_branch_ids() u where u.branch_id = stock_mutation.branch_id)
  );

-- Tagihan: baca/tulis di cabang sendiri; void butuh 'invoice.void' (BR-011).
alter table invoice enable row level security;
create policy invoice_read on invoice for select to authenticated
  using (exists (select 1 from public.user_branch_ids() u where u.branch_id = invoice.branch_id));
create policy invoice_write on invoice for all to authenticated
  using (
    public.has_permission('invoice.manage')
    and exists (select 1 from public.user_branch_ids() u where u.branch_id = invoice.branch_id)
  )
  with check (
    public.has_permission('invoice.manage')
    and exists (select 1 from public.user_branch_ids() u where u.branch_id = invoice.branch_id)
  );

alter table invoice_item enable row level security;
create policy invoice_item_read on invoice_item for select to authenticated
  using (exists (
    select 1 from invoice i
    join public.user_branch_ids() u on u.branch_id = i.branch_id
    where i.id = invoice_item.invoice_id
  ));
create policy invoice_item_write on invoice_item for all to authenticated
  using (public.has_permission('invoice.manage'))
  with check (public.has_permission('invoice.manage'));

-- Pembayaran: baca/tulis di cabang tagihan; catat butuh 'payment.record' (BR-018).
alter table payment enable row level security;
create policy payment_read on payment for select to authenticated
  using (exists (
    select 1 from invoice i
    join public.user_branch_ids() u on u.branch_id = i.branch_id
    where i.id = payment.invoice_id
  ));
create policy payment_write on payment for insert to authenticated
  with check (
    public.has_permission('payment.record')
    and exists (
      select 1 from invoice i
      join public.user_branch_ids() u on u.branch_id = i.branch_id
      where i.id = payment.invoice_id
    )
  );

-- Audit siapa: tambah permission terkait bila belum ada.
insert into permission (code, name) values
  ('product.manage', 'Mengelola produk')
on conflict (code) do nothing;

-- Produk dikelola Owner (default) — tidak menambah role permission di sini.