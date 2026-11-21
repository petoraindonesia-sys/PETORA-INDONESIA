/**
 * Migrasi 0004: Portal pemilik hewan (BR-015, BR-019).
 *
 * Menambahkan tabel portal_user untuk akun pemilik hewan yang terpisah dari staff.
 * Setiap portal_user terhubung ke satu customer (pelanggan) via customer_id.
 * Klinik mengundang/verifikasi lalu membuat akun portal untuk pemilik.
 */
-- Enable citext for case-insensitive email
create extension if not exists citext;

-- Tabel pengguna portal (pemilik hewan)
create table if not exists portal_user (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer(id) on delete cascade,
  email citext not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_portal_user_customer on portal_user(customer_id);

-- Sesi portal (terpisah dari app_session staff)
create table if not exists portal_session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references portal_user(id) on delete cascade,
  token_hash char(64) not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_portal_session_user on portal_session(user_id);
create index if not exists idx_portal_session_token on portal_session(token_hash);

-- RLS untuk portal_user
alter table portal_user enable row level security;

-- Portal user hanya bisa melihat datanya sendiri (via auth.uid() yang di-set ke portal_user.id)
create policy portal_user_self on portal_user
  for select using (
    id = auth.uid()
  );

-- Portal user bisa update profil sendiri (password, dll)
create policy portal_user_update_self on portal_user
  for update using (
    id = auth.uid()
  )
  with check (
    id = auth.uid()
  );

-- RLS untuk portal_session
alter table portal_session enable row level security;

create policy portal_session_self on portal_session
  for all using (
    user_id = auth.uid()
  )
  with check (
    user_id = auth.uid()
  );

-- RLS untuk customer: portal user bisa baca customer mereka sendiri
create policy customer_portal_read on customer
  for select using (
    exists (
      select 1 from portal_user pu where pu.id = auth.uid() and pu.customer_id = customer.id
    )
  );

-- RLS untuk pet: portal user bisa baca hewan milik customer mereka
create policy pet_portal_read on pet
  for select using (
    exists (
      select 1 from portal_user pu
      join customer c on c.id = pu.customer_id
      where pu.id = auth.uid() and pet.customer_id = c.id
    )
  );

-- RLS untuk medical_record: portal user bisa baca rekam medis hewan mereka
-- HANYA yang status='final' DAN shared=true (BR-005)
create policy medical_record_portal_read on medical_record
  for select using (
    exists (
      select 1 from portal_user pu
      join customer c on c.id = pu.customer_id
      join pet p on p.customer_id = c.id
      where pu.id = auth.uid() and medical_record.pet_id = p.id
        and medical_record.status = 'final'
        and medical_record.shared = true
    )
  );

-- RLS untuk invoice: portal user bisa baca tagihan hewan/customer mereka
create policy invoice_portal_read on invoice
  for select using (
    exists (
      select 1 from portal_user pu
      where pu.id = auth.uid()
        and (
          invoice.customer_id = pu.customer_id
          or invoice.pet_id in (select id from pet where customer_id = pu.customer_id)
        )
    )
  );

-- RLS untuk product: portal user bisa baca katalog (read-only)
create policy product_portal_read on product
  for select using (
    exists (select 1 from portal_user pu where pu.id = auth.uid())
  );

-- Grant ke role authenticated (portal user juga pakai role authenticated)
grant select on portal_user to authenticated;
grant select, insert, update on portal_session to authenticated;