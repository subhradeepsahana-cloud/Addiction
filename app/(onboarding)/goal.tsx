import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboardingStore } from '@/state/onboardingStore';
import { GOAL_OPTIONS } from '@/constants/drinkCatalog';
import type { Goal } from '@/types/domain';

export default function GoalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { goal, setField } = useOnboardingStore();

  return (
    <OnboardingScaffold
      step={2}
      totalSteps={6}
      title="What would you like to achieve?"
      subtitle="You can change this anytime — there's no wrong answer."
      onNext={() => router.push('/(onboarding)/baseline')}
      onBack={() => router.back()}
      nextDisabled={!goal}
    >
      <View style={{ gap: theme.spacing.sm }}>
        {GOAL_OPTIONS.map((opt) => {
          const selected = goal === opt.value;
          return (
            <Card
              key={opt.value}
              onPress={() => setField('goal', opt.value as Goal)}
              style={{
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                backgroundColor: selected ? theme.colors.primaryMuted : theme.colors.surface,
              }}
              accessibilityLabel={opt.label}
            >
              <Text variant="subheading">{opt.label}</Text>
              <Text variant="bodySmall" color="secondary" style={{ marginTop: 2 }}>
                {opt.description}
              </Text>
            </Card>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}
