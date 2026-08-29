import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import type { RiskLevel } from '@/lib/patterns';

const LABEL: Record<RiskLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

// Color-independent icons so risk state never depends on color perception alone.
const ICON: Record<RiskLevel, string> = {
  low: '●',
  moderate: '▲',
  high: '■',
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const theme = useTheme();
  const bg = { low: theme.colors.riskLowBg, moderate: theme.colors.riskModerateBg, high: theme.colors.riskHighBg }[level];
  const fg = { low: theme.colors.riskLow, moderate: theme.colors.riskModerate, high: theme.colors.riskHigh }[level];

  return (
    <View
      style={[styles.base, { backgroundColor: bg, borderRadius: theme.radii.pill }]}
      accessibilityLabel={`Behavioral risk state: ${LABEL[level]}`}
    >
      <Text style={{ color: fg, marginRight: 6 }}>{ICON[level]}</Text>
      <Text variant="label" style={{ color: fg }}>
        {LABEL[level]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
