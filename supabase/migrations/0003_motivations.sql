-- "My Why" — personal motivations and their photos (Section 6).
--
-- IMPORTANT (privacy/safety requirement): the app never infers meaning from
-- a photo. The user's own written description is always the source of
-- truth and the only thing ever shown back to them or passed to the AI.

create type public.motivation_tag as enum (
  'family', 'health', 'fitness', 'money', 'career', 'relationships',
  'mental_clarity', 'sleep', 'personal_goals', 'self_respect', 'other'
);

create table public.motivations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tag public.motivation_tag not null,
  custom_label text,
  free_text text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index motivations_user_id_idx on public.motivations(user_id);

alter table public.motivations enable row level security;
create policy "motivations_all_own" on public.motivations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.motivation_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  motivation_id uuid references public.motivations(id) on delete set null,
  storage_path text not null, -- path within the private 'motivation-photos' bucket
  description text not null,  -- required: the user's own words, always shown verbatim
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index motivation_photos_user_id_idx on public.motivation_photos(user_id);

alter table public.motivation_photos enable row level security;
create policy "motivation_photos_all_own" on public.motivation_photos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
