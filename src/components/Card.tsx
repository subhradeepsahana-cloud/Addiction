import React from 'react';
import { View, ViewStyle, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
  elevated?: boolean;
}

export function Card({ children, style, onPress, accessibilityLabel, elevated = true }: Props) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...(elevated
      ? {
          shadowColor: theme.colors.shadow,
          shadowOpacity: 1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }
      : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [base, style, pressed ? { opacity: 0.85 } : null]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}
