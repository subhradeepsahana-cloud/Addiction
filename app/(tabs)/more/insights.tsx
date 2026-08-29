import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useTheme } from '@/theme/ThemeProvider';
import { computeTriggerWindows, analyzeInterventionEffectiveness, labelForTrigger } from '@/lib/patterns';
import { getCravings } from '@/services/cravingService';
import { getDrinkingEvents } from '@/services/drinkService';
import { getSelectedTriggers } from '@/services/profileService';
import type { Craving, DrinkingEvent, TriggerTag } from '@/types/domain';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TriggerInsights() {
  const theme = useTheme();
  const [cravings, setCravings] = useState<Craving[]>([]);
  const [events, setEvents] = useState<DrinkingEvent[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<TriggerTag[]>([]);

  useEffect(() => {
    getCravings().then(setCravings);
    getDrinkingEvents().then(setEvents);
    getSelectedTriggers().then(setSelectedTriggers);
  }, []);

  const windows = computeTriggerWindows([...cravings.map((c) => ({ occurredAt: c.startedAt })), ...events.map((e) => ({ occurredAt: e.occurredAt }))]);
  const topWindows = windows.filter((w) => w.sampleSize >= 2).slice(0, 3);
  const effectiveness = analyzeInterventionEffectiveness(cravings);

  const triggerCounts = new Map<TriggerTag, number>();
  [...cravings.map((c) => c.trigger), ...events.map((e) => e.trigger)].forEach((t) => {
    if (t) triggerCounts.set(t, (triggerCounts.get(t) ?? 0) + 1);
  });
  const topTriggers = Array.from(triggerCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        Your Trigger Map
      </Text>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>TIME</Text>
        {topWindows.length === 0 && <Text variant="bodySmall" color="tertiary">Not enough data yet.</Text>}
        {topWindows.map((w, i) => (
          <Text key={i} variant="body">
            {DAY_NAMES[w.dayOfWeek]} {w.hourRange[0]}:00–{w.hourRange[1]}:00 · {w.sampleSize} occurrence{w.sampleSize === 1 ? '' : 's'}
          </Text>
        ))}
      </Card>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>YOUR SELECTED TRIGGERS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {selectedTriggers.map((t) => (
            <Text key={t} variant="bodySmall" color="secondary">
              {labelForTrigger(t)}
              {'  '}
            </Text>
          ))}
          {selectedTriggers.length === 0 && <Text variant="bodySmall" color="tertiary">None selected yet.</Text>}
        </View>
      </Card>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>MOST FREQUENT TRIGGERS (LOGGED)</Text>
        {topTriggers.length === 0 && <Text variant="bodySmall" color="tertiary">Not enough data yet.</Text>}
        {topTriggers.map(([tag, count]) => (
          <Text key={tag} variant="body">{labelForTrigger(tag)} — {count}×</Text>
        ))}
      </Card>

      <Card>
        <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>PROTECTIVE PATTERNS — WHAT'S WORKING</Text>
        {effectiveness.length === 0 && <Text variant="bodySmall" color="tertiary">Use interventions during a craving to build this up.</Text>}
        {effectiveness.slice(0, 5).map((e) => (
          <Text key={e.type} variant="body">
            {e.type.replace('_', ' ')} — {Math.round(e.resistRate * 100)}% resisted ({e.confidence} confidence)
          </Text>
        ))}
      </Card>
    </Screen>
  );
}
