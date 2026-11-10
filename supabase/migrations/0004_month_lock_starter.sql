-- Rank Orbit · month lock + starter-template flag.
-- locked:  the month is frozen; the server rejects edits and deletes until it is unlocked.
-- starter: the month was pre-filled from the starter template and still needs real numbers.
alter table public.months add column if not exists locked boolean not null default false;
alter table public.months add column if not exists starter boolean not null default false;
