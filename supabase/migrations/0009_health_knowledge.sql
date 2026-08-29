-- Scientific Knowledge System (Section 17-18). health_sources are the
-- organizations; health_articles are individual, citable pieces of content
-- reviewed against those sources. Publicly readable (not user-specific),
-- writable only by the service role (content is curated, not user-generated).

create table public.health_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. "World Health Organization"
  short_code text not null unique, -- e.g. "WHO"
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.health_sources enable row level security;
create policy "health_sources_public_read" on public.health_sources for select using (true);

create table public.health_articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.health_sources(id) on delete restrict,
  topic text not null, -- e.g. "sleep", "liver", "cardiovascular", "cancer_risk", "mental_health", "dependence", "withdrawal", "binge_drinking", "calories", "benefits_of_reducing", "what_happens_when_you_stop", "when_to_seek_help"
  title text not null,
  slug text not null unique,
  summary text not null,
  content text not null,
  evidence_level text not null check (evidence_level in ('high', 'moderate', 'emerging')),
  source_url text not null,
  published_date date,
  last_verified_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index health_articles_topic_idx on public.health_articles(topic);

alter table public.health_articles enable row level security;
create policy "health_articles_public_read" on public.health_articles for select using (true);

create trigger health_articles_set_updated_at before update on public.health_articles
  for each row execute function public.set_updated_at();

-- Freshness view for the admin dashboard (Section 33): flags any article
-- not re-verified in the last 180 days.
create view public.health_articles_freshness as
select
  id, title, topic, last_verified_date,
  (current_date - last_verified_date) as days_since_verified,
  (current_date - last_verified_date) > 180 as needs_review
from public.health_articles;
