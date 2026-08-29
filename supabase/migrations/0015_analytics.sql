-- Privacy-conscious product analytics (Section 34). Event payloads never
-- contain free-text content — only event name + small non-identifying
-- properties (counts, enum-like strings). Insert-only from the client.

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index analytics_events_event_name_idx on public.analytics_events(event_name, created_at desc);

alter table public.analytics_events enable row level security;
create policy "analytics_events_insert_own" on public.analytics_events for insert with check (auth.uid() = user_id);
-- No select policy for end users — write-only from the client; the admin
-- surface reads this with the service role.
