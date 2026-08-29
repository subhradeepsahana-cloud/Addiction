import { localStore } from '@/lib/localStore';
import { getSupabase } from '@/lib/supabase';
import { currentUserId } from '@/state/authStore';
import type { Goal, TriggerTag } from '@/types/domain';

export interface LocalProfile {
  displayName: string | null;
  ageRange: string | null;
  timezone: string;
  units: 'metric' | 'imperial';
  currency: string;
  baselineFrequencyPerWeek: number | null;
  baselineDrinksPerOccasion: number | null;
  preferredDrinkCategories: string[];
  typicalDrinkingTime: string | null;
  typicalSocialContext: string | null;
  commonSituations: string[];
  averageDrinkCost: number | null;
  onboardingCompletedAt: string | null;
  trackingStartDate: string;
}

const PROFILE_KEY = 'profile';

export function defaultProfile(): LocalProfile {
  return {
    displayName: null,
    ageRange: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    units: 'metric',
    currency: 'USD',
    baselineFrequencyPerWeek: null,
    baselineDrinksPerOccasion: null,
    preferredDrinkCategories: [],
    typicalDrinkingTime: null,
    typicalSocialContext: null,
    commonSituations: [],
    averageDrinkCost: null,
    onboardingCompletedAt: null,
    trackingStartDate: new Date().toISOString().slice(0, 10),
  };
}

export async function getProfile(): Promise<LocalProfile> {
  const stored = await localStore.getValue<LocalProfile>(PROFILE_KEY);
  return stored ?? defaultProfile();
}

export async function saveProfile(patch: Partial<LocalProfile>): Promise<LocalProfile> {
  const current = await getProfile();
  const next = { ...current, ...patch };
  await localStore.setValue(PROFILE_KEY, next);

  const supabase = getSupabase();
  const userId = currentUserId();
  if (supabase && userId) {
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        display_name: next.displayName,
        age_range: next.ageRange,
        timezone: next.timezone,
        units: next.units,
        currency: next.currency,
        baseline_frequency_per_week: next.baselineFrequencyPerWeek,
        baseline_drinks_per_occasion: next.baselineDrinksPerOccasion,
        preferred_drink_categories: next.preferredDrinkCategories,
        typical_drinking_time: next.typicalDrinkingTime,
        typical_social_context: next.typicalSocialContext,
        common_situations: next.commonSituations,
        average_drink_cost: next.averageDrinkCost,
        onboarding_completed_at: next.onboardingCompletedAt,
        tracking_start_date: next.trackingStartDate,
      });
    } catch {
      // Profile sync failure is non-fatal — local copy remains authoritative.
    }
  }

  return next;
}

export async function completeOnboarding(): Promise<void> {
  await saveProfile({ onboardingCompletedAt: new Date().toISOString() });
}

// ── Goal ─────────────────────────────────────────────────────────────────
const GOAL_KEY = 'active_goal';

export async function getActiveGoal(): Promise<Goal | null> {
  return (await localStore.getValue<Goal>(GOAL_KEY)) ?? null;
}

export async function setActiveGoal(goal: Goal, notes?: string): Promise<void> {
  await localStore.setValue(GOAL_KEY, goal);

  const supabase = getSupabase();
  const userId = currentUserId();
  if (supabase && userId) {
    try {
      await supabase.from('goals').update({ is_active: false }).eq('user_id', userId).eq('is_active', true);
      await supabase.from('goals').insert({ user_id: userId, goal_type: goal, is_active: true, notes: notes ?? null });
    } catch {
      // non-fatal
    }
  }
}

// ── User triggers ───────────────────────────────────────────────────────
const TRIGGERS_KEY = 'selected_triggers';

export async function getSelectedTriggers(): Promise<TriggerTag[]> {
  return (await localStore.getValue<TriggerTag[]>(TRIGGERS_KEY)) ?? [];
}

export async function saveSelectedTriggers(tags: TriggerTag[]): Promise<void> {
  await localStore.setValue(TRIGGERS_KEY, tags);

  const supabase = getSupabase();
  const userId = currentUserId();
  if (supabase && userId) {
    try {
      for (const tag of tags) {
        await supabase.from('user_triggers').upsert({ user_id: userId, tag, source: 'onboarding' }, { onConflict: 'user_id,tag' });
      }
    } catch {
      // non-fatal
    }
  }
}
