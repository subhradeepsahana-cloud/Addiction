import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { Chip, ChipGroup } from '@/components/Chip';
import { useOnboardingStore } from '@/state/onboardingStore';
import { TRIGGER_OPTIONS } from '@/constants/drinkCatalog';
import type { TriggerTag } from '@/types/domain';

export default function Triggers() {
  const router = useRouter();
  const { triggers, toggleTrigger } = useOnboardingStore();

  return (
    <OnboardingScaffold
      step={4}
      totalSteps={6}
      title="What tends to make you want to drink?"
      subtitle="Select everything that applies. This helps the app recognize your patterns."
      onNext={() => router.push('/(onboarding)/motivation')}
      onBack={() => router.back()}
      skippable
      onSkip={() => router.push('/(onboarding)/motivation')}
    >
      <ChipGroup>
        {TRIGGER_OPTIONS.map((opt) => (
          <Chip
            key={opt.tag}
            label={opt.label}
            selected={triggers.includes(opt.tag as TriggerTag)}
            onPress={() => toggleTrigger(opt.tag as TriggerTag)}
          />
        ))}
      </ChipGroup>
    </OnboardingScaffold>
  );
}
