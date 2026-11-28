-- TEL Điểm danh & Lương — database setup for Supabase
-- Everything for TEL lives in its own section ("schema") called tel, so it can share a Supabase project
-- with another app (e.g. Roll for Fluency) without either app touching the other's data.
--
-- Run this whole file once: SQL Editor → New query → paste → Run. Safe to run again later.
-- Then: Project Settings → API (Data API) → Exposed schemas → add  tel  → Save.

create schema if not exists tel;
grant usage on schema tel to authenticated;
revoke all on schema tel from anon, public;

-- 1) Owner (CEO) accounts. Added by seed.sql (kept out of the public repo):
--    insert into tel.owner(email) values (lower('you@example.com')) on conflict do nothing;
create table if not exists tel.owner (email text primary key);

-- 2) All TEL records. "col" is the record group (e.g. "teachers", "t/<user id>/lessons"), "id" the record key.
create table if not exists tel.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (col, id)
);
create index if not exists docs_col_idx on tel.docs (col);

-- 3) Guard: only TEL's own record groups can ever be stored here — for every user, the dashboard and server keys included.
alter table tel.docs drop constraint if exists docs_known_groups;
alter table tel.docs add constraint docs_known_groups check (
  col in ('teachers','holidays','pay','people','joins','names','students','fees','classes','lessons')
  or col ~ '^t/[A-Za-z0-9_-]+/(classes|lessons|bills)$'
  or col ~ '^slips/[A-Za-z0-9_-]+/months$'
);

-- 4) Who is signed in, for TEL only: 'ceo' (owner email) or the role given in TEL's "Phân quyền".
--    A sign-in account from another app in this project has no TEL role and sees nothing.
create or replace function tel.role() returns text
language sql stable security definer set search_path = tel, pg_temp as $$
  select case
    when exists (select 1 from tel.owner o where o.email = lower(coalesce(auth.jwt() ->> 'email',''))) then 'ceo'
    else (select case when d.data ->> 'role' in ('manager','reception','teacher') then d.data ->> 'role' end
          from tel.docs d where d.col = 'people' and d.id = auth.uid()::text)
  end
$$;

-- 5) Start-up check used by the website: proves it is talking to the TEL database, and says who you are here.
create or replace function tel.app_info() returns jsonb
language sql stable security definer set search_path = tel, pg_temp as $$
  select jsonb_build_object('app','tel','schema_version',2,'role',tel.role(),'is_owner',tel.role() = 'ceo')
$$;

-- 6) Read rules
create or replace function tel.can_read(c text, i text) returns boolean
language sql stable security definer set search_path = tel, pg_temp as $$
  select case
    when auth.uid() is null then false
    when tel.role() = 'ceo' then true
    when c = 'pay' then tel.role() = 'manager'                                   -- rates, bonuses, payments: CEO + manager
                     or (tel.role() = 'teacher' and (                               -- a teacher: only what their own pay needs
                          i = 'settings'
                          or i = 't_' || coalesce((select t.id from tel.docs t where t.col = 'teachers'
                                and t.data ->> 'name' = (select p.data ->> 'teacher' from tel.docs p
                                     where p.col = 'people' and p.id = auth.uid()::text) limit 1), '-')
                          or (i like 'c\_%' and exists (select 1 from tel.docs k
                                where k.col = 't/' || auth.uid()::text || '/classes' and k.id = substr(i, 3)))))
    when c like 't/%' then tel.role() in ('manager','reception')
                        or c like 't/' || auth.uid()::text || '/%'               -- teachers: only their own classes
    when c in ('teachers','holidays','names') then tel.role() is not null        -- only people with a TEL role
    when c in ('people','joins') then tel.role() in ('manager','reception') or i = auth.uid()::text
    when c in ('students','fees','classes','lessons') then tel.role() in ('manager','reception')
    when c like 'slips/%' then tel.role() = 'manager'
                            or c = 'slips/' || auth.uid()::text || '/months'     -- teachers: only their own payslips
    else false end
$$;

-- 7) Write rules (add, change, delete)
create or replace function tel.can_write(c text, i text) returns boolean
language sql stable security definer set search_path = tel, pg_temp as $$
  select case
    when auth.uid() is null then false
    when tel.role() = 'ceo' then true
    when c = 'pay' then tel.role() = 'manager' and (i like 'b\_%' or i like 'p\_%')   -- manager: bonuses + paid marks, not rates/settings
    when c like 't/%' then tel.role() in ('manager','reception')
                        or (tel.role() = 'teacher' and c like 't/' || auth.uid()::text || '/%')
    when c in ('teachers','holidays','students','fees','classes','lessons') then tel.role() in ('manager','reception')
    when c = 'people' then tel.role() = 'manager'
    when c in ('joins','names') then i = auth.uid()::text                         -- anyone signing up through the TEL site
    when c like 'slips/%' then tel.role() = 'manager'
    else false end
$$;

alter table tel.docs enable row level security;
alter table tel.owner enable row level security;
drop policy if exists docs_read on tel.docs;
drop policy if exists docs_insert on tel.docs;
drop policy if exists docs_update on tel.docs;
drop policy if exists docs_delete on tel.docs;
create policy docs_read   on tel.docs for select to authenticated using (tel.can_read(col, id));
create policy docs_insert on tel.docs for insert to authenticated with check (tel.can_write(col, id));
create policy docs_update on tel.docs for update to authenticated using (tel.can_write(col, id)) with check (tel.can_write(col, id));
create policy docs_delete on tel.docs for delete to authenticated using (tel.can_write(col, id));

revoke all on tel.docs, tel.owner from anon, public;
grant select, insert, update, delete on tel.docs to authenticated;
revoke all on all functions in schema tel from public, anon;
grant execute on function tel.role(), tel.app_info(), tel.can_read(text,text), tel.can_write(text,text) to authenticated;

-- keep updated_at / updated_by current
create or replace function tel.docs_touch() returns trigger language plpgsql set search_path = tel, pg_temp as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists docs_touch on tel.docs;
create trigger docs_touch before insert or update on tel.docs for each row execute function tel.docs_touch();

-- 8) Live updates
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'tel' and tablename = 'docs') then
    alter publication supabase_realtime add table tel.docs;
  end if;
end $$;

-- 9) If an earlier TEL setup put tables in the shared "public" section, move their records over (then they can be dropped).
do $$ begin
  if to_regclass('public.tel_docs') is not null then
    insert into tel.docs(col,id,data) select col,id,data from public.tel_docs on conflict do nothing;
  end if;
  if to_regclass('public.tel_owner') is not null then
    insert into tel.owner(email) select email from public.tel_owner on conflict do nothing;
  end if;
end $$;
