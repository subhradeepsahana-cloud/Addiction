import React from 'react';
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  helperText?: string;
}

export function TextField({ label, error, helperText, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      {label && (
        <Text variant="label" color="secondary" style={{ marginBottom: theme.spacing.xxs }}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={theme.colors.textTertiary}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            color: theme.colors.textPrimary,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md,
            minHeight: theme.minTouchTarget,
            fontSize: theme.typography.size.base,
          },
          style,
        ]}
        {...rest}
      />
      {(error || helperText) && (
        <Text variant="caption" color={error ? 'danger' : 'tertiary'} style={{ marginTop: theme.spacing.xxs }}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1 },
});
