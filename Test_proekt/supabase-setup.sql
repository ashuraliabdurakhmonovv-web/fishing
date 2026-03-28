-- Supabase SQL Editor'ga shu skriptni to'liq qo'ying va RUN bosing.

create extension if not exists "pgcrypto";

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  credential text,
  "startTime" text,
  device text,
  status text,
  score integer default 0,
  ip text,
  webcam text,
  created_at timestamptz not null default now()
);

alter table public.logs enable row level security;

drop policy if exists "anon can read logs" on public.logs;
create policy "anon can read logs"
on public.logs
for select
to anon
using (true);

drop policy if exists "anon can insert logs" on public.logs;
create policy "anon can insert logs"
on public.logs
for insert
to anon
with check (true);

drop policy if exists "anon can update logs" on public.logs;
create policy "anon can update logs"
on public.logs
for update
to anon
using (true)
with check (true);

drop policy if exists "anon can delete logs" on public.logs;
create policy "anon can delete logs"
on public.logs
for delete
to anon
using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'logs'
  ) then
    alter publication supabase_realtime add table public.logs;
  end if;
end $$;
