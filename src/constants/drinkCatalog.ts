import type { DrinkCategory, ServingSize } from '@/types/domain';

export interface DrinkCatalogEntry {
  category: DrinkCategory;
  name: string;
  defaultAbvPercent: number;
  defaultVolumeMl: number;
}

// Mirrors supabase/migrations/0013_drink_types_seed.sql so the drink picker
// works identically offline and once a backend is connected.
export const DRINK_CATALOG: DrinkCatalogEntry[] = [
  { category: 'beer', name: 'Beer (regular)', defaultAbvPercent: 5.0, defaultVolumeMl: 355 },
  { category: 'beer', name: 'Beer (craft/strong)', defaultAbvPercent: 7.5, defaultVolumeMl: 355 },
  { category: 'wine', name: 'Wine (glass)', defaultAbvPercent: 12.5, defaultVolumeMl: 150 },
  { category: 'wine', name: 'Wine (large glass)', defaultAbvPercent: 12.5, defaultVolumeMl: 250 },
  { category: 'whisky', name: 'Whisky (single)', defaultAbvPercent: 40.0, defaultVolumeMl: 30 },
  { category: 'whisky', name: 'Whisky (double)', defaultAbvPercent: 40.0, defaultVolumeMl: 60 },
  { category: 'vodka', name: 'Vodka (single)', defaultAbvPercent: 40.0, defaultVolumeMl: 30 },
  { category: 'vodka', name: 'Vodka (double)', defaultAbvPercent: 40.0, defaultVolumeMl: 60 },
  { category: 'rum', name: 'Rum (single)', defaultAbvPercent: 40.0, defaultVolumeMl: 30 },
  { category: 'gin', name: 'Gin (single)', defaultAbvPercent: 40.0, defaultVolumeMl: 30 },
  { category: 'cocktail', name: 'Cocktail (standard)', defaultAbvPercent: 15.0, defaultVolumeMl: 200 },
  { category: 'other', name: 'Other', defaultAbvPercent: 10.0, defaultVolumeMl: 150 },
];

export const SERVING_SIZE_MULTIPLIER: Record<ServingSize, number> = {
  small: 0.75,
  regular: 1,
  large: 1.5,
  double: 2,
};

export const SERVING_SIZE_LABEL: Record<ServingSize, string> = {
  small: 'Small',
  regular: 'Regular',
  large: 'Large',
  double: 'Double',
};

export const TRIGGER_OPTIONS: { tag: string; label: string }[] = [
  { tag: 'stress', label: 'Stress' },
  { tag: 'work_pressure', label: 'Work pressure' },
  { tag: 'anxiety', label: 'Anxiety' },
  { tag: 'anger', label: 'Anger' },
  { tag: 'sadness', label: 'Sadness' },
  { tag: 'boredom', label: 'Boredom' },
  { tag: 'loneliness', label: 'Loneliness' },
  { tag: 'social_pressure', label: 'Social pressure' },
  { tag: 'parties', label: 'Parties' },
  { tag: 'certain_people', label: 'Certain people' },
  { tag: 'certain_locations', label: 'Certain locations' },
  { tag: 'certain_times', label: 'Certain times' },
  { tag: 'habit', label: 'Habit' },
  { tag: 'celebration', label: 'Celebration' },
  { tag: 'sleep', label: 'Sleep' },
  { tag: 'alcohol_available', label: 'Alcohol is available' },
  { tag: 'relationship', label: 'Relationship' },
  { tag: 'other', label: 'Other' },
];

export const MOTIVATION_OPTIONS: { tag: string; label: string }[] = [
  { tag: 'family', label: 'Family' },
  { tag: 'health', label: 'Health' },
  { tag: 'fitness', label: 'Fitness' },
  { tag: 'money', label: 'Money' },
  { tag: 'career', label: 'Career' },
  { tag: 'relationships', label: 'Relationships' },
  { tag: 'mental_clarity', label: 'Mental clarity' },
  { tag: 'sleep', label: 'Sleep' },
  { tag: 'personal_goals', label: 'Personal goals' },
  { tag: 'self_respect', label: 'Self-respect' },
  { tag: 'other', label: 'Other' },
];

export const GOAL_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: 'quit', label: 'Quit alcohol completely', description: 'Work toward being alcohol-free' },
  { value: 'reduce', label: 'Reduce drinking', description: 'Cut back to a healthier amount' },
  { value: 'break', label: 'Take a break', description: 'A defined period alcohol-free' },
  { value: 'understand', label: 'Understand my drinking', description: 'Build awareness first' },
  { value: 'unsure', label: "I'm not sure yet", description: 'That’s okay — we’ll figure it out together' },
];

export const INTERVENTION_OPTIONS: { type: string; label: string; icon: string }[] = [
  { type: 'walk', label: 'Take a 10-minute walk', icon: '🚶' },
  { type: 'water', label: 'Drink water', icon: '💧' },
  { type: 'eat', label: 'Eat something', icon: '🍎' },
  { type: 'exercise', label: 'Exercise', icon: '🏃' },
  { type: 'shower', label: 'Take a shower', icon: '🚿' },
  { type: 'contact_someone', label: 'Contact someone', icon: '📞' },
  { type: 'my_why', label: 'Look at My Why', icon: '💛' },
  { type: 'breathing', label: 'Breathing exercise', icon: '🌬️' },
  { type: 'change_location', label: 'Change location', icon: '🚪' },
  { type: 'ai_coach', label: 'Talk to AI Coach', icon: '💬' },
];
