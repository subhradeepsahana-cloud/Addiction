import {
  computeTriggerWindows,
  computeCurrentRisk,
  analyzeInterventionEffectiveness,
  compareAlcoholFreeVsDrinkingDays,
  findSlipPattern,
} from '../patterns';
import type { Craving, DailyCheckin, DrinkingEvent } from '@/types/domain';

function fridayAt(hour: number, weeksAgo = 0): string {
  // 2026-08-28 is a Friday
  const d = new Date('2026-08-28T00:00:00');
  d.setDate(d.getDate() - weeksAgo * 7);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

describe('computeTriggerWindows', () => {
  it('scores the busiest window as 1.0 and ranks others relatively', () => {
    const events = [
      { occurredAt: fridayAt(21, 0) },
      { occurredAt: fridayAt(21, 1) },
      { occurredAt: fridayAt(21, 2) },
      { occurredAt: fridayAt(10, 0) },
    ];
    const windows = computeTriggerWindows(events);
    expect(windows[0].score).toBe(1);
    expect(windows[0].dayOfWeek).toBe(5); // Friday
    expect(windows[0].sampleSize).toBe(3);
  });
});

describe('computeCurrentRisk', () => {
  it('returns high risk when now matches a strong historical window', () => {
    const events = [{ occurredAt: fridayAt(21, 0) }, { occurredAt: fridayAt(21, 1) }, { occurredAt: fridayAt(21, 2) }];
    const windows = computeTriggerWindows(events);
    const now = new Date(fridayAt(21, 3)); // same day/hour, different week
    const result = computeCurrentRisk(windows, now);
    expect(result.level).toBe('high');
  });

  it('returns low risk when there is not enough history', () => {
    const result = computeCurrentRisk([], new Date());
    expect(result.level).toBe('low');
    expect(result.matchedWindow).toBeNull();
  });
});

describe('analyzeInterventionEffectiveness', () => {
  it('ranks interventions by resist rate and intensity reduction', () => {
    const cravings: Craving[] = [
      mkCraving({ interventionsUsed: ['walk'], outcome: 'resisted', intensityBefore: 8, intensityAfter: 3 }),
      mkCraving({ interventionsUsed: ['walk'], outcome: 'resisted', intensityBefore: 7, intensityAfter: 2 }),
      mkCraving({ interventionsUsed: ['walk'], outcome: 'resisted', intensityBefore: 6, intensityAfter: 4 }),
      mkCraving({ interventionsUsed: ['breathing'], outcome: 'drank', intensityBefore: 8, intensityAfter: 7 }),
    ];
    const result = analyzeInterventionEffectiveness(cravings);
    expect(result[0].type).toBe('walk');
    expect(result[0].resistRate).toBe(1);
    expect(result[0].avgIntensityDelta).toBeGreaterThan(0);
  });

  it('returns an empty array when there are no cravings', () => {
    expect(analyzeInterventionEffectiveness([])).toEqual([]);
  });
});

describe('compareAlcoholFreeVsDrinkingDays', () => {
  it('reports insufficient data below the sample threshold', () => {
    const checkins: DailyCheckin[] = [mkCheckin({ drankAlcohol: false, stress: 3 })];
    const result = compareAlcoholFreeVsDrinkingDays(checkins);
    expect(result.hasSufficientData).toBe(false);
  });

  it('computes average stress separately for alcohol-free vs drinking days', () => {
    const free = Array.from({ length: 5 }, () => mkCheckin({ drankAlcohol: false, stress: 3 }));
    const drinking = Array.from({ length: 5 }, () => mkCheckin({ drankAlcohol: true, stress: 7 }));
    const result = compareAlcoholFreeVsDrinkingDays([...free, ...drinking]);
    expect(result.hasSufficientData).toBe(true);
    expect(result.avgStressAlcoholFree).toBe(3);
    expect(result.avgStressDrinking).toBe(7);
  });
});

describe('findSlipPattern', () => {
  it('identifies a repeating pattern when 2+ past events share the trigger', () => {
    const past: DrinkingEvent[] = [mkEvent({ trigger: 'stress' }), mkEvent({ trigger: 'stress' })];
    const result = findSlipPattern({ trigger: 'stress' }, past);
    expect(result.hasPattern).toBe(true);
    expect(result.matchingPastCount).toBe(2);
  });

  it('does not claim a pattern with fewer than 2 matches', () => {
    const result = findSlipPattern({ trigger: 'boredom' }, []);
    expect(result.hasPattern).toBe(false);
  });
});

function mkCraving(overrides: Partial<Craving>): Craving {
  return {
    id: 'c1',
    userId: 'u1',
    startedAt: new Date().toISOString(),
    intensityBefore: 5,
    intensityAfter: null,
    trigger: null,
    notes: null,
    outcome: null,
    interventionsUsed: [],
    completedAt: null,
    ...overrides,
  };
}

function mkCheckin(overrides: Partial<DailyCheckin>): DailyCheckin {
  return {
    id: 'ch1',
    userId: 'u1',
    date: '2026-08-01',
    mood: null,
    stress: null,
    craving: null,
    sleepHours: null,
    drankAlcohol: null,
    notes: null,
    ...overrides,
  };
}

function mkEvent(overrides: Partial<DrinkingEvent>): DrinkingEvent {
  return {
    id: 'e1',
    userId: 'u1',
    occurredAt: new Date().toISOString(),
    drinkCategory: 'beer',
    drinkName: 'Beer',
    quantity: 1,
    servingSize: 'regular',
    volumeMl: 355,
    abvPercent: 5,
    standardDrinks: 1,
    costEstimate: null,
    context: null,
    mood: null,
    trigger: null,
    notes: null,
    wasPlanned: null,
    locationLabel: null,
    source: 'manual',
    ...overrides,
  };
}
