import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  backgroundColor?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({ children, scroll = true, padded = true, style, backgroundColor, refreshing, onRefresh }: Props) {
  const theme = useTheme();
  const bg = backgroundColor ?? theme.colors.background;
  const content = padded ? { padding: theme.spacing.md } : undefined;

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
        <View style={[styles.flex, content, style]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[content, style]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
