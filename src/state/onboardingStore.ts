import { create } from 'zustand';
import type { Goal, TriggerTag, MotivationTag } from '@/types/domain';

interface OnboardingDraft {
  displayName: string;
  ageRange: string | null;
  units: 'metric' | 'imperial';
  currency: string;
  goal: Goal | null;
  baselineFrequencyPerWeek: number | null;
  baselineDrinksPerOccasion: number | null;
  preferredDrinkCategories: string[];
  typicalDrinkingTime: string | null;
  typicalSocialContext: string | null;
  commonSituations: string[];
  triggers: TriggerTag[];
  motivations: { tag: MotivationTag; freeText: string | null }[];

  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  toggleTrigger: (tag: TriggerTag) => void;
  toggleMotivation: (tag: MotivationTag) => void;
  setMotivationText: (tag: MotivationTag, text: string) => void;
  reset: () => void;
}

const initial = {
  displayName: '',
  ageRange: null as string | null,
  units: 'metric' as const,
  currency: 'USD',
  goal: null as Goal | null,
  baselineFrequencyPerWeek: null as number | null,
  baselineDrinksPerOccasion: null as number | null,
  preferredDrinkCategories: [] as string[],
  typicalDrinkingTime: null as string | null,
  typicalSocialContext: null as string | null,
  commonSituations: [] as string[],
  triggers: [] as TriggerTag[],
  motivations: [] as { tag: MotivationTag; freeText: string | null }[],
};

export const useOnboardingStore = create<OnboardingDraft>((set, get) => ({
  ...initial,
  setField: (key, value) => set({ [key]: value } as Partial<OnboardingDraft>),
  toggleTrigger: (tag) => {
    const current = get().triggers;
    set({ triggers: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag] });
  },
  toggleMotivation: (tag) => {
    const current = get().motivations;
    const exists = current.some((m) => m.tag === tag);
    set({ motivations: exists ? current.filter((m) => m.tag !== tag) : [...current, { tag, freeText: null }] });
  },
  setMotivationText: (tag, text) => {
    const current = get().motivations;
    set({ motivations: current.map((m) => (m.tag === tag ? { ...m, freeText: text } : m)) });
  },
  reset: () => set(initial),
}));
