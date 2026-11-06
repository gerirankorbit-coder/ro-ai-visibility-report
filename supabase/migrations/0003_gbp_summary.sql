-- Rank Orbit · GBP Summary tiles (location, website and four status tiles per month).
alter table public.months add column if not exists gbp_summary jsonb not null default '{}'::jsonb;
