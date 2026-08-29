import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboardingStore } from '@/state/onboardingStore';
import { saveProfile, completeOnboarding, setActiveGoal, saveSelectedTriggers } from '@/services/profileService';
import { saveMotivations } from '@/services/motivationService';
import { scheduleTriggerAlerts } from '@/services/notificationService';
import { track } from '@/services/analyticsService';

export default function Complete() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useOnboardingStore();
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    await saveProfile({
      displayName: draft.displayName,
      ageRange: draft.ageRange,
      units: draft.units,
      baselineFrequencyPerWeek: draft.baselineFrequencyPerWeek,
      baselineDrinksPerOccasion: draft.baselineDrinksPerOccasion,
      preferredDrinkCategories: draft.preferredDrinkCategories,
      typicalDrinkingTime: draft.typicalDrinkingTime,
      typicalSocialContext: draft.typicalSocialContext,
      commonSituations: draft.commonSituations,
    });
    if (draft.goal) await setActiveGoal(draft.goal);
    if (draft.triggers.length) await saveSelectedTriggers(draft.triggers);
    if (draft.motivations.length) await saveMotivations(draft.motivations.map((m) => ({ tag: m.tag, freeText: m.freeText })));
    await completeOnboarding();
    track('onboarding_completed');
    scheduleTriggerAlerts().catch(() => {});
    draft.reset();
    setSaving(false);
    router.replace('/(tabs)');
  }

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.lg }}>
        <Text style={{ fontSize: 48, marginBottom: theme.spacing.md }}>🌿</Text>
        <Text variant="title" center>
          Let's take this one day at a time.
        </Text>
        <Text variant="body" color="secondary" center style={{ marginTop: theme.spacing.sm }}>
          Your dashboard, streak, and My Why are ready. When a craving hits, we'll be right there with you.
        </Text>
        <View style={{ marginTop: theme.spacing.xl, width: '100%' }}>
          <Button label="Go to my dashboard" onPress={finish} loading={saving} fullWidth size="lg" />
        </View>
      </View>
    </Screen>
  );
}
