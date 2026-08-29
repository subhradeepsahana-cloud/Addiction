import React from 'react';
import { View } from 'react-native';
import { Screen } from './Screen';
import { Text } from './Text';
import { Button } from './Button';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  skippable?: boolean;
  onSkip?: () => void;
}

export function OnboardingScaffold({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled,
  skippable,
  onSkip,
}: Props) {
  const theme = useTheme();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: theme.spacing.lg, marginTop: theme.spacing.sm }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < step ? theme.colors.primary : theme.colors.surfaceMuted,
            }}
          />
        ))}
      </View>

      <Text variant="heading">{title}</Text>
      {subtitle && (
        <Text variant="body" color="secondary" style={{ marginTop: theme.spacing.xs }}>
          {subtitle}
        </Text>
      )}

      <View style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl }}>{children}</View>

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={nextLabel} onPress={onNext} disabled={nextDisabled} fullWidth size="lg" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {onBack ? <Button label="Back" variant="ghost" onPress={onBack} /> : <View />}
          {skippable && <Button label="Skip" variant="ghost" onPress={onSkip ?? (() => {})} />}
        </View>
      </View>
    </Screen>
  );
}
