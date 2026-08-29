import { calculateStreak, calculateMoneySaved, calculateDrinksAvoided, type StreakResult } from '@/lib/calculations';
import { computeTriggerWindows, computeCurrentRisk, type CurrentRiskResult } from '@/lib/patterns';
import { generateInsights, type Insight } from '@/lib/insights';
import { getDrinkingEvents } from './drinkService';
import { getCravings } from './cravingService';
import { getCheckins } from './checkinService';
import { getProfile } from './profileService';

export interface DashboardSnapshot {
  streak: StreakResult;
  moneySaved: number;
  drinksAvoided: number;
  risk: CurrentRiskResult;
  insights: Insight[];
  recentCravingsCount: number;
}

export async function getDashboardSnapshot(now: Date = new Date()): Promise<DashboardSnapshot> {
  const [drinkingEvents, cravings, checkins, profile] = await Promise.all([
    getDrinkingEvents(),
    getCravings(),
    getCheckins(),
    getProfile(),
  ]);

  const trackingStart = new Date(profile.trackingStartDate);
  const streak = calculateStreak(drinkingEvents, now, trackingStart);

  const weeksTracked = Math.max((now.getTime() - trackingStart.getTime()) / (1000 * 60 * 60 * 24 * 7), 0);
  const moneySaved = calculateMoneySaved({
    goal: 'quit',
    baselineDrinksPerWeek: profile.baselineFrequencyPerWeek ?? 0,
    averageDrinkCost: profile.averageDrinkCost ?? 0,
    actualEvents: drinkingEvents,
    trackingStartDate: trackingStart,
    today: now,
  });
  const totalStandardDrinks = drinkingEvents.reduce((sum, e) => sum + e.standardDrinks, 0);
  const drinksAvoided = calculateDrinksAvoided(profile.baselineFrequencyPerWeek ?? 0, totalStandardDrinks, weeksTracked);

  const riskEvents = [
    ...cravings.map((c) => ({ occurredAt: c.startedAt })),
    ...drinkingEvents.map((e) => ({ occurredAt: e.occurredAt })),
  ];
  const windows = computeTriggerWindows(riskEvents);
  const risk = computeCurrentRisk(windows, now);

  const insights = generateInsights({ cravings, drinkingEvents, checkins });

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCravingsCount = cravings.filter((c) => new Date(c.startedAt) >= thirtyDaysAgo).length;

  return { streak, moneySaved, drinksAvoided, risk, insights, recentCravingsCount };
}
