import { classifySafety, combineSafetyLevel } from '../safety';

describe('classifySafety — dangerous input detection', () => {
  it('escalates suicidal ideation to emergency + crisis guidance', () => {
    const result = classifySafety('I want to kill myself');
    expect(result.level).toBe('emergency');
    expect(result.category).toBe('self_harm');
    expect(result.action).toBe('show_crisis_guidance');
  });

  it('detects a reported seizure as a medical emergency', () => {
    const result = classifySafety('I just had a seizure');
    expect(result.level).toBe('emergency');
    expect(result.category).toBe('medical_emergency');
    expect(result.action).toBe('show_emergency_guidance');
  });

  it('detects hallucinations as an urgent withdrawal risk', () => {
    const result = classifySafety('I am seeing things that aren\'t there');
    expect(result.level).toBe('urgent');
    expect(result.category).toBe('withdrawal_risk');
    expect(result.action).toBe('show_withdrawal_guidance');
  });

  it('detects severe tremors', () => {
    const result = classifySafety('I am shaking badly and can\'t stop');
    expect(result.level).toBe('urgent');
    expect(result.category).toBe('withdrawal_risk');
  });

  it('detects sudden cessation after chronic heavy drinking as monitor-level advisory', () => {
    const result = classifySafety('I drink heavily every day and stopped suddenly yesterday');
    expect(result.level).toBe('monitor');
    expect(result.category).toBe('withdrawal_risk');
  });

  it('returns none for an ordinary message with no danger signals', () => {
    const result = classifySafety('I had a stressful day at work and want to talk it through');
    expect(result.level).toBe('none');
    expect(result.action).toBe('continue');
  });

  it('never lets a lower-severity structured signal downgrade a higher text match', () => {
    const combined = combineSafetyLevel(
      { level: 'emergency', category: 'self_harm', matchedSignals: ['x'], action: 'show_crisis_guidance' },
      { level: 'monitor', category: 'withdrawal_risk', matchedSignals: ['y'], action: 'show_withdrawal_guidance' }
    );
    expect(combined.level).toBe('emergency');
  });

  it('escalates when a structured signal is more severe than any text match', () => {
    const combined = combineSafetyLevel(
      { level: 'none', category: 'none', matchedSignals: [], action: 'continue' },
      { level: 'urgent', category: 'withdrawal_risk', matchedSignals: ['z'], action: 'show_withdrawal_guidance' }
    );
    expect(combined.level).toBe('urgent');
  });

  it('flags prior severe withdrawal history combined with current heavy use as urgent', () => {
    const result = classifySafety('just checking in today', {
      priorSevereWithdrawalHistory: true,
      dailyHeavyDrinking: true,
    });
    expect(result.level).toBe('urgent');
  });
});
