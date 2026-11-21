create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table private.staff_login_identities (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  username_normalized text not null unique,
  auth_email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_login_username_format check (username_normalized ~ '^[a-z0-9._-]{3,64}$')
);
alter table private.staff_login_identities enable row level security;
revoke all on private.staff_login_identities from public, anon, authenticated;
grant select on private.staff_login_identities to service_role;

create table private.staff_login_rate_limits (
  dimension text not null check (dimension in ('username','source')),
  subject_hash bytea not null,
  window_started_at timestamptz not null,
  attempts integer not null default 0,
  blocked_until timestamptz,
  primary key (dimension, subject_hash)
);
alter table private.staff_login_rate_limits enable row level security;
revoke all on private.staff_login_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on private.staff_login_rate_limits to service_role;

create table private.staff_login_rate_limit_secret (
  singleton boolean primary key default true check (singleton),
  secret bytea not null
);
insert into private.staff_login_rate_limit_secret(singleton, secret)
values (true, extensions.gen_random_bytes(32));

create or replace function public.poc_consume_staff_login_attempt(
  p_username text,
  p_source text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret bytea;
  v_username_hash bytea;
  v_source_hash bytea;
  v_now timestamptz := clock_timestamp();
  v_allowed boolean := true;
  v_item record;
begin
  if p_username is null or length(p_username) > 64 or p_source is null or length(p_source) > 128 then
    return false;
  end if;
  select secret into v_secret from private.staff_login_rate_limit_secret where singleton = true;
  v_username_hash := extensions.hmac(convert_to(lower(trim(p_username)), 'UTF8'), v_secret, 'sha256');
  v_source_hash := extensions.hmac(convert_to(p_source, 'UTF8'), v_secret, 'sha256');

  for v_item in
    select * from (values
      ('username'::text, v_username_hash, 5, interval '15 minutes'),
      ('source'::text, v_source_hash, 20, interval '15 minutes')
    ) as limits(dimension, subject_hash, max_attempts, window_size)
  loop
    insert into private.staff_login_rate_limits(dimension, subject_hash, window_started_at, attempts, blocked_until)
    values (v_item.dimension, v_item.subject_hash, v_now, 1, null)
    on conflict (dimension, subject_hash) do update
      set window_started_at = case
            when private.staff_login_rate_limits.window_started_at + v_item.window_size <= v_now
              then v_now else private.staff_login_rate_limits.window_started_at end,
          attempts = case
            when private.staff_login_rate_limits.window_started_at + v_item.window_size <= v_now
              then 1 else private.staff_login_rate_limits.attempts + 1 end,
          blocked_until = case
            when private.staff_login_rate_limits.window_started_at + v_item.window_size <= v_now
              then null
            when private.staff_login_rate_limits.attempts + 1 >= v_item.max_attempts
              then v_now + v_item.window_size
            else private.staff_login_rate_limits.blocked_until end;

    if exists (
      select 1 from private.staff_login_rate_limits
      where dimension = v_item.dimension and subject_hash = v_item.subject_hash
        and (blocked_until > v_now or attempts > v_item.max_attempts)
    ) then
      v_allowed := false;
    end if;
  end loop;
  return v_allowed;
end;
$$;

create or replace function public.poc_reset_staff_login_attempts(
  p_username text,
  p_source text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret bytea;
begin
  select secret into v_secret from private.staff_login_rate_limit_secret where singleton = true;
  delete from private.staff_login_rate_limits
  where (dimension = 'username' and subject_hash = extensions.hmac(convert_to(lower(trim(p_username)), 'UTF8'), v_secret, 'sha256'))
     or (dimension = 'source' and subject_hash = extensions.hmac(convert_to(p_source, 'UTF8'), v_secret, 'sha256'));
end;
$$;

create or replace function public.poc_lookup_staff_login_identity(p_username text)
returns table(auth_email text, is_active boolean)
language sql
security definer
set search_path = ''
as $$
  select i.auth_email, i.is_active
  from private.staff_login_identities i
  where i.username_normalized = lower(trim(p_username))
  limit 1;
$$;

revoke all on function public.poc_consume_staff_login_attempt(text,text) from public, anon, authenticated;
revoke all on function public.poc_reset_staff_login_attempts(text,text) from public, anon, authenticated;
revoke all on function public.poc_lookup_staff_login_identity(text) from public, anon, authenticated;
grant execute on function public.poc_consume_staff_login_attempt(text,text) to service_role;
grant execute on function public.poc_reset_staff_login_attempts(text,text) to service_role;
grant execute on function public.poc_lookup_staff_login_identity(text) to service_role;
