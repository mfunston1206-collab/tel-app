-- TEL Điểm danh & Lương — database setup for Supabase
-- Run this whole file once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again later (it updates rules without deleting data).

-- 1) The owner (CEO) list. Add your sign-in email once (kept out of this public file):
--    insert into public.app_owner(email) values (lower('you@example.com')) on conflict do nothing;
create table if not exists public.app_owner (email text primary key);

-- 2) All app records live in one table. "col" is the record group (e.g. "teachers", "t/<key>/lessons"), "id" the record key.
create table if not exists public.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (col, id)
);
create index if not exists docs_col_idx on public.docs (col);

-- 3) Who is signed in: 'ceo' (owner email), or the role the CEO/manager gave them in "Phân quyền".
create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.app_owner o where o.email = lower(coalesce(auth.jwt() ->> 'email',''))) then 'ceo'
    else (select case when d.data ->> 'role' in ('manager','reception','teacher') then d.data ->> 'role' end
          from public.docs d where d.col = 'people' and d.id = auth.uid()::text)
  end
$$;
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$ select public.app_role() = 'ceo' $$;

-- 4) Read rules
create or replace function public.can_read(c text, i text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is null then false
    when public.app_role() = 'ceo' then true
    when c = 'pay' then public.app_role() = 'manager'                                   -- rates, bonuses, payments: CEO + manager
    when c like 't/%' then public.app_role() in ('manager','reception')
                        or c like 't/' || auth.uid()::text || '/%'                      -- teachers: only their own classes
    when c in ('teachers','holidays','names') then true
    when c in ('people','joins') then public.app_role() in ('manager','reception') or i = auth.uid()::text
    when c in ('students','fees','classes','lessons') then public.app_role() in ('manager','reception')
    when c like 'slips/%' then public.app_role() = 'manager'
                            or c = 'slips/' || auth.uid()::text || '/months'            -- teachers: only their own payslips
    else false end
$$;

-- 5) Write rules (add, change, delete)
create or replace function public.can_write(c text, i text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is null then false
    when public.app_role() = 'ceo' then true
    when c = 'pay' then public.app_role() = 'manager' and (i like 'b\_%' or i like 'p\_%')   -- manager: bonuses + paid/adjustments, not rates or settings
    when c like 't/%' then public.app_role() in ('manager','reception')
                        or (public.app_role() = 'teacher' and c like 't/' || auth.uid()::text || '/%')
    when c in ('teachers','holidays','students','fees','classes','lessons') then public.app_role() in ('manager','reception')
    when c = 'people' then public.app_role() = 'manager'
    when c in ('joins','names') then i = auth.uid()::text
    when c like 'slips/%' then public.app_role() = 'manager'
    else false end
$$;

alter table public.docs enable row level security;
alter table public.app_owner enable row level security;
drop policy if exists docs_read on public.docs;
drop policy if exists docs_insert on public.docs;
drop policy if exists docs_update on public.docs;
drop policy if exists docs_delete on public.docs;
create policy docs_read   on public.docs for select to authenticated using (public.can_read(col, id));
create policy docs_insert on public.docs for insert to authenticated with check (public.can_write(col, id));
create policy docs_update on public.docs for update to authenticated using (public.can_write(col, id)) with check (public.can_write(col, id));
create policy docs_delete on public.docs for delete to authenticated using (public.can_write(col, id));

revoke all on public.docs from anon;
grant select, insert, update, delete on public.docs to authenticated;
grant execute on function public.is_owner() to authenticated;

-- keep updated_at / updated_by current
create or replace function public.docs_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before insert or update on public.docs for each row execute function public.docs_touch();

-- 6) Live updates: every open screen sees changes straight away
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'docs') then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;
