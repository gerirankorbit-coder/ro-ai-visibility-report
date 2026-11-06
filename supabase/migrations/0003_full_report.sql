-- Rank Orbit · full GMB + AI report.
-- Adds per-month report content, the shared monthly Google update note, and a private
-- bucket for report screenshots. Same lockdown as 0002: only the service role has access.

alter table public.months add column if not exists gmb jsonb not null default '{}'::jsonb;

create table if not exists public.report_notes (
  period date primary key,
  title text not null default 'Google Core Update',
  image_path text,
  body text not null default '',
  link text not null default '',
  updated_at timestamptz not null default now(),
  constraint report_notes_period_first_day check (extract(day from period) = 1)
);
alter table public.report_notes enable row level security;
alter table public.report_notes force row level security;
revoke all on public.report_notes from anon, authenticated;
grant select, insert, update, delete on public.report_notes to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-media', 'report-media', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];
