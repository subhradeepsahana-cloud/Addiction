import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodySmall' | 'caption' | 'label';
type Color = 'primary' | 'secondary' | 'tertiary' | 'onPrimary' | 'accent' | 'success' | 'warning' | 'danger' | 'inherit';

interface Props extends TextProps {
  variant?: Variant;
  color?: Color;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  center?: boolean;
}

export function Text({ variant = 'body', color = 'primary', weight, center, style, ...rest }: Props) {
  const theme = useTheme();
  const variantStyle = variantStyles(theme)[variant];
  const colorValue = resolveColor(theme, color);
  return (
    <RNText
      accessibilityRole={variant === 'title' || variant === 'heading' ? 'header' : undefined}
      style={[
        variantStyle,
        { color: colorValue },
        weight ? { fontWeight: theme.typography.weight[weight] } : null,
        center ? styles.center : null,
        style,
      ]}
      {...rest}
    />
  );
}

function resolveColor(theme: ReturnType<typeof useTheme>, color: Color) {
  switch (color) {
    case 'primary':
      return theme.colors.textPrimary;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'tertiary':
      return theme.colors.textTertiary;
    case 'onPrimary':
      return theme.colors.onPrimary;
    case 'accent':
      return theme.colors.accent;
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'danger':
      return theme.colors.danger;
    case 'inherit':
    default:
      return undefined;
  }
}

function variantStyles(theme: ReturnType<typeof useTheme>) {
  const { size, lineHeight, weight } = theme.typography;
  return StyleSheet.create({
    display: { fontSize: size.display, lineHeight: lineHeight.display, fontWeight: weight.bold },
    title: { fontSize: size.xxl, lineHeight: lineHeight.xxl, fontWeight: weight.bold },
    heading: { fontSize: size.xl, lineHeight: lineHeight.xl, fontWeight: weight.semibold },
    subheading: { fontSize: size.lg, lineHeight: lineHeight.lg, fontWeight: weight.semibold },
    body: { fontSize: size.base, lineHeight: lineHeight.base, fontWeight: weight.regular },
    bodySmall: { fontSize: size.sm, lineHeight: lineHeight.sm, fontWeight: weight.regular },
    caption: { fontSize: size.xs, lineHeight: lineHeight.xs, fontWeight: weight.regular },
    label: { fontSize: size.sm, lineHeight: lineHeight.sm, fontWeight: weight.semibold },
  });
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
