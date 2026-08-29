// Central, typed access to public (client-safe) environment variables.
// Only EXPO_PUBLIC_* variables are ever available in the client bundle —
// this file must never reference a secret key.

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const env = {
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'Sober Companion',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  backendEnabled: readBool(process.env.EXPO_PUBLIC_BACKEND_ENABLED, false),
};

/**
 * True only when both the feature flag is on AND real Supabase credentials
 * are present. Every service module checks this before touching the
 * network, so the app is always fully usable in local/offline mock mode —
 * onboarding, logging, craving mode, and streaks never depend on it.
 */
export function isBackendConfigured(): boolean {
  return env.backendEnabled && !!env.supabaseUrl && !!env.supabaseAnonKey;
}
