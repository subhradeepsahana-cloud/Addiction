import { localStore, Collections, makeLocalId } from '@/lib/localStore';
import { writeLocalAndSync, requireUserId } from './base';
import type { DailyCheckin } from '@/types/domain';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface CheckinInput {
  mood: number | null;
  stress: number | null;
  craving: number | null;
  sleepHours: number | null;
  drankAlcohol: boolean | null;
  notes: string | null;
}

export async function submitCheckin(input: CheckinInput): Promise<DailyCheckin> {
  const userId = requireUserId();
  const date = todayKey();
  const existing = (await localStore.list<DailyCheckin>(Collections.checkins)).find((c) => c.date === date);

  const checkin: DailyCheckin = {
    id: existing?.id ?? makeLocalId(),
    userId,
    date,
    ...input,
  };

  if (existing) {
    await localStore.update(Collections.checkins, existing.id, checkin);
    return checkin;
  }

  return writeLocalAndSync(Collections.checkins, checkin, 'daily_checkins', (c) => ({
    id: c.id,
    user_id: c.userId,
    date: c.date,
    mood: c.mood,
    stress: c.stress,
    craving: c.craving,
    sleep_hours: c.sleepHours,
    drank_alcohol: c.drankAlcohol,
    notes: c.notes,
  }));
}

export async function getTodayCheckin(): Promise<DailyCheckin | null> {
  const date = todayKey();
  const checkins = await localStore.list<DailyCheckin>(Collections.checkins);
  return checkins.find((c) => c.date === date) ?? null;
}

export async function getCheckins(): Promise<DailyCheckin[]> {
  const checkins = await localStore.list<DailyCheckin>(Collections.checkins);
  return checkins.sort((a, b) => (a.date < b.date ? 1 : -1));
}
