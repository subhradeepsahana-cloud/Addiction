// Retry queue for writes that failed to reach Supabase (offline, or a
// transient error). Nothing the user enters is ever lost: it is already in
// localStore by the time a queue entry is created here, and this queue just
// tracks what still needs to be pushed upstream once connectivity returns.

import { localStore } from './localStore';
import { getSupabase } from './supabase';

interface QueueEntry {
  id: string;
  table: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
}

const QUEUE_KEY = 'sync_queue';

export async function enqueueSync(table: string, payload: Record<string, unknown>): Promise<void> {
  const queue = (await localStore.getValue<QueueEntry[]>(QUEUE_KEY)) ?? [];
  queue.push({
    id: `${table}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    table,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
  await localStore.setValue(QUEUE_KEY, queue);
}

export async function flushSyncQueue(): Promise<{ succeeded: number; remaining: number }> {
  const supabase = getSupabase();
  if (!supabase) return { succeeded: 0, remaining: 0 };

  const queue = (await localStore.getValue<QueueEntry[]>(QUEUE_KEY)) ?? [];
  if (queue.length === 0) return { succeeded: 0, remaining: 0 };

  const stillPending: QueueEntry[] = [];
  let succeeded = 0;

  for (const entry of queue) {
    try {
      const { error } = await supabase.from(entry.table as never).insert(entry.payload as never);
      if (error) throw error;
      succeeded += 1;
    } catch {
      entry.attempts += 1;
      if (entry.attempts < 8) stillPending.push(entry);
      // After 8 failed attempts we drop the queued sync rather than retry
      // forever; the record still safely exists in localStore.
    }
  }

  await localStore.setValue(QUEUE_KEY, stillPending);
  return { succeeded, remaining: stillPending.length };
}

export async function pendingSyncCount(): Promise<number> {
  const queue = (await localStore.getValue<QueueEntry[]>(QUEUE_KEY)) ?? [];
  return queue.length;
}
