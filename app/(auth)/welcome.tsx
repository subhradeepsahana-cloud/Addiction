import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { env, isBackendConfigured } from '@/lib/env';

export default function Welcome() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing.xl }}>
        <View style={{ alignItems: 'center', marginTop: theme.spacing.xxl }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: theme.radii.xl,
              backgroundColor: theme.colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text style={{ fontSize: 40 }}>🌿</Text>
          </View>
          <Text variant="title" center>
            {env.appName}
          </Text>
          <Text variant="body" color="secondary" center style={{ marginTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}>
            A calm, private companion for understanding your relationship with alcohol — one day at a time.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md }}>
          <Button label="Create an account" onPress={() => router.push('/(auth)/sign-up')} fullWidth size="lg" />
          <Button label="Log in" variant="outline" onPress={() => router.push('/(auth)/sign-in')} fullWidth size="lg" />
          {!isBackendConfigured() && (
            <Button
              label="Continue without an account"
              variant="ghost"
              onPress={() => router.push('/(auth)/continue-locally')}
              fullWidth
            />
          )}
          <Text variant="caption" color="tertiary" center style={{ marginTop: theme.spacing.sm }}>
            Your data is private and protected. This app provides behavioral support and education — it is not a
            substitute for professional medical care.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
