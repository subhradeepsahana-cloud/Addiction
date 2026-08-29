// Core domain types shared across the app, services, and business-logic
// modules in src/lib. These mirror the Supabase schema (see
// supabase/migrations) but are kept independent of any ORM/client so the
// pure logic in src/lib stays trivially unit-testable.

export type Goal = 'quit' | 'reduce' | 'break' | 'understand' | 'unsure';

export type TriggerTag =
  | 'stress'
  | 'work_pressure'
  | 'anxiety'
  | 'anger'
  | 'sadness'
  | 'boredom'
  | 'loneliness'
  | 'social_pressure'
  | 'parties'
  | 'certain_people'
  | 'certain_locations'
  | 'certain_times'
  | 'habit'
  | 'celebration'
  | 'sleep'
  | 'alcohol_available'
  | 'relationship'
  | 'other';

export type MotivationTag =
  | 'family'
  | 'health'
  | 'fitness'
  | 'money'
  | 'career'
  | 'relationships'
  | 'mental_clarity'
  | 'sleep'
  | 'personal_goals'
  | 'self_respect'
  | 'other';

export type DrinkCategory = 'beer' | 'wine' | 'whisky' | 'vodka' | 'rum' | 'gin' | 'cocktail' | 'other';

export type ServingSize = 'small' | 'regular' | 'large' | 'double';

export interface DrinkType {
  id: string;
  category: DrinkCategory;
  name: string;
  defaultAbvPercent: number;
  defaultVolumeMl: number;
  isCustom: boolean;
}

export interface DrinkingEvent {
  id: string;
  userId: string;
  occurredAt: string; // ISO timestamp
  drinkCategory: DrinkCategory;
  drinkName: string;
  quantity: number;
  servingSize: ServingSize;
  volumeMl: number;
  abvPercent: number;
  standardDrinks: number;
  costEstimate: number | null;
  context: string | null;
  mood: number | null; // 1-10
  trigger: TriggerTag | null;
  notes: string | null;
  wasPlanned: boolean | null;
  locationLabel: string | null;
  source: 'manual' | 'nl_extraction' | 'craving_slip';
}

export interface Craving {
  id: string;
  userId: string;
  startedAt: string;
  intensityBefore: number; // 0-10
  intensityAfter: number | null;
  trigger: TriggerTag | null;
  notes: string | null;
  outcome: 'resisted' | 'drank' | 'unresolved' | null;
  interventionsUsed: string[];
  completedAt: string | null;
}

export interface CravingIntervention {
  id: string;
  cravingId: string;
  userId: string;
  type: InterventionType;
  startedAt: string;
  completedAt: string | null;
  markedHelpful: boolean | null;
}

export type InterventionType =
  | 'walk'
  | 'water'
  | 'eat'
  | 'exercise'
  | 'shower'
  | 'contact_someone'
  | 'my_why'
  | 'breathing'
  | 'change_location'
  | 'ai_coach'
  | 'other';

export interface DailyCheckin {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: number | null;
  stress: number | null;
  craving: number | null;
  sleepHours: number | null;
  drankAlcohol: boolean | null;
  notes: string | null;
}

export interface ProtectivePattern {
  factors: string[];
  occurrences: number;
  alcoholFreeRate: number; // 0-1
  confidence: 'low' | 'medium' | 'high';
}

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface TriggerWindow {
  dayOfWeek: number; // 0=Sunday
  hourRange: [number, number];
  score: number;
  sampleSize: number;
}

export interface UserPreferences {
  userId: string;
  units: 'metric' | 'imperial';
  currency: string;
  averageDrinkCost: number | null;
  timezone: string;
  quietHoursStart: string | null; // HH:mm
  quietHoursEnd: string | null;
  triggerAlertsEnabled: boolean;
  motivationalNotificationsEnabled: boolean;
  checkinRemindersEnabled: boolean;
  notificationFrequency: 'low' | 'normal' | 'high';
  locationEnabled: boolean;
  calendarEnabled: boolean;
  aiDataSharingConsent: boolean;
  emergencyCountry: string;
}
