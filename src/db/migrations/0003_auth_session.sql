-- Migrasi 0003 PETORA: sesi aplikasi lokal (auth tanpa Supabase, K-009).
--
-- Token sesi tidak disimpan mentah: hanya hash SHA-256 (hex) disimpan; token asli
-- hanya ada di cookie HttpOnly peramban.查表 token = hash(cookie). Idempoten.

-- Kredensial lokal (password_hash scrypt) untuk login tanpa Supabase Auth (K-009).
-- Format: "scrypt$<salt-hex>$<hash-hex>".
alter table profiles add column if not exists email text;
alter table profiles add column if not exists password_hash text;
create unique index if not exists idx_profile_email on profiles (lower(email)) where email is not null;

create table if not exists app_session (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  token_hash   char(64) not null unique,          -- sha256(token) dalam hex (64 char)
  expires_at   timestamptz not null,
  revoked_at   timestamptz,                        -- null = aktif
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_session_user on app_session(user_id) where revoked_at is null;
create index if not exists idx_session_expiry on app_session(expires_at);

-- Kebijakan akses: TIDAK ada policy SELECT/INSERT untuk `authenticated` — tabel ini
-- hanya boleh diakses oleh service (superuser) & fungsi security definer. RLS aktif
-- dengan deny-by-default (tidak ada policy = tidak boleh akses via RLS).

alter table app_session enable row level security;
revoke all on app_session from anon, authenticated;

-- auth.current_app_user(): baca app.user_id (string) -> uuid, dipakai helper route.
create or replace function public.auth_current_app_user()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;