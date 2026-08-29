import React from 'react';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';

function TabIcon({ symbol, focused, color }: { symbol: string; focused: boolean; color: ColorValue }) {
  return (
    <Text style={{ fontSize: 20, color: color as string, opacity: focused ? 1 : 0.7 }} accessibilityElementsHidden>
      {symbol}
    </Text>
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundElevated,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: (p) => <TabIcon symbol="🏠" {...p} /> }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: 'Log', tabBarIcon: (p) => <TabIcon symbol="🥃" {...p} /> }}
      />
      <Tabs.Screen
        name="checkin"
        options={{ title: 'Check-in', tabBarIcon: (p) => <TabIcon symbol="📝" {...p} /> }}
      />
      <Tabs.Screen
        name="coach"
        options={{ title: 'Coach', tabBarIcon: (p) => <TabIcon symbol="💬" {...p} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: (p) => <TabIcon symbol="☰" {...p} /> }}
      />
    </Tabs>
  );
}
