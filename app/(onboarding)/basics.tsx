import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { TextField } from '@/components/TextField';
import { Chip, ChipGroup } from '@/components/Chip';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboardingStore } from '@/state/onboardingStore';

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const UNITS: { value: 'metric' | 'imperial'; label: string }[] = [
  { value: 'metric', label: 'Metric (ml)' },
  { value: 'imperial', label: 'Imperial (oz)' },
];

export default function Basics() {
  const theme = useTheme();
  const router = useRouter();
  const { displayName, ageRange, units, setField } = useOnboardingStore();

  return (
    <OnboardingScaffold
      step={1}
      totalSteps={6}
      title="Let's get to know you"
      subtitle="Just the basics — nothing here is shared with anyone."
      onNext={() => router.push('/(onboarding)/goal')}
      nextDisabled={!displayName.trim()}
    >
      <TextField
        label="What should we call you?"
        placeholder="Your name or nickname"
        value={displayName}
        onChangeText={(v) => setField('displayName', v)}
      />

      <Text variant="label" color="secondary" style={{ marginBottom: theme.spacing.xs }}>
        Age range (optional)
      </Text>
      <ChipGroup>
        {AGE_RANGES.map((range) => (
          <Chip key={range} label={range} selected={ageRange === range} onPress={() => setField('ageRange', range)} />
        ))}
      </ChipGroup>

      <View style={{ marginTop: theme.spacing.md }}>
        <Text variant="label" color="secondary" style={{ marginBottom: theme.spacing.xs }}>
          Preferred units
        </Text>
        <ChipGroup>
          {UNITS.map((u) => (
            <Chip key={u.value} label={u.label} selected={units === u.value} onPress={() => setField('units', u.value)} />
          ))}
        </ChipGroup>
      </View>
    </OnboardingScaffold>
  );
}
