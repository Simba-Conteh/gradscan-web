-- GradScan schema. Run this on the linked Supabase project when wiring the
-- real backend (see lib/backend/supabase.ts). Auth itself is Supabase Auth;
-- these tables hold profiles and the live roles feed.

create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  grade       text not null default '2:1',
  course      text not null default '',
  university  text not null default '',
  age         text not null default '',
  demographic text not null default 'Prefer not to say',
  sectors     text[] not null default '{}',
  traits      text[] not null default '{}',
  linkedin    text not null default '',
  portfolio   text not null default '',
  projects    text not null default '',
  skills      text[] not null default '{}',
  cv_text     text not null default '',
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile read"  on public.profiles for select using (auth.uid() = user_id);
create policy "own profile write" on public.profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update using (auth.uid() = user_id);

-- Live roles feed. Written by the daily GradScan scan (service role),
-- readable by any signed-in user.
create table if not exists public.roles (
  id               text primary key,
  company          text not null,
  title            text not null,
  sector           text not null,
  type             text not null,
  location         text not null default '',
  opens            date,
  deadline         date,
  status           text not null check (status in ('Open','Opens soon','Verify','Watch','Closed')),
  min_grade        text,
  eligibility      text,
  notes            text,
  source           text not null,
  first_seen       date not null,
  region_confirmed boolean not null default false,
  date_confidence  text not null check (date_confidence in ('confirmed','indicative','unconfirmed')),
  tags             text[] not null default '{}',
  updated_at       timestamptz not null default now()
);

alter table public.roles enable row level security;

create policy "roles readable by signed-in users"
  on public.roles for select using (auth.role() = 'authenticated');

-- Sourcing-rule guard: unconfirmed roles must never carry dates.
alter table public.roles add constraint unconfirmed_no_dates
  check (date_confidence <> 'unconfirmed' or (opens is null and deadline is null));
