// Deterministic personalized-insight copy generation. Every insight here is
// derived strictly from computed statistics in src/lib/patterns.ts — never
// invented, never fetched from the AI. The AI Coach may add conversational
// framing elsewhere, but the underlying numbers always originate here so an
// insight can never outrun what the data actually supports.

import {
  analyzeInterventionEffectiveness,
  compareAlcoholFreeVsDrinkingDays,
  computeTriggerWindows,
  MIN_SAMPLE_FOR_INSIGHT,
} from './patterns';
import type { Craving, DailyCheckin, DrinkingEvent } from '@/types/domain';

export interface Insight {
  id: string;
  text: string;
  kind: 'pattern' | 'protective' | 'progress' | 'neutral';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function generateInsights(input: {
  cravings: Craving[];
  drinkingEvents: DrinkingEvent[];
  checkins: DailyCheckin[];
}): Insight[] {
  const insights: Insight[] = [];
  const { cravings, drinkingEvents, checkins } = input;

  // 1. Highest-risk window
  const riskEvents = [...cravings.map((c) => ({ occurredAt: c.startedAt })), ...drinkingEvents.map((e) => ({ occurredAt: e.occurredAt }))];
  const windows = computeTriggerWindows(riskEvents);
  const top = windows[0];
  if (top && top.sampleSize >= 3) {
    insights.push({
      id: 'top-window',
      kind: 'pattern',
      text: `Your history suggests ${DAY_NAMES[top.dayOfWeek]}s between ${formatHour(top.hourRange[0])}–${formatHour(top.hourRange[1])} are one of your higher-risk windows.`,
    });
  }

  // 2. Successful cravings this month
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const resistedThisMonth = cravings.filter((c) => c.outcome === 'resisted' && new Date(c.startedAt) >= monthAgo).length;
  if (resistedThisMonth > 0) {
    insights.push({
      id: 'resisted-count',
      kind: 'progress',
      text: `You've gotten through ${resistedThisMonth} craving${resistedThisMonth === 1 ? '' : 's'} without drinking in the last 30 days. That's useful data about what works for you.`,
    });
  }

  // 3. Most effective intervention
  const effectiveness = analyzeInterventionEffectiveness(cravings);
  const best = effectiveness.find((e) => e.confidence !== 'low' && e.avgIntensityDelta > 0);
  if (best) {
    insights.push({
      id: 'best-intervention',
      kind: 'protective',
      text: `${labelForIntervention(best.type)} appears to reduce your craving intensity more consistently than other strategies (${Math.round(best.resistRate * 100)}% resisted when used).`,
    });
  }

  // 4. Alcohol-free vs drinking day comparison
  const comparison = compareAlcoholFreeVsDrinkingDays(checkins);
  if (comparison.hasSufficientData && comparison.avgStressAlcoholFree !== null && comparison.avgStressDrinking !== null) {
    const diff = comparison.avgStressDrinking - comparison.avgStressAlcoholFree;
    if (Math.abs(diff) >= 0.5) {
      insights.push({
        id: 'stress-comparison',
        kind: 'protective',
        text:
          diff > 0
            ? `On days you didn't drink, your average reported stress was lower (${comparison.avgStressAlcoholFree}/10 vs ${comparison.avgStressDrinking}/10 on drinking days).`
            : `Drinking days and alcohol-free days show similar stress levels for you — stress alone may not be your main driver.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: 'insufficient-data',
      kind: 'neutral',
      text: "I don't have enough data to identify a reliable pattern yet. Keep logging check-ins and cravings and this will improve.",
    });
  }

  return insights;
}

function formatHour(hour: number): string {
  const h = hour % 24;
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

function labelForIntervention(type: string): string {
  const labels: Record<string, string> = {
    walk: 'Taking a walk',
    water: 'Drinking water',
    eat: 'Eating something',
    exercise: 'Exercise',
    shower: 'Taking a shower',
    contact_someone: 'Reaching out to someone',
    my_why: 'Looking at My Why',
    breathing: 'Breathing exercises',
    change_location: 'Changing location',
    ai_coach: 'Talking to the AI Coach',
    other: 'That strategy',
  };
  return labels[type] ?? type;
}

export { MIN_SAMPLE_FOR_INSIGHT };
