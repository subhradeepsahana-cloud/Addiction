-- Daily check-in (Section 9). One row per user per date.

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  mood integer check (mood between 1 and 10),
  stress integer check (stress between 1 and 10),
  craving integer check (craving between 0 and 10),
  sleep_hours numeric check (sleep_hours between 0 and 24),
  drank_alcohol boolean,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index daily_checkins_user_id_idx on public.daily_checkins(user_id, date desc);

alter table public.daily_checkins enable row level security;
create policy "daily_checkins_all_own" on public.daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
