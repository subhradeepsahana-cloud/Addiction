import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useTheme } from '@/theme/ThemeProvider';
import { getDashboardSnapshot, type DashboardSnapshot } from '@/services/dashboardService';
import { getCheckins } from '@/services/checkinService';
import { getCravings } from '@/services/cravingService';
import type { DailyCheckin, Craving } from '@/types/domain';

export default function Progress() {
  const theme = useTheme();
  const [snap, setSnap] = useState<DashboardSnapshot | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [cravings, setCravings] = useState<Craving[]>([]);

  useEffect(() => {
    getDashboardSnapshot().then(setSnap);
    getCheckins().then(setCheckins);
    getCravings().then(setCravings);
  }, []);

  const resisted = cravings.filter((c) => c.outcome === 'resisted').length;
  const drank = cravings.filter((c) => c.outcome === 'drank').length;
  const avgMood = average(checkins.map((c) => c.mood));
  const avgStress = average(checkins.map((c) => c.stress));

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        Progress
      </Text>

      {snap && (
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <Card style={{ flex: 1 }}>
            <Text variant="caption" color="tertiary">CURRENT STREAK</Text>
            <Text variant="heading">{snap.streak.currentStreakDays}d</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text variant="caption" color="tertiary">LONGEST STREAK</Text>
            <Text variant="heading">{snap.streak.longestStreakDays}d</Text>
          </Card>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        <Card style={{ flex: 1 }}>
          <Text variant="caption" color="tertiary">CRAVINGS RESISTED</Text>
          <Text variant="heading">{resisted}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text variant="caption" color="tertiary">SLIPS LOGGED</Text>
          <Text variant="heading">{drank}</Text>
        </Card>
      </View>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>Check-in averages ({checkins.length} logged)</Text>
        <Text variant="body" color="secondary">Mood: {avgMood ?? '—'}/10 · Stress: {avgStress ?? '—'}/10</Text>
      </Card>

      {snap?.insights.map((insight) => (
        <Card key={insight.id} style={{ marginBottom: theme.spacing.sm }}>
          <Text variant="body">{insight.text}</Text>
        </Card>
      ))}
    </Screen>
  );
}

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number');
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
