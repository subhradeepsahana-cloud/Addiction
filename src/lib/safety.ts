// Deterministic medical/safety-risk classification.
//
// This is the hard safety floor for the whole app: it must never depend on
// an LLM call succeeding, and no AI classifier is ever allowed to lower the
// severity this module assigns to a piece of text — only raise it further
// (see combineSafetyLevel). Keep this file free of any network/AI import.
//
// IMPORTANT: this module does not diagnose, does not manage withdrawal, and
// does not replace medical care. It only decides when to stop normal
// coaching and surface safety guidance / emergency resources instead.

export type SafetyCategory =
  | 'self_harm'
  | 'medical_emergency'
  | 'withdrawal_risk'
  | 'none';

export type SafetyLevel = 'none' | 'monitor' | 'urgent' | 'emergency';

export interface SafetyClassification {
  level: SafetyLevel;
  category: SafetyCategory;
  matchedSignals: string[];
  /** What the app should do next. Never "continue" once level !== 'none'. */
  action: 'continue' | 'show_withdrawal_guidance' | 'show_emergency_guidance' | 'show_crisis_guidance';
}

const SEVERITY_ORDER: SafetyLevel[] = ['none', 'monitor', 'urgent', 'emergency'];

function severityRank(level: SafetyLevel): number {
  return SEVERITY_ORDER.indexOf(level);
}

/** Combine two classifications, always keeping the more severe one. AI output
 * must be passed as `b` so a deterministic rule-based result can never be
 * silently downgraded by a model. */
export function combineSafetyLevel(a: SafetyClassification, b: SafetyClassification): SafetyClassification {
  return severityRank(b.level) > severityRank(a.level) ? b : a;
}

interface Rule {
  category: SafetyCategory;
  level: SafetyLevel;
  signal: string;
  pattern: RegExp;
}

// Deliberately conservative: prefer false positives (an unnecessary safety
// screen) over false negatives (missing a genuine emergency).
const RULES: Rule[] = [
  // ── Self-harm / suicidal ideation — always highest priority ──────────
  { category: 'self_harm', level: 'emergency', signal: 'suicidal_ideation', pattern: /\b(kill myself|end my life|suicid|don'?t want to (live|be alive)|want to die|better off dead)\b/i },
  { category: 'self_harm', level: 'urgent', signal: 'self_harm_intent', pattern: /\b(hurt myself|harm myself|self[- ]harm|cutting myself)\b/i },

  // ── Medical emergencies ───────────────────────────────────────────────
  { category: 'medical_emergency', level: 'emergency', signal: 'seizure', pattern: /\b(seizure|seizing|convuls)/i },
  { category: 'medical_emergency', level: 'emergency', signal: 'loss_of_consciousness', pattern: /\b(passed out and (won'?t|can'?t) wake|unconscious|unresponsive|can'?t wake (him|her|them|him up|her up))\b/i },
  { category: 'medical_emergency', level: 'emergency', signal: 'breathing_or_cardiac', pattern: /\b(can'?t breathe|trouble breathing|chest pain|heart (racing|attack))\b/i },
  { category: 'medical_emergency', level: 'emergency', signal: 'possible_overdose', pattern: /\boverdos/i },
  { category: 'medical_emergency', level: 'emergency', signal: 'vomiting_blood', pattern: /\b(vomit(ing)?|throwing up) blood\b/i },

  // ── Withdrawal risk — urgent but not (yet) a 911-level emergency ──────
  { category: 'withdrawal_risk', level: 'urgent', signal: 'hallucination', pattern: /\b(hallucinat|seeing things|hearing things|bugs (crawling|on my) skin)\b/i },
  { category: 'withdrawal_risk', level: 'urgent', signal: 'confusion', pattern: /\b(confused|disoriented|don'?t know where i am)\b/i },
  { category: 'withdrawal_risk', level: 'urgent', signal: 'severe_tremors', pattern: /\b(shaking (badly|uncontrollably|so much)|severe tremor|can'?t stop shaking)\b/i },
  { category: 'withdrawal_risk', level: 'urgent', signal: 'severe_vomiting', pattern: /\b(can'?t stop (throwing up|vomiting)|vomiting (a lot|non ?stop|repeatedly))\b/i },
  { category: 'withdrawal_risk', level: 'urgent', signal: 'rapid_heartbeat', pattern: /\b(heart (is )?racing|palpitations)\b/i },

  // ── Chronic heavy use planning to stop suddenly — advisory, not emergency ──
  {
    category: 'withdrawal_risk',
    level: 'monitor',
    signal: 'heavy_daily_use_stopping',
    pattern: /\b(drink(ing)? (heavily |a lot |every day )?every day|daily drinker|drink every single day).{0,60}\b(stop(ped|ping)? (suddenly|cold turkey|abruptly)|quit(ting)? (suddenly|cold turkey))\b/i,
  },
  {
    category: 'withdrawal_risk',
    level: 'monitor',
    signal: 'stopping_after_heavy_use',
    pattern: /\b(stopped|quit) (drinking )?(suddenly|cold turkey|abruptly).{0,60}\b(heavy|daily|every day|years)\b/i,
  },
];

export interface StructuredSafetySignals {
  /** Self-reported: drinks alcohol daily or near-daily, in large quantities. */
  dailyHeavyDrinking?: boolean;
  /** Self-reported: has recently stopped or sharply reduced after heavy use. */
  recentSuddenCessation?: boolean;
  /** Self-reported history of withdrawal seizures or delirium tremens. */
  priorSevereWithdrawalHistory?: boolean;
}

const NONE: SafetyClassification = { level: 'none', category: 'none', matchedSignals: [], action: 'continue' };

/**
 * Rule-based classification of free text (a chat message, a check-in note,
 * a craving note, etc.) plus optional structured self-report signals.
 * Deterministic — no network call, always returns synchronously.
 */
export function classifySafety(text: string, structured?: StructuredSafetySignals): SafetyClassification {
  const matched: Rule[] = RULES.filter((r) => r.pattern.test(text));

  let result: SafetyClassification = NONE;
  for (const rule of matched) {
    result = combineSafetyLevel(result, {
      level: rule.level,
      category: rule.category,
      matchedSignals: [rule.signal],
      action: actionForLevel(rule.level, rule.category),
    });
    // Preserve every matched signal name for audit logging.
    if (result.matchedSignals[0] !== rule.signal) {
      result = { ...result, matchedSignals: [...new Set([...result.matchedSignals, rule.signal])] };
    }
  }

  if (structured?.priorSevereWithdrawalHistory && (structured.recentSuddenCessation || structured.dailyHeavyDrinking)) {
    result = combineSafetyLevel(result, {
      level: 'urgent',
      category: 'withdrawal_risk',
      matchedSignals: ['prior_severe_withdrawal_history'],
      action: actionForLevel('urgent', 'withdrawal_risk'),
    });
  } else if (structured?.dailyHeavyDrinking && structured.recentSuddenCessation) {
    result = combineSafetyLevel(result, {
      level: 'monitor',
      category: 'withdrawal_risk',
      matchedSignals: ['heavy_daily_use_stopping'],
      action: actionForLevel('monitor', 'withdrawal_risk'),
    });
  }

  return result;
}

function actionForLevel(level: SafetyLevel, category: SafetyCategory): SafetyClassification['action'] {
  if (level === 'none') return 'continue';
  if (category === 'self_harm') return 'show_crisis_guidance';
  if (level === 'emergency') return 'show_emergency_guidance';
  return 'show_withdrawal_guidance';
}
