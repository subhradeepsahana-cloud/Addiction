// Shared local-first write helper used by every service module. Writes
// always land in localStore first (so the UI and offline mode never wait on
// or depend on the network), then best-effort mirror to Supabase when
// configured, queuing on failure so nothing is lost.

import { localStore } from '@/lib/localStore';
import { getSupabase } from '@/lib/supabase';
import { enqueueSync } from '@/lib/syncQueue';
import { currentUserId } from '@/state/authStore';

export function requireUserId(): string {
  const id = currentUserId();
  if (!id) throw new Error('No authenticated user');
  return id;
}

export async function writeLocalAndSync<T extends { id: string }>(
  collection: string,
  item: T,
  supabaseTable: string,
  toRow: (item: T) => Record<string, unknown>
): Promise<T> {
  await localStore.insert(collection, item);

  const supabase = getSupabase();
  const userId = currentUserId();
  if (supabase && userId) {
    try {
      const { error } = await supabase.from(supabaseTable as never).insert(toRow(item) as never);
      if (error) throw error;
    } catch {
      await enqueueSync(supabaseTable, toRow(item));
    }
  }

  return item;
}

export async function logAppError(scope: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
  // Best-effort only; never throw from error logging itself.
  try {
    const supabase = getSupabase();
    const userId = currentUserId();
    if (supabase && userId) {
      await supabase.from('app_error_logs').insert({ user_id: userId, scope, message, metadata });
    }
  } catch {
    // swallow — logging must never crash the app
  }
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[${scope}]`, message, metadata ?? '');
  }
}
