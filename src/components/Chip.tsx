import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
}

export function Chip({ label, selected, onPress, accessibilityHint }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.md,
          minHeight: theme.minTouchTarget,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text variant="label" style={{ color: selected ? theme.colors.onPrimary : theme.colors.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
