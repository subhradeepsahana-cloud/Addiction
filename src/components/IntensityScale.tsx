import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ColorPalette } from '@/theme/colors';
import { Text } from './Text';

interface Props {
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
  accessibilityLabel: string;
}

/**
 * Accessible 0-10 style intensity picker. Implemented as a row of tappable
 * numbers rather than a drag slider: it is easier to hit precisely, works
 * identically with screen readers, and needs no gesture dependency.
 */
export function IntensityScale({
  value,
  onChange,
  min = 0,
  max = 10,
  lowLabel,
  highLabel,
  accessibilityLabel,
}: Props) {
  const theme = useTheme();
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View>
      <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={accessibilityLabel}>
        {values.map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              accessibilityRole="button"
              accessibilityLabel={`${n}`}
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.cell,
                {
                  backgroundColor: selected ? colorForValue(theme, n, max) : theme.colors.surfaceMuted,
                  borderColor: selected ? colorForValue(theme, n, max) : theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                variant="label"
                style={{ color: selected ? theme.colors.onPrimary : theme.colors.textSecondary }}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {(lowLabel || highLabel) && (
        <View style={styles.labels}>
          <Text variant="caption" color="tertiary">
            {lowLabel}
          </Text>
          <Text variant="caption" color="tertiary">
            {highLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

function colorForValue(theme: { colors: ColorPalette }, n: number, max: number) {
  const ratio = n / max;
  if (ratio <= 0.4) return theme.colors.riskLow;
  if (ratio <= 0.7) return theme.colors.riskModerate;
  return theme.colors.riskHigh;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
});
