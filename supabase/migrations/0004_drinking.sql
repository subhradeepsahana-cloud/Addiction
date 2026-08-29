-- Drink catalog + drinking event log (Section 8).

create type public.trigger_tag as enum (
  'stress', 'work_pressure', 'anxiety', 'anger', 'sadness', 'boredom',
  'loneliness', 'social_pressure', 'parties', 'certain_people',
  'certain_locations', 'certain_times', 'habit', 'celebration', 'sleep',
  'alcohol_available', 'relationship', 'other'
);

create type public.drink_category as enum ('beer', 'wine', 'whisky', 'vodka', 'rum', 'gin', 'cocktail', 'other');
create type public.serving_size as enum ('small', 'regular', 'large', 'double');
create type public.drinking_source as enum ('manual', 'nl_extraction', 'craving_slip');

create table public.drink_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = global default, shown to everyone
  category public.drink_category not null,
  name text not null,
  default_abv_percent numeric not null,
  default_volume_ml numeric not null,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create index drink_types_user_id_idx on public.drink_types(user_id);

alter table public.drink_types enable row level security;
create policy "drink_types_select_global_or_own" on public.drink_types
  for select using (user_id is null or auth.uid() = user_id);
create policy "drink_types_insert_own" on public.drink_types
  for insert with check (auth.uid() = user_id);
create policy "drink_types_update_own" on public.drink_types
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "drink_types_delete_own" on public.drink_types
  for delete using (auth.uid() = user_id);

create table public.drinking_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  drink_type_id uuid references public.drink_types(id) on delete set null,
  drink_category public.drink_category not null,
  drink_name text not null,
  quantity numeric not null check (quantity > 0),
  serving_size public.serving_size not null default 'regular',
  volume_ml numeric not null,
  abv_percent numeric not null,
  standard_drinks numeric not null,
  cost_estimate numeric,
  context text,
  mood integer check (mood between 1 and 10),
  trigger public.trigger_tag,
  notes text,
  was_planned boolean,
  location_label text,
  -- Optional & coarse only — precise coordinates are never required or stored.
  location_lat numeric,
  location_lng numeric,
  source public.drinking_source not null default 'manual',
  created_at timestamptz not null default now()
);

create index drinking_events_user_id_idx on public.drinking_events(user_id);
create index drinking_events_occurred_at_idx on public.drinking_events(user_id, occurred_at desc);

alter table public.drinking_events enable row level security;
create policy "drinking_events_all_own" on public.drinking_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
