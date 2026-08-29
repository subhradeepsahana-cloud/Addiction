-- Craving Mode (Section 10) — the core feature.

create type public.craving_outcome as enum ('resisted', 'drank', 'unresolved');
create type public.intervention_type as enum (
  'walk', 'water', 'eat', 'exercise', 'shower', 'contact_someone',
  'my_why', 'breathing', 'change_location', 'ai_coach', 'other'
);

create table public.cravings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  intensity_before integer not null check (intensity_before between 0 and 10),
  intensity_after integer check (intensity_after between 0 and 10),
  trigger public.trigger_tag,
  notes text,
  outcome public.craving_outcome,
  interventions_used public.intervention_type[] not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index cravings_user_id_idx on public.cravings(user_id);
create index cravings_started_at_idx on public.cravings(user_id, started_at desc);

alter table public.cravings enable row level security;
create policy "cravings_all_own" on public.cravings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.craving_interventions (
  id uuid primary key default gen_random_uuid(),
  craving_id uuid not null references public.cravings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.intervention_type not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  marked_helpful boolean,
  created_at timestamptz not null default now()
);

create index craving_interventions_craving_id_idx on public.craving_interventions(craving_id);
create index craving_interventions_user_id_idx on public.craving_interventions(user_id);

alter table public.craving_interventions enable row level security;
create policy "craving_interventions_all_own" on public.craving_interventions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
