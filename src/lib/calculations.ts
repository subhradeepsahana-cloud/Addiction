// Deterministic, dependency-free calculations for alcohol tracking.
// Kept pure so they are trivially unit-testable and never depend on AI.

import type { DrinkingEvent } from '@/types/domain';

/**
 * Standard drink units, following the widely used definition of one
 * standard drink containing ~14 grams (≈17.7ml) of pure ethanol (US NIAAA
 * definition). This is an estimate for behavioral tracking, not a medical
 * measurement of blood alcohol content.
 */
const GRAMS_ETHANOL_PER_STANDARD_DRINK = 14;
const ETHANOL_DENSITY_G_PER_ML = 0.789;

export function calculateStandardDrinks(volumeMl: number, abvPercent: number): number {
  if (volumeMl <= 0 || abvPercent <= 0) return 0;
  const pureAlcoholMl = volumeMl * (abvPercent / 100);
  const grams = pureAlcoholMl * ETHANOL_DENSITY_G_PER_ML;
  const standardDrinks = grams / GRAMS_ETHANOL_PER_STANDARD_DRINK;
  return Math.round(standardDrinks * 100) / 100;
}

export interface StreakResult {
  currentStreakDays: number;
  longestStreakDays: number;
  alcoholFreeDaysInPeriod: number;
  totalDaysInPeriod: number;
}

/**
 * Computes the current alcohol-free streak (in whole days, ending "today")
 * from a set of drinking events and an explicit "today" reference (so it is
 * testable without relying on wall-clock time).
 *
 * A day counts as a drinking day if any DrinkingEvent occurred_at falls on
 * that local date. The streak is the number of consecutive alcohol-free
 * days immediately preceding (and including) today, walking backwards
 * until a drinking day or the start of the tracked period is hit.
 */
export function calculateStreak(
  events: Pick<DrinkingEvent, 'occurredAt'>[],
  today: Date,
  trackingStartDate: Date
): StreakResult {
  const drinkingDates = new Set(events.map((e) => toDateKey(new Date(e.occurredAt))));

  const totalDaysInPeriod = Math.max(1, diffDays(trackingStartDate, today) + 1);

  let currentStreakDays = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  const start = new Date(trackingStartDate);
  start.setHours(0, 0, 0, 0);

  while (cursor.getTime() >= start.getTime()) {
    const key = toDateKey(cursor);
    if (drinkingDates.has(key)) break;
    currentStreakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak across the whole tracked period.
  let longestStreakDays = 0;
  let running = 0;
  const iter = new Date(start);
  while (iter.getTime() <= today.getTime()) {
    const key = toDateKey(iter);
    if (drinkingDates.has(key)) {
      running = 0;
    } else {
      running += 1;
      longestStreakDays = Math.max(longestStreakDays, running);
    }
    iter.setDate(iter.getDate() + 1);
  }

  const alcoholFreeDaysInPeriod = totalDaysInPeriod - drinkingDates.size;

  return {
    currentStreakDays,
    longestStreakDays,
    alcoholFreeDaysInPeriod: Math.max(0, alcoholFreeDaysInPeriod),
    totalDaysInPeriod,
  };
}

export interface MoneySavedInput {
  goal: 'quit' | 'reduce' | 'break' | 'understand' | 'unsure';
  baselineDrinksPerWeek: number;
  averageDrinkCost: number;
  actualEvents: Pick<DrinkingEvent, 'occurredAt' | 'costEstimate' | 'quantity'>[];
  trackingStartDate: Date;
  today: Date;
}

/**
 * Estimates money saved by comparing the user's self-reported baseline
 * spend against what they actually spent while tracked. Always presented
 * to the user as an estimate, never a precise figure.
 */
export function calculateMoneySaved(input: MoneySavedInput): number {
  const { baselineDrinksPerWeek, averageDrinkCost, actualEvents, trackingStartDate, today } = input;
  const weeksTracked = Math.max(diffDays(trackingStartDate, today) / 7, 0);
  const expectedSpend = baselineDrinksPerWeek * averageDrinkCost * weeksTracked;

  const actualSpend = actualEvents.reduce((sum, e) => {
    if (typeof e.costEstimate === 'number') return sum + e.costEstimate;
    return sum + e.quantity * averageDrinkCost;
  }, 0);

  return Math.max(0, Math.round((expectedSpend - actualSpend) * 100) / 100);
}

export function calculateDrinksAvoided(baselineDrinksPerWeek: number, actualStandardDrinks: number, weeksTracked: number): number {
  const expected = baselineDrinksPerWeek * Math.max(weeksTracked, 0);
  return Math.max(0, Math.round((expected - actualStandardDrinks) * 10) / 10);
}

function toDateKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function diffDays(from: Date, to: Date): number {
  const a = new Date(from);
  a.setHours(0, 0, 0, 0);
  const b = new Date(to);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
