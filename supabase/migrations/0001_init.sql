-- Rank Orbit · AI Visibility Dashboard
-- Initial schema, RLS and private logo storage. Staff-only: there is no public access.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text, address text, locality text, phone text, website text,
  services text[] default '{}',
  brand_color text default '#0A0A0A',
  logo_path text,                      -- Supabase Storage path, bucket "logos"
  client_since date,
  hours jsonb not null default '[]',   -- [{day:'Mon',open:'7:00 AM',close:'7:00 PM',closed:false}, ...7]
  created_at timestamptz default now()
);

create table if not exists public.months (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  period date not null,                -- first day of month
  published boolean not null default false,
  nap int, entity int, schema_cov int, knowledge int, mentions int,
  nap_fields jsonb,      -- {name,address,phone,hours,website}
  entity_parts jsonb,    -- {schema,sameAs,kg,reviews,mentions,topical}
  engines jsonb,         -- {aio,chatgpt,perplexity,gemini,copilot}
  work jsonb,            -- {nap,entity,schema,content}
  sources jsonb,         -- [{name,status:'verified'|'synced'|'progress'|'queued',updated_at}]
  forum jsonb,           -- {rCreated,rWarming,rActive,rKarma,rCommunities,qProfiles,qActive,fProfiles,fActive,weekly:[4],phase:1-4,authority}
  note text,
  updated_at timestamptz default now(),
  unique (client_id, period),
  constraint months_period_first_day check (extract(day from period) = 1),
  constraint months_pct_range check (
    (nap is null or nap between 0 and 100) and
    (entity is null or entity between 0 and 100) and
    (schema_cov is null or schema_cov between 0 and 100) and
    (knowledge is null or knowledge between 0 and 100) and
    (mentions is null or mentions >= 0)
  )
);

create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text default 'editor'
);

create index if not exists months_client_period_idx on public.months (client_id, period);

-- ---------------------------------------------------------------------------
-- Staff check (security definer so it can read `staff` under RLS)
-- ---------------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff s where s.user_id = auth.uid());
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security: only staff can touch clients and months.
-- Anonymous users have no direct table access at all.
-- ---------------------------------------------------------------------------

alter table public.clients enable row level security;
alter table public.months enable row level security;
alter table public.staff enable row level security;

revoke all on public.clients, public.months, public.staff from anon;
grant select, insert, update, delete on public.clients, public.months to authenticated;
grant select on public.staff to authenticated;

drop policy if exists clients_staff_all on public.clients;
create policy clients_staff_all on public.clients
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists months_staff_all on public.months;
create policy months_staff_all on public.months
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Staff can see their own membership row (used by the admin login check).
drop policy if exists staff_self_select on public.staff;
create policy staff_self_select on public.staff
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: private "logos" bucket, staff-only access.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', false, 2097152, array['image/png', 'image/svg+xml'])
on conflict (id) do update set public = false;

drop policy if exists logos_staff_select on storage.objects;
create policy logos_staff_select on storage.objects
  for select to authenticated
  using (bucket_id = 'logos' and public.is_staff());

drop policy if exists logos_staff_insert on storage.objects;
create policy logos_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and public.is_staff());

drop policy if exists logos_staff_update on storage.objects;
create policy logos_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and public.is_staff());

drop policy if exists logos_staff_delete on storage.objects;
create policy logos_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and public.is_staff());
