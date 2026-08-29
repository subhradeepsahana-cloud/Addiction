import { localStore } from '@/lib/localStore';
import { getSupabase } from '@/lib/supabase';
import { requireUserId } from './base';
import type { UserPreferences } from '@/types/domain';

const KEY = 'preferences';

export function defaultPreferences(userId: string): UserPreferences {
  return {
    userId,
    units: 'metric',
    currency: 'USD',
    averageDrinkCost: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    triggerAlertsEnabled: true,
    motivationalNotificationsEnabled: true,
    checkinRemindersEnabled: true,
    notificationFrequency: 'normal',
    locationEnabled: false,
    calendarEnabled: false,
    aiDataSharingConsent: false,
    emergencyCountry: 'US',
  };
}

export async function getPreferences(): Promise<UserPreferences> {
  const stored = await localStore.getValue<UserPreferences>(KEY);
  if (stored) return stored;
  const userId = requireUserId();
  const defaults = defaultPreferences(userId);
  await localStore.setValue(KEY, defaults);
  return defaults;
}

export async function updatePreferences(patch: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = await getPreferences();
  const next = { ...current, ...patch };
  await localStore.setValue(KEY, next);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('user_preferences').upsert({
        user_id: next.userId,
        units: next.units,
        currency: next.currency,
        average_drink_cost: next.averageDrinkCost,
        timezone: next.timezone,
        quiet_hours_start: next.quietHoursStart,
        quiet_hours_end: next.quietHoursEnd,
        trigger_alerts_enabled: next.triggerAlertsEnabled,
        motivational_notifications_enabled: next.motivationalNotificationsEnabled,
        checkin_reminders_enabled: next.checkinRemindersEnabled,
        notification_frequency: next.notificationFrequency,
        location_enabled: next.locationEnabled,
        calendar_enabled: next.calendarEnabled,
        ai_data_sharing_consent: next.aiDataSharingConsent,
        emergency_country: next.emergencyCountry,
      });
    } catch {
      // non-fatal
    }
  }

  return next;
}
