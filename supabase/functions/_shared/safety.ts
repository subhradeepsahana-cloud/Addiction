// Deno port of src/lib/safety.ts — kept as a deterministic backstop inside
// Edge Functions (defense in depth; the client already runs the same rules
// before ever calling the AI). Keep these two files' RULES in sync.

export type SafetyLevel = 'none' | 'monitor' | 'urgent' | 'emergency';
export type SafetyCategory = 'self_harm' | 'medical_emergency' | 'withdrawal_risk' | 'none';

interface Rule {
  category: SafetyCategory;
  level: SafetyLevel;
  signal: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  { category: 'self_harm', level: 'emergency', signal: 'suicidal_ideation', pattern: /\b(kill myself|end my life|suicid|don'?t want to (live|be alive)|want to die|better off dead)\b/i },
  { category: 'self_harm', level: 'urgent', signal: 'self_harm_intent', pattern: /\b(hurt myself|harm myself|self[- ]harm|cutting myself)\b/i },
  { category: 'medical_emergency', level: 'emergency', signal: 'seizure', pattern: /\b(seizure|seizing|convuls)/i },
  { category: 'medical_emergency', level: 'emergency', signal: 'loss_of_consciousness', pattern: /\b(passed out and (won'?t|can'?t) wake|unconscious|unresponsive)\b/i },
  { category: 'medical_emergency', level: 'emergency', signal: 'breathing_or_cardiac', pattern: /\b(can'?t breathe|trouble breathing|chest pain|heart (racing|attack))\b/i },
  { category: 'medical_emergency', level: 'emergency', signal: 'possible_overdose', pattern: /\boverdos/i },
  { category: 'withdrawal_risk', level: 'urgent', signal: 'hallucination', pattern: /\b(hallucinat|seeing things|hearing things)\b/i },
  { category: 'withdrawal_risk', level: 'urgent', signal: 'confusion', pattern: /\b(confused|disoriented|don'?t know where i am)\b/i },
  { category: 'withdrawal_risk', level: 'urgent', signal: 'severe_tremors', pattern: /\b(shaking (badly|uncontrollably)|severe tremor)\b/i },
  { category: 'withdrawal_risk', level: 'urgent', signal: 'severe_vomiting', pattern: /\bcan'?t stop (throwing up|vomiting)\b/i },
];

export interface SafetyClassification {
  level: SafetyLevel;
  category: SafetyCategory;
  matchedSignals: string[];
}

export function classifySafety(text: string): SafetyClassification {
  const matches = RULES.filter((r) => r.pattern.test(text));
  if (matches.length === 0) return { level: 'none', category: 'none', matchedSignals: [] };
  const order: SafetyLevel[] = ['none', 'monitor', 'urgent', 'emergency'];
  const worst = matches.reduce((a, b) => (order.indexOf(b.level) > order.indexOf(a.level) ? b : a));
  return { level: worst.level, category: worst.category, matchedSignals: matches.map((m) => m.signal) };
}
