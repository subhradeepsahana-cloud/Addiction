// Deterministic behavioral pattern engine: trigger windows, current risk
// state, protective-pattern detection, and intervention effectiveness.
//
// Everything here is computed directly from the user's own stored events —
// no AI call, no invented patterns. Every function returns an explicit
// "insufficient data" signal instead of guessing when sample sizes are too
// small to be meaningful, per the product requirement to never fabricate a
// pattern.

import type { Craving, DrinkingEvent, DailyCheckin, InterventionType, RiskLevel, TriggerTag, TriggerWindow } from '@/types/domain';

export type { RiskLevel } from '@/types/domain';

const MIN_SAMPLE_FOR_WINDOW = 3;
const MIN_SAMPLE_FOR_INSIGHT = 5;

interface RiskEvent {
  occurredAt: string;
}

/**
 * Buckets craving + drinking events into (day-of-week, hour-range) windows
 * and scores each bucket by how often it appears relative to the busiest
 * bucket. `bucketHours` controls window width (default 2h, e.g. 20:00-22:00).
 */
export function computeTriggerWindows(events: RiskEvent[], bucketHours = 2): TriggerWindow[] {
  const buckets = new Map<string, { dayOfWeek: number; hourRange: [number, number]; count: number }>();

  for (const e of events) {
    const d = new Date(e.occurredAt);
    const dayOfWeek = d.getDay();
    const hourStart = Math.floor(d.getHours() / bucketHours) * bucketHours;
    const hourEnd = Math.min(24, hourStart + bucketHours);
    const key = `${dayOfWeek}-${hourStart}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(key, { dayOfWeek, hourRange: [hourStart, hourEnd], count: 1 });
    }
  }

  const maxCount = Math.max(1, ...Array.from(buckets.values()).map((b) => b.count));

  return Array.from(buckets.values())
    .map((b) => ({
      dayOfWeek: b.dayOfWeek,
      hourRange: b.hourRange,
      score: Math.round((b.count / maxCount) * 100) / 100,
      sampleSize: b.count,
    }))
    .sort((a, b) => b.score - a.score);
}

export interface CurrentRiskResult {
  level: RiskLevel;
  matchedWindow: TriggerWindow | null;
  reason: string;
}

/**
 * Determines the user's current behavioral risk state by checking whether
 * "now" falls inside one of their historically high-scoring trigger
 * windows. This is a pattern-match against the user's own history, not a
 * medical or diagnostic prediction — copy referencing this must always use
 * hedged language ("your history suggests...").
 */
export function computeCurrentRisk(windows: TriggerWindow[], now: Date): CurrentRiskResult {
  const eligible = windows.filter((w) => w.sampleSize >= MIN_SAMPLE_FOR_WINDOW);
  if (eligible.length === 0) {
    return { level: 'low', matchedWindow: null, reason: 'Not enough history yet to detect a pattern.' };
  }

  const dow = now.getDay();
  const hour = now.getHours();
  const match = eligible.find((w) => w.dayOfWeek === dow && hour >= w.hourRange[0] && hour < w.hourRange[1]);

  if (!match) {
    return { level: 'low', matchedWindow: null, reason: 'This time doesn’t match a known high-risk window for you.' };
  }

  if (match.score >= 0.66) {
    return { level: 'high', matchedWindow: match, reason: 'This is one of your most frequent historical trigger windows.' };
  }
  if (match.score >= 0.33) {
    return { level: 'moderate', matchedWindow: match, reason: 'This time has moderately matched past cravings or drinking.' };
  }
  return { level: 'low', matchedWindow: match, reason: 'This window has only occasionally matched past patterns.' };
}

export interface InterventionEffectiveness {
  type: InterventionType;
  timesUsed: number;
  resistRate: number;
  avgIntensityDelta: number;
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Ranks interventions by how well they've historically worked for THIS
 * user: resist rate (did the craving end without drinking) and average
 * intensity reduction (before → after).
 */
export function analyzeInterventionEffectiveness(cravings: Craving[]): InterventionEffectiveness[] {
  const byType = new Map<InterventionType, { used: number; resisted: number; deltas: number[] }>();

  for (const c of cravings) {
    if (!c.interventionsUsed?.length) continue;
    for (const type of c.interventionsUsed as InterventionType[]) {
      const entry = byType.get(type) ?? { used: 0, resisted: 0, deltas: [] };
      entry.used += 1;
      if (c.outcome === 'resisted') entry.resisted += 1;
      if (typeof c.intensityAfter === 'number') {
        entry.deltas.push(c.intensityBefore - c.intensityAfter);
      }
      byType.set(type, entry);
    }
  }

  return Array.from(byType.entries())
    .map(([type, e]) => ({
      type,
      timesUsed: e.used,
      resistRate: e.used > 0 ? Math.round((e.resisted / e.used) * 100) / 100 : 0,
      avgIntensityDelta: e.deltas.length ? Math.round((e.deltas.reduce((a, b) => a + b, 0) / e.deltas.length) * 10) / 10 : 0,
      confidence: confidenceForSampleSize(e.used),
    }))
    .sort((a, b) => b.resistRate - a.resistRate || b.avgIntensityDelta - a.avgIntensityDelta);
}

function confidenceForSampleSize(n: number): 'low' | 'medium' | 'high' {
  if (n >= 10) return 'high';
  if (n >= MIN_SAMPLE_FOR_WINDOW) return 'medium';
  return 'low';
}

export interface ProtectiveDayComparison {
  hasSufficientData: boolean;
  alcoholFreeDayCount: number;
  drinkingDayCount: number;
  avgStressAlcoholFree: number | null;
  avgStressDrinking: number | null;
  avgMoodAlcoholFree: number | null;
  avgMoodDrinking: number | null;
  avgSleepAlcoholFree: number | null;
  avgSleepDrinking: number | null;
}

/**
 * Compares self-reported check-in metrics between alcohol-free days and
 * drinking days, to surface what tends to differ (e.g. "on alcohol-free
 * days your average stress was lower / you slept more").
 */
export function compareAlcoholFreeVsDrinkingDays(checkins: DailyCheckin[]): ProtectiveDayComparison {
  const free = checkins.filter((c) => c.drankAlcohol === false);
  const drinking = checkins.filter((c) => c.drankAlcohol === true);

  return {
    hasSufficientData: free.length >= MIN_SAMPLE_FOR_INSIGHT && drinking.length >= MIN_SAMPLE_FOR_INSIGHT,
    alcoholFreeDayCount: free.length,
    drinkingDayCount: drinking.length,
    avgStressAlcoholFree: average(free.map((c) => c.stress)),
    avgStressDrinking: average(drinking.map((c) => c.stress)),
    avgMoodAlcoholFree: average(free.map((c) => c.mood)),
    avgMoodDrinking: average(drinking.map((c) => c.mood)),
    avgSleepAlcoholFree: average(free.map((c) => c.sleepHours)),
    avgSleepDrinking: average(drinking.map((c) => c.sleepHours)),
  };
}

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number');
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export interface SlipPatternMatch {
  hasPattern: boolean;
  matchingPastCount: number;
  trigger: TriggerTag | null;
  summary: string;
}

/**
 * Looks for repetition between a new slip (drinking event logged after a
 * period of trying to stay alcohol-free) and the user's past drinking
 * events sharing the same trigger, to surface "this followed the same
 * pattern as N previous times" — grounded strictly in matching trigger tags,
 * never inferred sentiment.
 */
export function findSlipPattern(newSlip: { trigger: TriggerTag | null }, pastEvents: DrinkingEvent[]): SlipPatternMatch {
  if (!newSlip.trigger) {
    return { hasPattern: false, matchingPastCount: 0, trigger: null, summary: 'Not enough information to identify a pattern.' };
  }
  const matches = pastEvents.filter((e) => e.trigger === newSlip.trigger);
  if (matches.length < 2) {
    return {
      hasPattern: false,
      matchingPastCount: matches.length,
      trigger: newSlip.trigger,
      summary: 'This doesn’t yet match a repeating pattern in your history.',
    };
  }
  return {
    hasPattern: true,
    matchingPastCount: matches.length,
    trigger: newSlip.trigger,
    summary: `This followed the same pattern as ${matches.length} previous episode${matches.length === 1 ? '' : 's'} involving ${labelForTrigger(newSlip.trigger)}.`,
  };
}

export function labelForTrigger(tag: TriggerTag): string {
  const labels: Record<TriggerTag, string> = {
    stress: 'stress',
    work_pressure: 'work pressure',
    anxiety: 'anxiety',
    anger: 'anger',
    sadness: 'sadness',
    boredom: 'boredom',
    loneliness: 'loneliness',
    social_pressure: 'social pressure',
    parties: 'parties',
    certain_people: 'certain people',
    certain_locations: 'certain locations',
    certain_times: 'certain times',
    habit: 'habit',
    celebration: 'celebration',
    sleep: 'sleep',
    alcohol_available: 'alcohol being available',
    relationship: 'relationship situations',
    other: 'other factors',
  };
  return labels[tag];
}

export { MIN_SAMPLE_FOR_INSIGHT, MIN_SAMPLE_FOR_WINDOW };
