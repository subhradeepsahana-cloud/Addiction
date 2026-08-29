// Trigger Alarm Engine delivery (Phase 7). Risk *scoring* is the pure,
// tested logic in src/lib/patterns.ts — this module only turns that into
// scheduled local notifications, respecting quiet hours and the user's
// notification preferences. Predictive language is always hedged
// ("your history suggests"), never framed as a certain prediction.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { computeTriggerWindows } from '@/lib/patterns';
import { getCravings } from './cravingService';
import { getDrinkingEvents } from './drinkService';
import { getPreferences } from './preferencesService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function isWithinQuietHours(date: Date, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (startMin <= endMin) return minutes >= startMin && minutes < endMin;
  return minutes >= startMin || minutes < endMin; // wraps past midnight
}

/** Cancels and re-schedules predictive trigger alerts for the next 7 days based on the user's own history. */
export async function scheduleTriggerAlerts(): Promise<number> {
  const prefs = await getPreferences();
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!prefs.triggerAlertsEnabled) return 0;
  const granted = await requestNotificationPermissions();
  if (!granted) return 0;

  const [cravings, events] = await Promise.all([getCravings(), getDrinkingEvents()]);
  const windows = computeTriggerWindows([...cravings.map((c) => ({ occurredAt: c.startedAt })), ...events.map((e) => ({ occurredAt: e.occurredAt }))]);
  const highRisk = windows.filter((w) => w.sampleSize >= 3 && w.score >= 0.5);

  const maxAlerts = prefs.notificationFrequency === 'high' ? 10 : prefs.notificationFrequency === 'low' ? 2 : 5;
  let scheduled = 0;

  for (const window of highRisk.slice(0, maxAlerts)) {
    const fireAt = nextOccurrence(window.dayOfWeek, window.hourRange[0]);
    if (isWithinQuietHours(fireAt, prefs.quietHoursStart, prefs.quietHoursEnd)) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A pattern we noticed',
        body: "You're approaching a time that's previously been higher-risk for you. Want to start a 10-minute reset?",
        data: { type: 'predictive' },
      },
      trigger: Platform.OS === 'web' ? null : ({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt } as const),
    });
    scheduled += 1;
  }

  if (prefs.checkinRemindersEnabled && !isWithinQuietHours(new Date(new Date().setHours(20, 0, 0, 0)), prefs.quietHoursStart, prefs.quietHoursEnd)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'How are you doing tonight?', body: 'A 30-second check-in helps track your progress.', data: { type: 'checkin' } },
      trigger:
        Platform.OS === 'web'
          ? null
          : ({ type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour: 20, minute: 0, repeats: true } as const),
    });
  }

  return scheduled;
}

function nextOccurrence(dayOfWeek: number, hour: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, 0, 0, 0);
  // 15 minutes ahead of the window start, so it lands as a heads-up.
  result.setMinutes(-15);
  let daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
  if (daysUntil === 0 && result.getTime() <= now.getTime()) daysUntil = 7;
  result.setDate(result.getDate() + daysUntil);
  return result;
}
