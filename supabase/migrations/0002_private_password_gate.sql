-- Rank Orbit · switch to a private, password-gated site.
--
-- The browser no longer talks to Supabase. All data access goes through the site's server
-- functions, which check the password session and use the service role key (server-only).
-- This migration removes every path for the anon / authenticated roles:
--   * RLS stays ON with NO policies, so anon/authenticated rows are always denied.
--   * Table and function privileges are revoked from anon and authenticated.
--   * The logos bucket is private with no storage policies (service role only).
-- The service_role bypasses RLS and is the only role that can read or write data.

-- Storage policies that referenced is_staff()
drop policy if exists logos_staff_select on storage.objects;
drop policy if exists logos_staff_insert on storage.objects;
drop policy if exists logos_staff_update on storage.objects;
drop policy if exists logos_staff_delete on storage.objects;

-- Table policies and the staff model
drop policy if exists clients_staff_all on public.clients;
drop policy if exists months_staff_all on public.months;
drop policy if exists staff_self_select on public.staff;
drop function if exists public.is_staff();
drop table if exists public.staff;

alter table public.clients enable row level security;
alter table public.months enable row level security;
alter table public.clients force row level security;
alter table public.months force row level security;

revoke all on public.clients, public.months from anon, authenticated;

-- Failed password attempts (rate limiting, written by the server only)
create table if not exists public.login_attempts (
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_ip_at_idx on public.login_attempts (ip, at);
alter table public.login_attempts enable row level security;
alter table public.login_attempts force row level security;
revoke all on public.login_attempts from anon, authenticated;

grant select, insert, update, delete on public.clients, public.months, public.login_attempts to service_role;

-- Logos: private bucket, no policies => only the service role can access objects.
update storage.buckets set public = false where id = 'logos';

-- Nothing in the public schema should be callable by anon/authenticated by default.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
