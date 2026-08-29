import React from 'react';
import { Pressable, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  accessibilityHint?: string;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  icon,
  accessibilityHint,
  style,
}: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: theme.colors.primary, fg: theme.colors.onPrimary },
    secondary: { bg: theme.colors.accent, fg: theme.colors.onAccent },
    outline: { bg: 'transparent', fg: theme.colors.primary, border: theme.colors.primary },
    ghost: { bg: 'transparent', fg: theme.colors.primary },
    danger: { bg: theme.colors.danger, fg: '#FFFFFF' },
  };
  const p = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: p.bg,
          borderColor: p.border ?? 'transparent',
          borderWidth: p.border ? 1.5 : 0,
          minHeight: size === 'lg' ? 56 : theme.minTouchTarget,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radii.pill,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon}
          <Text
            variant={size === 'lg' ? 'subheading' : 'label'}
            weight="semibold"
            style={{ color: p.fg, marginLeft: icon ? 8 : 0 }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
