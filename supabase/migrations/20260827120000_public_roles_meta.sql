-- Roles are public job data: let anonymous visitors read them so the landing
-- page shows live counts. Profiles stay locked down per-user.
drop policy if exists "roles readable by signed-in users" on public.roles;
create policy "roles readable by everyone"
  on public.roles for select using (true);

-- Single-row site metadata written by the daily sync.
create table if not exists public.site_meta (
  id               smallint primary key default 1 check (id = 1),
  last_updated     date not null,
  region_scope     text not null default 'UK-wide',
  portal_access_log text,
  updated_at       timestamptz not null default now()
);

alter table public.site_meta enable row level security;
create policy "meta readable by everyone"
  on public.site_meta for select using (true);
