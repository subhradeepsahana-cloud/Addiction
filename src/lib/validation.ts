// Zod schemas that validate every piece of structured output the AI
// produces before it is ever trusted by application logic. Per the product
// requirement, free-form AI output is never trusted directly for critical
// state — everything routed through here is parsed strictly and rejected
// (falling back to a safe default / asking the user to confirm) on
// mismatch.

import { z } from 'zod';

export const drinkCategorySchema = z.enum(['beer', 'wine', 'whisky', 'vodka', 'rum', 'gin', 'cocktail', 'other']);
export const servingSizeSchema = z.enum(['small', 'regular', 'large', 'double']);

export const extractedDrinkSchema = z.object({
  drink_category: drinkCategorySchema,
  drink_name: z.string().min(1).max(80),
  quantity: z.number().positive().max(50),
  serving_size: servingSizeSchema,
  confidence: z.number().min(0).max(1),
});
export type ExtractedDrink = z.infer<typeof extractedDrinkSchema>;

export const drinkExtractionResponseSchema = z.object({
  drinks: z.array(extractedDrinkSchema).max(20),
  clarification_needed: z.boolean(),
  clarification_question: z.string().max(300).nullable(),
});
export type DrinkExtractionResponse = z.infer<typeof drinkExtractionResponseSchema>;

/** Parses a raw AI JSON string against a schema; returns null (never throws) on any mismatch. */
export function safeParseAiJson<T>(schema: z.ZodType<T>, raw: string): T | null {
  try {
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// ── AI safety classifier (edge function output, merged with the
// deterministic classifier — see src/lib/safety.ts combineSafetyLevel) ────
export const aiSafetyClassificationSchema = z.object({
  level: z.enum(['none', 'monitor', 'urgent', 'emergency']),
  category: z.enum(['self_harm', 'medical_emergency', 'withdrawal_risk', 'none']),
  rationale: z.string().max(500),
});
export type AiSafetyClassification = z.infer<typeof aiSafetyClassificationSchema>;

// ── AI Coach tool calls ────────────────────────────────────────────────
export const coachToolNameSchema = z.enum([
  'log_drink',
  'record_craving',
  'record_checkin',
  'retrieve_user_patterns',
  'retrieve_recent_history',
  'retrieve_health_sources',
  'save_intervention_result',
  'update_user_preferences',
]);

export const coachToolCallSchema = z.object({
  name: coachToolNameSchema,
  arguments: z.record(z.string(), z.unknown()),
});
export type CoachToolCall = z.infer<typeof coachToolCallSchema>;

// ── Personalized insight narrative (numbers always come from
// src/lib/insights.ts — the AI may only be asked to rephrase, never invent
// new numbers; this schema keeps that rephrasing bounded) ─────────────────
export const insightNarrativeSchema = z.object({
  text: z.string().min(1).max(400),
});

// ── Slip analysis narrative ─────────────────────────────────────────────
export const slipAnalysisResponseSchema = z.object({
  summary: z.string().min(1).max(600),
  suggestion: z.string().min(1).max(400),
});
export type SlipAnalysisResponse = z.infer<typeof slipAnalysisResponseSchema>;

// ── Health assistant answer ─────────────────────────────────────────────
export const healthAnswerSchema = z.object({
  answer: z.string().min(1).max(1200),
  citations: z.array(z.object({ article_id: z.string(), title: z.string(), source_name: z.string(), url: z.string() })).max(5),
  is_individual_medical_advice: z.literal(false),
});
export type HealthAnswer = z.infer<typeof healthAnswerSchema>;
