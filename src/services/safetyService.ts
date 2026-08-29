import { localStore, Collections, makeLocalId } from '@/lib/localStore';
import { getSupabase } from '@/lib/supabase';
import { classifySafety, type SafetyClassification, type StructuredSafetySignals } from '@/lib/safety';
import { requireUserId } from './base';

export interface SafetyEventRecord {
  id: string;
  userId: string;
  level: SafetyClassification['level'];
  category: SafetyClassification['category'];
  matchedSignals: string[];
  sourceContext: 'checkin' | 'ai_chat' | 'craving_note' | 'onboarding';
  createdAt: string;
}

/**
 * Runs the deterministic safety check on a piece of user text, and — if it
 * is not clean — logs an audit event (classification metadata only, never
 * the raw text) both locally and to Supabase when configured.
 */
export async function checkAndLogSafety(
  text: string,
  sourceContext: SafetyEventRecord['sourceContext'],
  structured?: StructuredSafetySignals
): Promise<SafetyClassification> {
  const classification = classifySafety(text, structured);
  if (classification.level === 'none') return classification;

  const userId = requireUserId();
  const record: SafetyEventRecord = {
    id: makeLocalId(),
    userId,
    level: classification.level,
    category: classification.category,
    matchedSignals: classification.matchedSignals,
    sourceContext,
    createdAt: new Date().toISOString(),
  };
  await localStore.insert(Collections.safetyEvents, record);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('safety_events').insert({
        user_id: userId,
        level: classification.level,
        category: classification.category,
        matched_signals: classification.matchedSignals,
        source_context: sourceContext,
        action_shown: classification.action,
      });
    } catch {
      // non-fatal — the local audit record still exists
    }
  }

  return classification;
}
