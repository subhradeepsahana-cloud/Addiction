import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { Chip, ChipGroup } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboardingStore } from '@/state/onboardingStore';
import { MOTIVATION_OPTIONS } from '@/constants/drinkCatalog';
import type { MotivationTag } from '@/types/domain';

export default function Motivation() {
  const theme = useTheme();
  const router = useRouter();
  const { motivations, toggleMotivation, setMotivationText } = useOnboardingStore();

  return (
    <OnboardingScaffold
      step={5}
      totalSteps={6}
      title="Why do you want to change your relationship with alcohol?"
      subtitle="This becomes your 'My Why' — the app will remind you of it during difficult moments."
      onNext={() => router.push('/(onboarding)/complete')}
      onBack={() => router.back()}
      nextDisabled={motivations.length === 0}
    >
      <ChipGroup>
        {MOTIVATION_OPTIONS.map((opt) => (
          <Chip
            key={opt.tag}
            label={opt.label}
            selected={motivations.some((m) => m.tag === opt.tag)}
            onPress={() => toggleMotivation(opt.tag as MotivationTag)}
          />
        ))}
      </ChipGroup>

      {motivations.length > 0 && (
        <View style={{ marginTop: theme.spacing.md }}>
          <Text variant="label" color="secondary" style={{ marginBottom: theme.spacing.xs }}>
            Say a little more, in your own words (optional)
          </Text>
          {motivations.map((m) => {
            const label = MOTIVATION_OPTIONS.find((o) => o.tag === m.tag)?.label ?? m.tag;
            return (
              <TextField
                key={m.tag}
                label={label}
                placeholder={`Why does ${label.toLowerCase()} matter to you?`}
                value={m.freeText ?? ''}
                onChangeText={(v) => setMotivationText(m.tag, v)}
                multiline
              />
            );
          })}
        </View>
      )}
    </OnboardingScaffold>
  );
}
