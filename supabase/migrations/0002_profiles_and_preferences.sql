-- Profiles, onboarding baseline, and user preferences. One row per
-- auth.users id. RLS: a user may only ever read/write their own row.

create type public.goal_type as enum ('quit', 'reduce', 'break', 'understand', 'unsure');
create type public.drinking_time as enum ('morning', 'afternoon', 'evening', 'late_night', 'varies');
create type public.social_context as enum ('alone', 'social', 'both');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age_range text, -- '18-24' | '25-34' | ... free text bucket, not exact DOB
  timezone text not null default 'UTC',
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  currency text not null default 'USD',

  -- Drinking baseline captured during onboarding (Section 5). All optional —
  -- onboarding never blocks on these.
  baseline_frequency_per_week numeric,
  baseline_drinks_per_occasion numeric,
  preferred_drink_categories text[] default '{}',
  typical_drinking_time public.drinking_time,
  typical_social_context public.social_context,
  common_situations text[] default '{}',
  average_drink_cost numeric,

  onboarding_completed_at timestamptz,
  tracking_start_date date not null default current_date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Goals ────────────────────────────────────────────────────────────────
-- History of goals is kept (not overwritten) so changing your mind is
-- never destructive; only one goal is "active" at a time.
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type public.goal_type not null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index goals_user_id_idx on public.goals(user_id);
create unique index goals_one_active_per_user on public.goals(user_id) where is_active;

alter table public.goals enable row level security;
create policy "goals_all_own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── User preferences (Settings) ─────────────────────────────────────────
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  currency text not null default 'USD',
  average_drink_cost numeric,
  timezone text not null default 'UTC',

  quiet_hours_start time,
  quiet_hours_end time,
  trigger_alerts_enabled boolean not null default true,
  motivational_notifications_enabled boolean not null default true,
  checkin_reminders_enabled boolean not null default true,
  notification_frequency text not null default 'normal' check (notification_frequency in ('low', 'normal', 'high')),

  location_enabled boolean not null default false,
  calendar_enabled boolean not null default false,
  ai_data_sharing_consent boolean not null default false,

  emergency_country text not null default 'US',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
create policy "prefs_all_own" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger prefs_set_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ── Auto-provision profile + preferences on signup ─────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
