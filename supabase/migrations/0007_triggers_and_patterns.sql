-- Personal Trigger Map + Protective Pattern Engine (Sections 12-13).
--
-- user_triggers: which trigger tags this user has told us matter to them
-- (selected during onboarding, or added later).
-- trigger_events: a normalized, timestamped log of every time a trigger
-- tag appeared on a craving or a drinking event, auto-populated by
-- triggers below so the trigger map can be queried without scanning both
-- source tables.
-- protective_patterns: a cache of the deterministic protective-pattern
-- computation (src/lib/patterns.ts), refreshed periodically by an Edge
-- Function/cron job. The client can always recompute this on the fly from
-- raw data — this table exists purely as a performance cache.

create table public.user_triggers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tag public.trigger_tag not null,
  source text not null default 'onboarding' check (source in ('onboarding', 'detected', 'manual')),
  created_at timestamptz not null default now(),
  unique (user_id, tag)
);

alter table public.user_triggers enable row level security;
create policy "user_triggers_all_own" on public.user_triggers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.trigger_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tag public.trigger_tag not null,
  source_type text not null check (source_type in ('craving', 'drinking_event')),
  source_id uuid not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index trigger_events_user_id_idx on public.trigger_events(user_id, occurred_at desc);

alter table public.trigger_events enable row level security;
create policy "trigger_events_all_own" on public.trigger_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-populate trigger_events from cravings / drinking_events.
create or replace function public.log_trigger_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.trigger is not null then
    insert into public.trigger_events (user_id, tag, source_type, source_id, occurred_at)
    values (
      new.user_id,
      new.trigger,
      case when tg_table_name = 'cravings' then 'craving' else 'drinking_event' end,
      new.id,
      coalesce(new.started_at, new.occurred_at)
    );
  end if;
  return new;
end;
$$;

create trigger cravings_log_trigger_event
  after insert on public.cravings
  for each row execute function public.log_trigger_event();

create trigger drinking_events_log_trigger_event
  after insert on public.drinking_events
  for each row execute function public.log_trigger_event();

create table public.protective_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  factors text[] not null,
  occurrences integer not null,
  alcohol_free_rate numeric not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  computed_at timestamptz not null default now()
);

create index protective_patterns_user_id_idx on public.protective_patterns(user_id, computed_at desc);

alter table public.protective_patterns enable row level security;
create policy "protective_patterns_all_own" on public.protective_patterns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
