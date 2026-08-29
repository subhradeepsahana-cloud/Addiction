-- Notification bookkeeping (Section 20) and light gamification (Section 26).

create type public.notification_type as enum ('predictive', 'motivational', 'checkin', 'success');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id, scheduled_for desc);

alter table public.notifications enable row level security;
create policy "notifications_all_own" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create type public.achievement_type as enum (
  'first_day', 'week_streak', 'month_streak', 'quarter_streak', 'year_streak',
  'first_craving_resisted', 'ten_cravings_resisted', 'first_checkin', 'checkin_streak_7',
  'personal_record_streak'
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.achievement_type not null,
  achieved_at timestamptz not null default now(),
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, type)
);

alter table public.achievements enable row level security;
create policy "achievements_all_own" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
