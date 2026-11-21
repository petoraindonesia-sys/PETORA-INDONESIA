create table public.poc_staff_rls_probe (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  marker text not null
);
alter table public.poc_staff_rls_probe enable row level security;
revoke all on public.poc_staff_rls_probe from public;
grant select on public.poc_staff_rls_probe to anon, authenticated;
create policy poc_staff_rls_probe_select_own
  on public.poc_staff_rls_probe
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
insert into public.poc_staff_rls_probe(user_id, marker)
values
  ('11111111-1111-4111-8111-111111111111', 'user-a'),
  ('22222222-2222-4222-8222-222222222222', 'user-b');
