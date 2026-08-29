# Deployment

## Environments

Use three separate Supabase projects (or at minimum, separate `.env.*` files pointed at the same schema) for `development`, `staging`, and `production`. Never point a staging/dev build at the production database.

## 1. Supabase setup

```bash
npm install -g supabase   # or use npx supabase throughout
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push          # applies every migration in supabase/migrations/, in order
```

This creates the full schema, RLS policies on every table, the private `motivation-photos` storage bucket + its RLS, the default drink catalog, and the seeded scientific knowledge base.

## 2. Edge Functions + secrets

```bash
supabase functions deploy ai-coach
supabase functions deploy extract-drink
supabase functions deploy slip-analysis
supabase functions deploy health-assistant
supabase functions deploy daily-summary

supabase secrets set \
  OPENAI_API_KEY=sk-... \
  OPENAI_CHAT_MODEL=gpt-4o-mini \
  SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=...
```

The service-role key and OpenAI key are **only** ever set as Edge Function secrets — never in `.env`, never in the client bundle, never committed.

## 3. Environment variables (client)

Copy `.env.example` → `.env` (dev), `.env.staging`, `.env.production` as needed. Only `EXPO_PUBLIC_*` variables reach the client; see the file for the full list and explanation of each. Set `EXPO_PUBLIC_BACKEND_ENABLED=true` once Supabase is live — leaving it `false` (or omitting Supabase credentials) keeps the app in local mock mode, which is useful for demos and offline development.

## 4. Web (optional)

The app builds for web via `expo start --web` / `expo export --platform web`; deploy the static output to Vercel or any static host. There is no separate Next.js admin app in this MVP — analytics and safety-event auditing are SQL tables/views (`analytics_events`, `safety_events`, `ai_error_logs`, `health_articles_freshness`) queryable directly in Supabase Studio; a dedicated admin UI is a roadmap item (see `docs/ROADMAP.md`).

## 5. iOS build (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
eas submit --platform ios
```

Update `app.config.ts` → `ios.bundleIdentifier` to your real bundle ID before the first build. `eas.json` defines `development` / `staging` / `production` build profiles, each pointing `EXPO_PUBLIC_BACKEND_ENABLED` appropriately.

## 6. Android build (EAS)

```bash
eas build --platform android --profile production
eas submit --platform android
```

Update `app.config.ts` → `android.package` to your real package name first.

## 7. Push notification setup

Predictive trigger alerts and check-in reminders use local, on-device scheduling (`expo-notifications`) computed from the user's own history — no push server is required for the MVP. If you later want server-triggered push (e.g. a scheduled job re-computing risk windows nightly), set up `expo-server-sdk` in a Supabase scheduled Edge Function and store push tokens in a new `push_tokens` table (not included yet — see `docs/ROADMAP.md`).

## 8. Production security checklist

See `docs/SECURITY.md` for the full checklist. Minimum before shipping:

- [ ] RLS enabled and verified on every table (`supabase db push` already does this; spot-check in Studio)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` set only as Edge Function secrets
- [ ] `.env`, `.env.*.local` are gitignored and were never committed (`git log -p -- .env` should be empty)
- [ ] Storage bucket `motivation-photos` confirmed private (not public) with per-user policies
- [ ] Rate limiting / abuse prevention configured on Edge Functions (Supabase project settings → API)
- [ ] App Store / Play Store privacy labels reflect actual data collection (see `app.config.ts` permission strings)
