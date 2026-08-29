import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { RiskBadge } from '@/components/RiskBadge';
import { useTheme } from '@/theme/ThemeProvider';
import { getDashboardSnapshot, type DashboardSnapshot } from '@/services/dashboardService';
import { getProfile } from '@/services/profileService';
import { getActiveGoal } from '@/services/profileService';
import { getMotivationPhotos, resolvePhotoUri, type MotivationPhoto } from '@/services/motivationService';
import { GOAL_OPTIONS } from '@/constants/drinkCatalog';
import { Image } from 'expo-image';

export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [goal, setGoal] = useState<string | null>(null);
  const [heroPhoto, setHeroPhoto] = useState<{ uri: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [snap, profile, activeGoal, photos] = await Promise.all([
          getDashboardSnapshot(),
          getProfile(),
          getActiveGoal(),
          getMotivationPhotos(),
        ]);
        if (!active) return;
        setSnapshot(snap);
        setDisplayName(profile.displayName || 'there');
        setGoal(activeGoal);
        if (photos[0]) {
          const uri = await resolvePhotoUri(photos[0]);
          if (active) setHeroPhoto({ uri, description: photos[0].description });
        } else {
          setHeroPhoto(null);
        }
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const goalLabel = GOAL_OPTIONS.find((g) => g.value === goal)?.label;

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm }}>
        Hi {displayName}
      </Text>
      {goalLabel && (
        <Text variant="body" color="secondary" style={{ marginTop: 2 }}>
          Your goal: {goalLabel}
        </Text>
      )}

      {/* Primary action */}
      <Button
        label="I'm having a craving"
        onPress={() => router.push('/craving')}
        variant="danger"
        size="lg"
        fullWidth
        style={{ marginTop: theme.spacing.lg }}
        accessibilityHint="Starts a guided craving intervention"
      />
      <Button
        label="Log a drink"
        onPress={() => router.push('/(tabs)/log')}
        variant="outline"
        fullWidth
        style={{ marginTop: theme.spacing.sm }}
      />

      {snapshot && (
        <>
          <Card style={{ marginTop: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text variant="caption" color="tertiary">
                  ALCOHOL-FREE STREAK
                </Text>
                <Text variant="display" weight="bold" style={{ marginTop: 2 }}>
                  {snapshot.streak.currentStreakDays}
                </Text>
                <Text variant="bodySmall" color="secondary">
                  day{snapshot.streak.currentStreakDays === 1 ? '' : 's'}
                </Text>
              </View>
              <RiskBadge level={snapshot.risk.level} />
            </View>
            <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.sm }}>
              {snapshot.risk.reason}
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Card style={{ flex: 1 }}>
              <Text variant="caption" color="tertiary">
                MONEY SAVED (EST.)
              </Text>
              <Text variant="heading" style={{ marginTop: 2 }}>
                ${snapshot.moneySaved.toFixed(0)}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text variant="caption" color="tertiary">
                CRAVINGS HANDLED (30D)
              </Text>
              <Text variant="heading" style={{ marginTop: 2 }}>
                {snapshot.recentCravingsCount}
              </Text>
            </Card>
          </View>

          {snapshot.insights.length > 0 && (
            <Card style={{ marginTop: theme.spacing.sm, backgroundColor: theme.colors.primaryMuted, borderWidth: 0 }}>
              <Text variant="label" color="primary">
                Personalized insight
              </Text>
              <Text variant="body" style={{ marginTop: 4 }}>
                {snapshot.insights[0].text}
              </Text>
            </Card>
          )}
        </>
      )}

      {heroPhoto && (
        <Card onPress={() => router.push('/(tabs)/more/my-why')} style={{ marginTop: theme.spacing.sm, padding: 0, overflow: 'hidden' }}>
          <Image source={{ uri: heroPhoto.uri }} style={{ width: '100%', height: 160 }} contentFit="cover" />
          <View style={{ padding: theme.spacing.md }}>
            <Text variant="label" color="secondary">
              MY WHY
            </Text>
            <Text variant="body" style={{ marginTop: 4 }}>
              {heroPhoto.description}
            </Text>
          </View>
        </Card>
      )}

      {!loading && !heroPhoto && (
        <Card onPress={() => router.push('/(tabs)/more/my-why')} style={{ marginTop: theme.spacing.sm }}>
          <Text variant="label">Add your "My Why"</Text>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
            A photo and a few words about what matters most to you — shown back to you during tough moments.
          </Text>
        </Card>
      )}
    </Screen>
  );
}
