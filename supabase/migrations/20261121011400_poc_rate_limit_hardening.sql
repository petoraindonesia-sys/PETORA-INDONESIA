alter table private.staff_login_rate_limit_secret enable row level security;
revoke all on private.staff_login_rate_limit_secret from public, anon, authenticated;
grant select on private.staff_login_rate_limit_secret to service_role;

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
  -- A successful user must not reset the shared source/IP bucket.
  delete from private.staff_login_rate_limits
  where dimension = 'username'
    and subject_hash = extensions.hmac(convert_to(lower(trim(p_username)), 'UTF8'), v_secret, 'sha256');
end;
$$;
revoke all on function public.poc_reset_staff_login_attempts(text,text) from public, anon, authenticated;
grant execute on function public.poc_reset_staff_login_attempts(text,text) to service_role;
