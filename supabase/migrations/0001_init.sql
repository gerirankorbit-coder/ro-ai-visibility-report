-- Rank Orbit · AI Visibility Dashboard
-- Initial schema, RLS and public report RPC.

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

create table if not exists public.share_links (
  token text primary key,              -- 24+ char random, url-safe
  client_id uuid references public.clients(id) on delete cascade,
  created_at timestamptz default now(),
  revoked_at timestamptz,
  last_viewed_at timestamptz,
  constraint share_links_token_format check (token ~ '^[A-Za-z0-9_-]{24,128}$')
);

create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text default 'editor'
);

create index if not exists months_client_period_idx on public.months (client_id, period);
create index if not exists share_links_client_idx on public.share_links (client_id);

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
-- Row level security: only staff can touch clients, months and share links.
-- Anonymous users have no direct table access at all.
-- ---------------------------------------------------------------------------

alter table public.clients enable row level security;
alter table public.months enable row level security;
alter table public.share_links enable row level security;
alter table public.staff enable row level security;

revoke all on public.clients, public.months, public.share_links, public.staff from anon;
grant select, insert, update, delete on public.clients, public.months, public.share_links to authenticated;
grant select on public.staff to authenticated;

drop policy if exists clients_staff_all on public.clients;
create policy clients_staff_all on public.clients
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists months_staff_all on public.months;
create policy months_staff_all on public.months
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists share_links_staff_all on public.share_links;
create policy share_links_staff_all on public.share_links
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Staff can see their own membership row (used by the admin login check).
drop policy if exists staff_self_select on public.staff;
create policy staff_self_select on public.staff
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Public report RPC
-- Validates the token, records the view and returns the client + published months.
-- Returns NULL for unknown or revoked tokens (the app shows "This link is no longer active").
-- logo_url is filled in by the `report` Edge Function (signed URL, 1 hour).
-- ---------------------------------------------------------------------------

create or replace function public.get_report(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_result jsonb;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{24,128}$' then
    return null;
  end if;

  update public.share_links
     set last_viewed_at = now()
   where token = p_token
     and revoked_at is null
  returning client_id into v_client_id;

  if v_client_id is null then
    return null;
  end if;

  select jsonb_build_object(
           'client', jsonb_build_object(
             'id', c.id,
             'name', c.name,
             'category', c.category,
             'address', c.address,
             'locality', c.locality,
             'phone', c.phone,
             'website', c.website,
             'services', coalesce(to_jsonb(c.services), '[]'::jsonb),
             'brand_color', c.brand_color,
             'logo_path', c.logo_path,
             'logo_url', null,
             'client_since', c.client_since,
             'hours', c.hours
           ),
           'months', coalesce((
             select jsonb_agg(
                      jsonb_build_object(
                        'id', m.id,
                        'client_id', m.client_id,
                        'period', to_char(m.period, 'YYYY-MM-DD'),
                        'published', m.published,
                        'nap', m.nap,
                        'entity', m.entity,
                        'schema_cov', m.schema_cov,
                        'knowledge', m.knowledge,
                        'mentions', m.mentions,
                        'nap_fields', m.nap_fields,
                        'entity_parts', m.entity_parts,
                        'engines', m.engines,
                        'work', m.work,
                        'sources', m.sources,
                        'forum', m.forum,
                        'note', m.note,
                        'updated_at', m.updated_at
                      )
                      order by m.period
                    )
               from public.months m
              where m.client_id = c.id
                and m.published
           ), '[]'::jsonb)
         )
    into v_result
    from public.clients c
   where c.id = v_client_id;

  return v_result;
end;
$$;

revoke all on function public.get_report(text) from public;
grant execute on function public.get_report(text) to anon, authenticated, service_role;

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
