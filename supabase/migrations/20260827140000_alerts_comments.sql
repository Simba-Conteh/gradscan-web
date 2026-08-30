-- Job alerts: per-user watchlist + email opt-in, and per-role discussion.

alter table public.profiles
  add column if not exists email_alerts boolean not null default false;

create table if not exists public.role_alerts (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role_id    text not null references public.roles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
alter table public.role_alerts enable row level security;
create policy "own alerts read"   on public.role_alerts for select using (auth.uid() = user_id);
create policy "own alerts insert" on public.role_alerts for insert with check (auth.uid() = user_id);
create policy "own alerts delete" on public.role_alerts for delete using (auth.uid() = user_id);

create table if not exists public.role_comments (
  id          uuid primary key default gen_random_uuid(),
  role_id     text not null references public.roles (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Anonymous',
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index if not exists role_comments_role_idx on public.role_comments (role_id, created_at);
alter table public.role_comments enable row level security;
create policy "comments readable by signed-in users"
  on public.role_comments for select using (auth.role() = 'authenticated');
create policy "comments insert own"
  on public.role_comments for insert with check (auth.uid() = user_id);
create policy "comments delete own"
  on public.role_comments for delete using (auth.uid() = user_id);
