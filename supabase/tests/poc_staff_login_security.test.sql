-- POC-only database security checks. Run against the isolated petora-auth-poc-free project.
-- The transaction is rolled back so the rate-limit test data is not retained.

begin;

do $$
declare
  v_allowed boolean;
  v_allowed_count integer := 0;
  v_denied_count integer := 0;
  i integer;
begin
  if has_function_privilege('anon', 'public.poc_consume_staff_login_attempt(text,text)', 'EXECUTE') then
    raise exception 'anon must not execute the rate-limit RPC';
  end if;
  if has_function_privilege('authenticated', 'public.poc_consume_staff_login_attempt(text,text)', 'EXECUTE') then
    raise exception 'authenticated must not execute the rate-limit RPC';
  end if;
  if not has_function_privilege('service_role', 'public.poc_consume_staff_login_attempt(text,text)', 'EXECUTE') then
    raise exception 'service_role must execute the rate-limit RPC';
  end if;

  for i in 1..6 loop
    v_allowed := public.poc_consume_staff_login_attempt('sql-test-user', 'sql-test-source');
    if v_allowed then v_allowed_count := v_allowed_count + 1;
    else v_denied_count := v_denied_count + 1;
    end if;
  end loop;

  if v_allowed_count <> 4 or v_denied_count <> 2 then
    raise exception 'username limit mismatch: allowed %, denied %', v_allowed_count, v_denied_count;
  end if;
end $$;

do $$
declare
  v_allowed boolean;
  i integer;
  v_allowed_count integer := 0;
begin
  for i in 1..20 loop
    v_allowed := public.poc_consume_staff_login_attempt('sql-source-user-' || i::text, 'sql-source-limit');
    if v_allowed then v_allowed_count := v_allowed_count + 1; end if;
  end loop;
  if v_allowed_count <> 19 then
    raise exception 'source limit mismatch: expected 19 allowed, got %', v_allowed_count;
  end if;
  if public.poc_consume_staff_login_attempt('sql-source-user-21', 'sql-source-limit') then
    raise exception 'source limit must deny the next request';
  end if;
end $$;

do $$
declare
  v_secret bytea;
  v_username_hash bytea;
  v_source_hash bytea;
begin
  perform public.poc_consume_staff_login_attempt('sql-reset-user', 'sql-reset-source');
  perform public.poc_reset_staff_login_attempts('sql-reset-user', 'sql-reset-source');
  select secret into v_secret from private.staff_login_rate_limit_secret where singleton;
  v_username_hash := extensions.hmac(convert_to('sql-reset-user','UTF8'),v_secret,'sha256');
  v_source_hash := extensions.hmac(convert_to('sql-reset-source','UTF8'),v_secret,'sha256');
  if exists (select 1 from private.staff_login_rate_limits where dimension='username' and subject_hash=v_username_hash) then
    raise exception 'successful login reset must clear username bucket';
  end if;
  if not exists (select 1 from private.staff_login_rate_limits where dimension='source' and subject_hash=v_source_hash) then
    raise exception 'successful login reset must preserve shared source bucket';
  end if;
end $$;

set local role anon;
do $$
begin
  if (select count(*) from public.poc_staff_rls_probe) <> 0 then
    raise exception 'anon must not read RLS probe rows';
  end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$
begin
  if (select count(*) from public.poc_staff_rls_probe) <> 1 then
    raise exception 'user A must read exactly their own row';
  end if;
  if not exists (select 1 from public.poc_staff_rls_probe where marker='user-a') then
    raise exception 'user A own row missing';
  end if;
  if exists (select 1 from public.poc_staff_rls_probe where marker='user-b') then
    raise exception 'user A must not read user B row';
  end if;
end $$;

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$
begin
  if (select count(*) from public.poc_staff_rls_probe) <> 1 then
    raise exception 'user B must read exactly their own row';
  end if;
  if not exists (select 1 from public.poc_staff_rls_probe where marker='user-b') then
    raise exception 'user B own row missing';
  end if;
  if exists (select 1 from public.poc_staff_rls_probe where marker='user-a') then
    raise exception 'user B must not read user A row';
  end if;
end $$;
reset role;

rollback;
