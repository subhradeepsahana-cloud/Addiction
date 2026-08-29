import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { TextField } from '@/components/TextField';
import { Chip, ChipGroup } from '@/components/Chip';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboardingStore } from '@/state/onboardingStore';

const DRINK_CATEGORIES = ['beer', 'wine', 'whisky', 'vodka', 'rum', 'gin', 'cocktail', 'other'];
const TIMES = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'late_night', label: 'Late night' },
  { value: 'varies', label: 'Varies' },
];
const SOCIAL = [
  { value: 'alone', label: 'Mostly alone' },
  { value: 'social', label: 'Mostly social' },
  { value: 'both', label: 'Both' },
];

export default function Baseline() {
  const theme = useTheme();
  const router = useRouter();
  const {
    baselineFrequencyPerWeek,
    baselineDrinksPerOccasion,
    preferredDrinkCategories,
    typicalDrinkingTime,
    typicalSocialContext,
    setField,
  } = useOnboardingStore();

  function toggleCategory(cat: string) {
    const next = preferredDrinkCategories.includes(cat)
      ? preferredDrinkCategories.filter((c) => c !== cat)
      : [...preferredDrinkCategories, cat];
    setField('preferredDrinkCategories', next);
  }

  return (
    <OnboardingScaffold
      step={3}
      totalSteps={6}
      title="Your drinking baseline"
      subtitle="This just helps us understand your starting point — there's no judgment here."
      onNext={() => router.push('/(onboarding)/triggers')}
      onBack={() => router.back()}
      skippable
      onSkip={() => router.push('/(onboarding)/triggers')}
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TextField
            label="Drinking days / week"
            keyboardType="numeric"
            placeholder="e.g. 3"
            value={baselineFrequencyPerWeek?.toString() ?? ''}
            onChangeText={(v) => setField('baselineFrequencyPerWeek', v ? Number(v) : null)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Drinks / occasion"
            keyboardType="numeric"
            placeholder="e.g. 2"
            value={baselineDrinksPerOccasion?.toString() ?? ''}
            onChangeText={(v) => setField('baselineDrinksPerOccasion', v ? Number(v) : null)}
          />
        </View>
      </View>

      <Text variant="label" color="secondary" style={{ marginBottom: theme.spacing.xs }}>
        Preferred drink types
      </Text>
      <ChipGroup>
        {DRINK_CATEGORIES.map((cat) => (
          <Chip key={cat} label={cat} selected={preferredDrinkCategories.includes(cat)} onPress={() => toggleCategory(cat)} />
        ))}
      </ChipGroup>

      <Text variant="label" color="secondary" style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
        Typical drinking time
      </Text>
      <ChipGroup>
        {TIMES.map((t) => (
          <Chip key={t.value} label={t.label} selected={typicalDrinkingTime === t.value} onPress={() => setField('typicalDrinkingTime', t.value)} />
        ))}
      </ChipGroup>

      <Text variant="label" color="secondary" style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
        Social or alone?
      </Text>
      <ChipGroup>
        {SOCIAL.map((s) => (
          <Chip key={s.value} label={s.label} selected={typicalSocialContext === s.value} onPress={() => setField('typicalSocialContext', s.value)} />
        ))}
      </ChipGroup>
    </OnboardingScaffold>
  );
}
