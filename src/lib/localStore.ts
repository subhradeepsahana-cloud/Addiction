// Local-first persistence. This is the source of truth for the UI in every
// mode (including full offline / no-backend mock mode): writes land here
// immediately and are never lost. When Supabase is configured, services
// additionally best-effort push the same write to Supabase and queue it for
// retry on failure — see src/lib/syncQueue.ts.

import AsyncStorage from '@react-native-async-storage/async-storage';

const NAMESPACE = 'sober_companion:v1:';

async function readCollection<T>(name: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(NAMESPACE + name);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function writeCollection<T>(name: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(NAMESPACE + name, JSON.stringify(items));
}

export function makeLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const localStore = {
  async list<T>(collection: string): Promise<T[]> {
    return readCollection<T>(collection);
  },

  async get<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
    const items = await readCollection<T>(collection);
    return items.find((i) => i.id === id) ?? null;
  },

  async insert<T extends { id: string }>(collection: string, item: T): Promise<T> {
    const items = await readCollection<T>(collection);
    items.push(item);
    await writeCollection(collection, items);
    return item;
  },

  async update<T extends { id: string }>(collection: string, id: string, patch: Partial<T>): Promise<T | null> {
    const items = await readCollection<T>(collection);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch };
    await writeCollection(collection, items);
    return items[idx];
  },

  async remove<T extends { id: string }>(collection: string, id: string): Promise<void> {
    const items = await readCollection<T>(collection);
    await writeCollection(
      collection,
      items.filter((i) => i.id !== id)
    );
  },

  async setValue<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(NAMESPACE + 'kv:' + key, JSON.stringify(value));
  },

  async getValue<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(NAMESPACE + 'kv:' + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(NAMESPACE));
    await AsyncStorage.removeMany(ours);
  },
};

export const Collections = {
  profile: 'profile',
  preferences: 'preferences',
  goals: 'goals',
  motivations: 'motivations',
  motivationPhotos: 'motivation_photos',
  drinkingEvents: 'drinking_events',
  cravings: 'cravings',
  checkins: 'checkins',
  userTriggers: 'user_triggers',
  achievements: 'achievements',
  aiConversations: 'ai_conversations',
  aiMessages: 'ai_messages',
  notifications: 'notifications',
  safetyEvents: 'safety_events',
} as const;
