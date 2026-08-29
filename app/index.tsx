import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/state/authStore';
import { getProfile } from '@/services/profileService';

export default function Index() {
  const theme = useTheme();
  const { user, initializing } = useAuthStore();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    if (!user) {
      setCheckingProfile(false);
      return;
    }
    getProfile().then((p) => {
      setOnboarded(!!p.onboardingCompletedAt);
      setCheckingProfile(false);
    });
  }, [user]);

  if (initializing || checkingProfile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!onboarded) return <Redirect href="/(onboarding)/basics" />;
  return <Redirect href="/(tabs)" />;
}
