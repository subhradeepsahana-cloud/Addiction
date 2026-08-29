# Architecture

## Overview

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  Expo Router mobile app │        │   Supabase (Postgres)     │
│  (TypeScript, RN)       │        │   - Auth                  │
│                          │◄──────►│   - Database + RLS        │
│  src/lib/*  (pure logic) │  REST │   - Storage (My Why)      │
│  src/services/* (data)   │  +RLS │                            │
│  src/state/* (zustand)   │        └───────────┬──────────────┘
└──────────┬───────────────┘                    │
           │ supabase.functions.invoke()         │ service-role
           ▼                                     ▼
┌─────────────────────────┐        ┌──────────────────────────┐
│  Supabase Edge Functions │──────►│   OpenAI Chat Completions │
│  (Deno, server-side key) │        │   (gpt-4o-mini by default)│
└──────────────────────────┘        └──────────────────────────┘
```

## Local-first data layer

Every service in `src/services/` writes to on-device storage (`src/lib/localStore.ts`, AsyncStorage) **first and always** — this is what the UI reads from. When Supabase is configured, the same write is best-effort mirrored to Postgres; a failure is queued (`src/lib/syncQueue.ts`) and retried on next app start, instead of blocking or losing the write. This means:

- The app is fully functional offline and with zero backend configured (mock mode).
- A flaky network never loses a logged drink, craving, or check-in.
- Multi-device sync is intentionally out of scope for this MVP beyond profile/preferences (documented in `docs/ROADMAP.md`) — event history (drinks, cravings, check-ins) syncs one-way, device → Supabase, not down to a second device yet.

## AI tool architecture (Section 30/31 of the spec)

The AI Coach is deliberately **not** given a database write path. Instead:

1. The client runs the deterministic safety classifier (`src/lib/safety.ts`) on every message *before* it is ever sent to a model.
2. If clean, the Edge Function (`supabase/functions/ai-coach`) assembles a small, explicit **user-context block** (active goal, last 5 check-in averages, recent craving-resist count, known triggers) — never the raw database — and calls OpenAI with a narrow system prompt (`supabase/functions/_shared/prompts.ts`).
3. The model's reply is persisted (`ai_conversations` / `ai_messages`) and returned as plain text. It has no ability to call a "tool" that mutates state.
4. Every actual state change — logging a drink, saving a craving, updating preferences — goes through the same validated `src/services/*` functions the UI itself calls. AI-assisted drink logging (natural language) still ends with the user confirming a **validated, structured** JSON payload (`src/lib/validation.ts`, Zod) before anything is saved — the model's raw output is never trusted directly.

This is a stricter version of the spec's "controlled tool" architecture: rather than exposing named tools to the model and validating each call, the model is given no write capability at all, which removes an entire class of prompt-injection/hallucination risk.

## Narrow, single-responsibility prompts

Each AI capability has its own system prompt (`supabase/functions/_shared/prompts.ts`) — Coach, drink extraction, health assistant, safety classification, slip analysis, daily summary. None of them share a "do everything" prompt, and each states its hard rules (no diagnosis, no fabricated citations, no unsafe withdrawal instructions, no shame-based language) explicitly.

## Safety escalation

`src/lib/safety.ts` (client) and `supabase/functions/_shared/safety.ts` (Edge Function backstop, kept in sync) run the same deterministic, regex-based rules. `combineSafetyLevel` guarantees a classification can only ever be escalated, never downgraded — an AI-side classifier could theoretically add nuance in the future, but it can never talk down a rule-based "emergency" result. See `docs/SAFETY.md`.

## Deterministic pattern engine

Trigger windows, protective patterns, intervention effectiveness, and slip-pattern matching (`src/lib/patterns.ts`) are computed directly from the user's own stored events — never invented, never AI-generated. Every function has an explicit minimum-sample-size gate and returns "not enough data yet" below it. The AI Coach and insight narratives may only *rephrase* these pre-computed numbers (`INSIGHT_NARRATIVE_SYSTEM_PROMPT`), never invent new ones.

## Database

See `supabase/migrations/` for the full schema (14 tables + analytics, all with RLS scoped to `auth.uid()`). Highlights:

- `safety_events` and `ai_error_logs` store classification/error **metadata only** — never raw message content — for audit and admin visibility without exposing private conversations.
- `motivation_photos` point at a private Storage bucket (`motivation-photos`) with per-user RLS on `storage.objects`; there is no public URL, only short-lived signed URLs.
- `export_my_data()` is a Postgres RPC (not security-definer) so it runs under the caller's own RLS — it can only ever return the caller's own rows.
