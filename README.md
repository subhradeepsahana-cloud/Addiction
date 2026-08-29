# Sober Companion

An AI-powered alcohol recovery companion: behavioral tracking, personalized trigger detection, a 10-minute craving intervention, an AI coach, evidence-based education, and relapse-without-shame analysis. Mobile-first (React Native + Expo), TypeScript throughout, Supabase for backend/auth/storage, OpenAI for AI features via server-side Edge Functions.

The product name is configurable — see `EXPO_PUBLIC_APP_NAME` in `.env.example`.

## Status

This is a working MVP covering all 10 build phases at MVP depth: foundation/auth, drink logging (manual + AI-assisted natural language), daily check-ins, the full Craving Mode flow, trigger/protective-pattern insights, an AI Coach, My Why photo storage, predictive trigger notifications, a scientific knowledge base, a deterministic safety engine, and production hardening (tests, RLS, error boundaries, analytics).

**The app runs with zero backend configuration**, in a local/offline mock mode: onboarding, drink logging, check-ins, streaks, and the full Craving Mode flow work against on-device storage (AsyncStorage) with no Supabase or OpenAI credentials. AI features (Coach replies, natural-language drink extraction, health Q&A) require Supabase + OpenAI to be configured; everything else — including all safety-critical logic — works regardless.

## Quick start

```bash
npm install
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or `w` for web, or scan the QR code with Expo Go. No `.env` is required to try the app — it starts in local mock mode.

## Connecting a real backend

1. Create a project at [supabase.com](https://supabase.com).
2. Install the Supabase CLI, then link and push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
   This runs every migration in `supabase/migrations/` — full schema, RLS policies on every table, the `motivation-photos` storage bucket, and seed data (default drink types + the scientific knowledge base).
3. Deploy the Edge Functions (server-side OpenAI integration):
   ```bash
   npx supabase functions deploy ai-coach extract-drink slip-analysis health-assistant daily-summary
   npx supabase secrets set OPENAI_API_KEY=sk-... SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and set `EXPO_PUBLIC_BACKEND_ENABLED=true`.
5. Restart `expo start`.

Full details, including staging/production environments and the iOS/Android build pipeline, are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Project structure

```
app/                    Expo Router screens (file-based routing)
  (auth)/                Sign up / sign in / local mock-mode entry
  (onboarding)/           6-step onboarding flow
  (tabs)/                 Home, Log, Check-in, Coach, More (Progress, Trigger Insights,
                           My Why, Health & Science, Settings, Safety)
  craving/                The full Craving Mode wizard (interrupt → intensity → trigger →
                           intervention → recheck → slip reflection if needed → done)
src/
  components/            Design-system primitives (Button, Card, Text, Screen, ...)
  theme/                  Colors, spacing, typography, light/dark palettes
  lib/                    Pure, unit-tested business logic — see below
  services/               Local-first data layer (AsyncStorage + best-effort Supabase sync)
  state/                  Zustand stores (auth, onboarding draft)
  constants/              Static reference data (drink catalog, emergency resources, ...)
supabase/
  migrations/             Full SQL schema + RLS, in numbered order
  functions/              Edge Functions (Deno) — the only place the OpenAI key is used
docs/                     Architecture, deployment, security, safety, roadmap
```

### The important logic lives in `src/lib/`, and is unit tested

- `calculations.ts` — standard-drink math, streaks, money saved (29 tests total across this directory, see `src/lib/__tests__/`)
- `safety.ts` — the **deterministic** safety-risk classifier (self-harm, medical emergency, withdrawal risk). This is the hard safety floor: it never depends on AI, and no AI classifier is ever allowed to lower a severity it assigns.
- `patterns.ts` — trigger-window scoring, protective-pattern detection, intervention effectiveness, slip-pattern matching. All computed from the user's own stored data; every function returns an explicit "not enough data" result rather than inventing a pattern.
- `insights.ts` — turns the above into the natural-language insight copy shown on the dashboard.

Run the suite: `npm test`.

## AI architecture

The OpenAI API key is **never** in the client — every AI call goes through a Supabase Edge Function (`supabase/functions/*`). Each function has one narrow responsibility (`_shared/prompts.ts`) — there is no single "do everything" system prompt. The AI Coach never writes to the database directly: it only ever reads a small, explicitly-assembled context block and returns text; every actual state change (logging a drink, saving a craving) goes through the same validated service functions the UI itself uses, whether or not AI was involved. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full data-flow and the safety-escalation design.

## Safety

Deterministic, regex-based detection of self-harm intent, medical emergencies (seizure, loss of consciousness, breathing/cardiac symptoms), and withdrawal risk runs **before** any AI call, on-device, and cannot be bypassed by a model failure. See [`docs/SAFETY.md`](docs/SAFETY.md).

This app provides educational and behavioral support and is not a substitute for professional medical care, diagnosis, or treatment. Suddenly stopping alcohol after heavy or prolonged drinking can carry serious health risks — the app never attempts to manage withdrawal and always directs users toward medical guidance and emergency resources when relevant.

## Testing

```bash
npm test          # unit tests (business logic) — 29 tests, ts-jest
npm run typecheck # strict TypeScript across the whole app
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, data flow, AI tool architecture
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Supabase/OpenAI setup, environments, iOS/Android builds
- [`docs/SECURITY.md`](docs/SECURITY.md) — security checklist, RLS model, secrets handling
- [`docs/SAFETY.md`](docs/SAFETY.md) — the safety engine in detail, emergency-resource architecture
- [`docs/KNOWLEDGE_SOURCES.md`](docs/KNOWLEDGE_SOURCES.md) — scientific knowledge base sourcing/update process
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what's implemented vs. what's next
