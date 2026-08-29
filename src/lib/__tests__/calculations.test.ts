import { calculateStandardDrinks, calculateStreak, calculateMoneySaved, calculateDrinksAvoided } from '../calculations';

describe('calculateStandardDrinks', () => {
  it('computes standard drinks for a typical beer (355ml, 5% ABV)', () => {
    // 355ml * 0.05 = 17.75ml pure alcohol * 0.789 = 14.0055g / 14 ≈ 1.0
    expect(calculateStandardDrinks(355, 5)).toBeCloseTo(1.0, 1);
  });

  it('computes standard drinks for a large whisky (60ml, 40% ABV)', () => {
    expect(calculateStandardDrinks(60, 40)).toBeCloseTo(1.35, 1);
  });

  it('returns 0 for non-positive inputs', () => {
    expect(calculateStandardDrinks(0, 40)).toBe(0);
    expect(calculateStandardDrinks(100, 0)).toBe(0);
    expect(calculateStandardDrinks(-5, 40)).toBe(0);
  });
});

describe('calculateStreak', () => {
  const today = new Date('2026-08-29T12:00:00');
  const start = new Date('2026-08-01T00:00:00');

  it('returns full period as streak when there are no drinking events', () => {
    const result = calculateStreak([], today, start);
    expect(result.currentStreakDays).toBe(29); // Aug 1 - Aug 29 inclusive
    expect(result.alcoholFreeDaysInPeriod).toBe(29);
  });

  it('stops the current streak at the most recent drinking day', () => {
    const events = [{ occurredAt: '2026-08-25T20:00:00' }];
    const result = calculateStreak(events, today, start);
    // Aug 26,27,28,29 = 4 alcohol-free days since the last drink
    expect(result.currentStreakDays).toBe(4);
  });

  it('computes the longest streak across the period, not just the current one', () => {
    const events = [{ occurredAt: '2026-08-10T20:00:00' }, { occurredAt: '2026-08-28T20:00:00' }];
    const result = calculateStreak(events, today, start);
    expect(result.currentStreakDays).toBe(1); // only Aug 29
    expect(result.longestStreakDays).toBeGreaterThanOrEqual(17); // Aug 11-27
  });

  it('counts multiple drinks on the same day as a single drinking day', () => {
    const events = [{ occurredAt: '2026-08-28T18:00:00' }, { occurredAt: '2026-08-28T22:00:00' }];
    const result = calculateStreak(events, today, start);
    expect(result.alcoholFreeDaysInPeriod).toBe(28);
  });
});

describe('calculateMoneySaved', () => {
  it('estimates savings versus a self-reported baseline', () => {
    const today = new Date('2026-08-29T00:00:00');
    const start = new Date('2026-08-15T00:00:00'); // 2 weeks
    const saved = calculateMoneySaved({
      goal: 'quit',
      baselineDrinksPerWeek: 10,
      averageDrinkCost: 8,
      actualEvents: [],
      trackingStartDate: start,
      today,
    });
    // expected spend = 10 * 8 * 2 weeks = 160, actual spend = 0
    expect(saved).toBeCloseTo(160, 0);
  });

  it('never returns a negative number', () => {
    const today = new Date('2026-08-29T00:00:00');
    const start = new Date('2026-08-28T00:00:00');
    const saved = calculateMoneySaved({
      goal: 'reduce',
      baselineDrinksPerWeek: 1,
      averageDrinkCost: 5,
      actualEvents: [{ occurredAt: '2026-08-28T20:00:00', costEstimate: 500, quantity: 1 }],
      trackingStartDate: start,
      today,
    });
    expect(saved).toBe(0);
  });
});

describe('calculateDrinksAvoided', () => {
  it('computes avoided drinks relative to baseline', () => {
    expect(calculateDrinksAvoided(10, 4, 1)).toBe(6);
  });

  it('never returns negative', () => {
    expect(calculateDrinksAvoided(5, 20, 1)).toBe(0);
  });
});
