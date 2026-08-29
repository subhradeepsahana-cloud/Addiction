import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isBackendConfigured } from './env';

// Note: intentionally NOT parametrized with the hand-written Database type
// (src/types/supabase.ts). supabase-js's generic constraints changed in
// recent versions in ways that fight a hand-maintained schema; the Database
// type is kept as documentation and for `supabase gen types` to replace
// later. Row shape correctness is instead enforced at the service-layer
// to-row mappers (see src/services/*.ts), which is where it actually
// matters for data integrity.
let client: SupabaseClient | null = null;

/**
 * Returns a lazily-created Supabase client, or null when the backend isn't
 * configured (missing credentials or EXPO_PUBLIC_BACKEND_ENABLED=false).
 * Every caller MUST null-check — this is what keeps the app fully
 * functional in local/offline mock mode without any backend.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isBackendConfigured()) return null;
  if (client) return client;

  client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
