// Client-side gateway to the OpenAI-backed Supabase Edge Functions. Every
// function here degrades gracefully when the backend isn't configured or a
// call fails — core tracking, craving mode, and safety must never depend on
// AI being reachable (Section 36).

import { getSupabase } from '@/lib/supabase';
import { isBackendConfigured } from '@/lib/env';
import {
  drinkExtractionResponseSchema,
  slipAnalysisResponseSchema,
  healthAnswerSchema,
  type DrinkExtractionResponse,
  type SlipAnalysisResponse,
  type HealthAnswer,
} from '@/lib/validation';
import { classifySafety, type SafetyClassification, combineSafetyLevel } from '@/lib/safety';
import { logAppError } from './base';

export interface AiResult<T> {
  data: T | null;
  unavailable: boolean;
  error: string | null;
}

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<{ raw: T | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase || !isBackendConfigured()) {
    return { raw: null, error: 'AI features require Supabase + OpenAI to be configured (see .env.example).' };
  }
  try {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    return { raw: data as T, error: null };
  } catch (e) {
    await logAppError('ai:' + name, e instanceof Error ? e.message : 'unknown error');
    return { raw: null, error: 'The AI service is temporarily unavailable. You can still log manually.' };
  }
}

export async function extractDrinksFromText(text: string): Promise<AiResult<DrinkExtractionResponse>> {
  const { raw, error } = await invokeFunction<unknown>('extract-drink', { text });
  if (error || !raw) return { data: null, unavailable: true, error };
  const parsed = drinkExtractionResponseSchema.safeParse(raw);
  if (!parsed.success) return { data: null, unavailable: false, error: 'Could not understand that — try quick log instead.' };
  return { data: parsed.data, unavailable: false, error: null };
}

export interface CoachReply {
  message: string;
  safety: SafetyClassification;
  conversationId: string;
}

/**
 * Sends a message to the AI Coach. Runs the deterministic safety classifier
 * on the user's text FIRST and locally — if it trips, the message is never
 * even sent to the model; the app shows safety guidance immediately. Any
 * AI-side classification is merged in afterward and can only raise the
 * severity further, never lower it.
 */
export async function sendCoachMessage(
  conversationId: string | null,
  message: string,
  context: 'coach' | 'craving' = 'coach'
): Promise<AiResult<CoachReply> & { safety: SafetyClassification }> {
  const localSafety = classifySafety(message);
  if (localSafety.level !== 'none') {
    return {
      data: { message: '', safety: localSafety, conversationId: conversationId ?? '' },
      unavailable: false,
      error: null,
      safety: localSafety,
    };
  }

  const { raw, error } = await invokeFunction<{ message: string; conversationId: string; safety?: { level: string; category: string } }>(
    'ai-coach',
    { conversationId, message, context }
  );
  if (error || !raw) return { data: null, unavailable: true, error, safety: localSafety };

  const aiSafety: SafetyClassification = raw.safety
    ? {
        level: raw.safety.level as SafetyClassification['level'],
        category: raw.safety.category as SafetyClassification['category'],
        matchedSignals: ['ai_classifier'],
        action:
          raw.safety.level === 'none' ? 'continue' : raw.safety.category === 'self_harm' ? 'show_crisis_guidance' : 'show_withdrawal_guidance',
      }
    : localSafety;
  const finalSafety = combineSafetyLevel(localSafety, aiSafety);

  return {
    data: { message: raw.message, safety: finalSafety, conversationId: raw.conversationId },
    unavailable: false,
    error: null,
    safety: finalSafety,
  };
}

export async function analyzeSlip(context: Record<string, unknown>): Promise<AiResult<SlipAnalysisResponse>> {
  const { raw, error } = await invokeFunction<unknown>('slip-analysis', context);
  if (error || !raw) return { data: null, unavailable: true, error };
  const parsed = slipAnalysisResponseSchema.safeParse(raw);
  if (!parsed.success) return { data: null, unavailable: false, error: 'Could not analyze this right now.' };
  return { data: parsed.data, unavailable: false, error: null };
}

export async function askHealthQuestion(question: string): Promise<AiResult<HealthAnswer>> {
  const localSafety = classifySafety(question);
  if (localSafety.level !== 'none') {
    return { data: null, unavailable: false, error: 'safety_intercept' };
  }
  const { raw, error } = await invokeFunction<unknown>('health-assistant', { question });
  if (error || !raw) return { data: null, unavailable: true, error };
  const parsed = healthAnswerSchema.safeParse(raw);
  if (!parsed.success) return { data: null, unavailable: false, error: 'Could not generate a cited answer right now.' };
  return { data: parsed.data, unavailable: false, error: null };
}
