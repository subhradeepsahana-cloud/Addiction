import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useTheme } from '@/theme/ThemeProvider';

const ITEMS = [
  { href: '/(tabs)/more/progress', icon: '📈', label: 'Progress' },
  { href: '/(tabs)/more/insights', icon: '🎯', label: 'Trigger Insights' },
  { href: '/(tabs)/more/my-why', icon: '💛', label: 'My Why' },
  { href: '/(tabs)/more/health', icon: '📚', label: 'Health & Science' },
  { href: '/(tabs)/more/settings', icon: '⚙️', label: 'Settings' },
  { href: '/(tabs)/more/safety', icon: '🛟', label: 'Safety & Help' },
] as const;

export default function More() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        More
      </Text>
      <View>
        {ITEMS.map((item) => (
          <Card key={item.href} onPress={() => router.push(item.href as never)} style={{ marginBottom: theme.spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, marginRight: theme.spacing.sm }}>{item.icon}</Text>
            <Text variant="subheading">{item.label}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
