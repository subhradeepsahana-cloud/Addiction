// Privacy-conscious analytics (Section 34). Fire-and-forget, never throws,
// never sends free-text or PII — only the event name and small enum/count
// properties. Works locally even without a backend (events are simply
// dropped rather than queued, since analytics is non-critical).
import { getSupabase } from '@/lib/supabase';
import { currentUserId } from '@/state/authStore';

export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_completed'
  | 'drink_logged'
  | 'craving_started'
  | 'craving_completed'
  | 'intervention_selected'
  | 'intervention_successful'
  | 'trigger_alert_shown'
  | 'trigger_alert_opened'
  | 'daily_checkin_completed'
  | 'ai_coach_opened'
  | 'my_why_viewed'
  | 'slip_logged';

export function track(event: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}): void {
  const supabase = getSupabase();
  const userId = currentUserId();
  if (!supabase || !userId) return;
  supabase.from('analytics_events').insert({ user_id: userId, event_name: event, properties }).then(
    () => {},
    () => {}
  );
}
