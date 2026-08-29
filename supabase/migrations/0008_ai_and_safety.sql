-- AI conversation persistence (Section 15) + the safety engine's audit log
-- (Section 32). Safety events intentionally store classification metadata
-- only — never the raw message text — per the privacy requirement to avoid
-- unnecessarily retaining sensitive conversational content.

create type public.ai_context as enum ('coach', 'health', 'craving', 'slip_analysis', 'daily_summary');
create type public.ai_role as enum ('user', 'assistant', 'system', 'tool');

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context public.ai_context not null default 'coach',
  title text,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index ai_conversations_user_id_idx on public.ai_conversations(user_id, last_message_at desc);

alter table public.ai_conversations enable row level security;
create policy "ai_conversations_all_own" on public.ai_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.ai_role not null,
  content text not null,
  tool_calls jsonb,
  safety_level text check (safety_level in ('none', 'monitor', 'urgent', 'emergency')),
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_id_idx on public.ai_messages(conversation_id, created_at);

alter table public.ai_messages enable row level security;
create policy "ai_messages_all_own" on public.ai_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Safety events (audit log, no raw content) ──────────────────────────
create table public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level in ('monitor', 'urgent', 'emergency')),
  category text not null check (category in ('self_harm', 'medical_emergency', 'withdrawal_risk')),
  matched_signals text[] not null default '{}',
  source_context text not null check (source_context in ('checkin', 'ai_chat', 'craving_note', 'onboarding')),
  action_shown text,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index safety_events_user_id_idx on public.safety_events(user_id, created_at desc);

alter table public.safety_events enable row level security;
create policy "safety_events_select_own" on public.safety_events for select using (auth.uid() = user_id);
create policy "safety_events_insert_own" on public.safety_events for insert with check (auth.uid() = user_id);
-- No update/delete policy: safety events are an immutable audit trail.

-- ── Operational error logs (Section 33 admin metrics) ──────────────────
-- Written by Edge Functions with the service role; not user-readable.
create table public.ai_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  function_name text not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_error_logs enable row level security;
-- Deliberately no policies: only the service role (which bypasses RLS) may
-- read/write this table. No end-user policy is granted.

create table public.app_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  scope text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.app_error_logs enable row level security;
create policy "app_error_logs_insert_own" on public.app_error_logs for insert with check (auth.uid() = user_id);
-- No select policy for end users: write-only client-side error reporting.
