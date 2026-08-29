# Roadmap

## What's implemented (MVP, all 10 phases at working depth)

- Foundation: Expo Router app, design system, Supabase Auth + local mock mode, full DB schema with RLS
- Onboarding, goals, drink logging (manual + AI natural-language extraction), daily check-ins, streaks, dashboard
- Full 10-minute Craving Mode: interrupt → intensity → trigger → personalized interventions (ranked by the user's own history) → My Why → AI Coach → recheck → compassionate slip reflection when a craving ends in drinking
- Trigger-window scoring, protective-pattern detection, intervention effectiveness, deterministic personalized insights
- AI Coach (context-aware, safety-gated, no direct DB write access), structured drink extraction, slip analysis, health Q&A — all via Supabase Edge Functions with narrow prompts
- My Why: photo upload to private Supabase Storage, user-written descriptions only (never AI-inferred meaning)
- Predictive trigger notifications (local scheduling from the user's own risk windows), quiet hours, configurable notification settings
- Scientific knowledge base (4 sources, 12 articles) with a retrieval-and-cite AI assistant
- Deterministic safety engine (self-harm / medical emergency / withdrawal risk), country-specific emergency resources, safety audit log
- Tests (29 unit tests over the core business logic), typed strictly, error boundary, privacy-conscious analytics, EAS build config

## Explicitly out of scope for this MVP (documented, not silently dropped)

- **Standalone Next.js admin dashboard.** The underlying data is queryable today (`analytics_events`, `safety_events`, `ai_error_logs`, `health_articles_freshness`) directly in Supabase Studio; a dedicated web UI over these is the natural next step.
- **Multi-device sync for event history.** Profile/preferences sync; drinks/cravings/check-ins are local-first with one-way (device → cloud) sync. Reading history back down to a second device needs a pull-sync pass.
- **Calendar integration** (Section 23) — the `calendarEnabled` preference exists as a placeholder toggle; no calendar read has been wired up yet.
- **Wearable integrations, voice input, subscriptions/payments** — explicitly deferred per the spec's own MVP2/MVP3 prioritization.
- **Server-triggered push notifications** — current predictive alerts are scheduled locally on-device from the user's own history; a nightly server job + push token table would allow alerts even when the app hasn't been opened recently.
- **Full protective-pattern cache table population.** `protective_patterns` exists in the schema for a future scheduled job; the app currently computes protective patterns on the fly client-side (fast enough at MVP data volumes) rather than writing to this cache.
- **Independent security audit / penetration test** — see `docs/SECURITY.md`.

## Suggested next milestones

1. Admin web dashboard over the existing analytics/safety/knowledge-freshness tables.
2. Pull-sync for event history to support real multi-device usage.
3. Scheduled Edge Function to recompute trigger windows nightly and send server-triggered push notifications (covers the case where the app hasn't been opened in days, when predictive alerts matter most).
4. Calendar-aware trigger detection (Section 23), gated behind explicit opt-in.
5. Human clinical review pass over `docs/KNOWLEDGE_SOURCES.md` content and citations before any public launch.
