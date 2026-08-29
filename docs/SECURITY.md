# Security

## Secrets

- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` exist **only** as Supabase Edge Function secrets. They are never referenced by any `EXPO_PUBLIC_*` variable and never appear in client code, so they cannot end up in the mobile bundle.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` is safe to ship in the client by design — it has no privileges beyond what RLS policies grant.
- `.env`, `.env.*.local` are gitignored (`.env.example` is the only committed template).

## Row Level Security

Every user-data table (`supabase/migrations/0002`–`0011`, `0015`) has RLS enabled with a policy scoped to `auth.uid() = user_id` (or `= id` for `profiles`). There is no table a user can read or write outside their own rows except:

- `drink_types` and `health_sources`/`health_articles` — global reference data, public read-only.
- `analytics_events` and `app_error_logs` — insert-only for the authenticated user, no select policy (write-only telemetry).
- `ai_error_logs` — no end-user policy at all; only the service role (Edge Functions) can touch it.
- `safety_events` — insert + select for the owner, but **no update/delete policy**: it is an immutable audit trail.

## Storage

The `motivation-photos` bucket is created `public = false`. RLS on `storage.objects` requires the first path segment to equal `auth.uid()`, so a user can only read/write/delete files under their own folder. The app never generates a public URL — only short-lived signed URLs (`resolvePhotoUri` in `src/services/motivationService.ts`).

## Input validation

- Every piece of AI-generated structured output (drink extraction, health answers, slip analysis) is parsed through a Zod schema (`src/lib/validation.ts`) before it is trusted. A schema mismatch is treated as a failure, never partially trusted.
- Drink logging, check-ins, and craving records are constrained at the database level (`check` constraints on ranges like `mood between 1 and 10`), not just in the client.
- Edge Functions reject oversized input (e.g. `text.length > 500`) before calling OpenAI.

## Rate limiting / abuse prevention

Supabase's built-in API rate limiting applies to both PostgREST and Edge Function invocations at the project level (configurable in the Supabase dashboard). For production, set a request-per-minute cap appropriate to expected usage and monitor `ai_error_logs` for abuse patterns (e.g. one user generating an unusual volume of AI calls).

## Auth

- Supabase Auth (email/password) handles session storage via `expo-secure-store`-backed AsyncStorage, with auto-refresh enabled.
- The app also supports a fully local "mock mode" (no account) for demoing without a backend — local-mode data never leaves the device and is not synced anywhere; this is documented to users on the entry screen.

## Third-party data

OpenAI receives only the minimal context block assembled server-side (see `docs/ARCHITECTURE.md`) — never a full data dump, never photos, never the user's raw historical event log. `ai_data_sharing_consent` in `user_preferences` is intended to gate this pathway; production deployments should check it before invoking `ai-coach`/`health-assistant` for users who have not opted in (currently enforced as a documented app-level policy — hard-blocking on the flag is a small addition left for the operator to enable per their consent-flow requirements).

## Known limitations / left for the operator

- No automated penetration test or third-party security audit has been performed — do one before a public production launch.
- Multi-factor auth is not implemented (Supabase Auth supports it; enable in the dashboard if desired).
- Account deletion (Section 21) is implemented via `supabase/functions/delete-account`, which calls Supabase Auth's admin `deleteUser` API; every user-data table cascades on `auth.users` deletion via `on delete cascade` foreign keys.
