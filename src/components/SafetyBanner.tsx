import React, { useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import { Screen } from './Screen';
import { Text } from './Text';
import { Button } from './Button';
import { Card } from './Card';
import { useTheme } from '@/theme/ThemeProvider';
import type { SafetyClassification } from '@/lib/safety';
import { getEmergencyResources } from '@/constants/emergencyResources';
import { getPreferences } from '@/services/preferencesService';

interface Props {
  classification: SafetyClassification;
  onDismiss: () => void;
}

const COPY: Record<SafetyClassification['category'], { title: string; body: string }> = {
  self_harm: {
    title: "Let's make sure you're safe",
    body:
      "What you shared sounds serious, and your safety matters more than anything else right now. You don't have to go through this alone — please reach out to a crisis line or emergency services below.",
  },
  medical_emergency: {
    title: 'This sounds like it could be a medical emergency',
    body:
      'Based on what you described, please contact emergency services right away, or get to an emergency room. This app cannot provide emergency medical care.',
  },
  withdrawal_risk: {
    title: 'Please consider medical guidance before continuing',
    body:
      "Stopping alcohol suddenly after regular heavy drinking can carry serious health risks. It's safest to talk to a doctor about how to do this safely — they can help create a plan, which may include medical supervision.",
  },
  none: { title: '', body: '' },
};

export function SafetyBanner({ classification, onDismiss }: Props) {
  const theme = useTheme();
  const [countryCode, setCountryCode] = useState('US');

  useEffect(() => {
    getPreferences().then((p) => setCountryCode(p.emergencyCountry));
  }, []);

  const copy = COPY[classification.category];
  const resources = getEmergencyResources(countryCode);
  const isEmergency = classification.level === 'emergency';

  return (
    <Screen backgroundColor={theme.colors.cravingBg}>
      <View style={{ marginTop: theme.spacing.lg }}>
        <Text variant="title" style={{ color: theme.colors.onDark }}>
          {copy.title}
        </Text>
        <Text variant="body" style={{ color: theme.colors.onDark, opacity: 0.85, marginTop: theme.spacing.sm }}>
          {copy.body}
        </Text>

        <Card style={{ marginTop: theme.spacing.lg, backgroundColor: theme.colors.dangerBg, borderWidth: 0 }}>
          <Text variant="label" color="danger">
            {resources.emergencyLabel}
          </Text>
          <Button
            label={`Call ${resources.emergencyNumber}`}
            variant="danger"
            fullWidth
            style={{ marginTop: theme.spacing.sm }}
            onPress={() => Linking.openURL(`tel:${resources.emergencyNumber.replace(/[^0-9]/g, '')}`)}
          />
        </Card>

        {resources.crisisLine && (
          <Card style={{ marginTop: theme.spacing.sm }}>
            <Text variant="label">{resources.crisisLine.name}</Text>
            <Text variant="body" color="secondary" style={{ marginTop: 2 }}>
              {resources.crisisLine.contact}
            </Text>
          </Card>
        )}

        {classification.category === 'withdrawal_risk' && resources.alcoholSupportLine && (
          <Card style={{ marginTop: theme.spacing.sm }}>
            <Text variant="label">{resources.alcoholSupportLine.name}</Text>
            <Text variant="body" color="secondary" style={{ marginTop: 2 }}>
              {resources.alcoholSupportLine.contact}
            </Text>
          </Card>
        )}

        <Text variant="caption" style={{ color: theme.colors.onDark, opacity: 0.6, marginTop: theme.spacing.lg }}>
          This app provides educational and behavioral support and is not a substitute for professional medical care,
          diagnosis, or treatment.
        </Text>

        {!isEmergency && classification.category !== 'self_harm' && (
          <Button
            label="I understand, continue"
            variant="ghost"
            onPress={onDismiss}
            fullWidth
            style={{ marginTop: theme.spacing.lg }}
          />
        )}
      </View>
    </Screen>
  );
}
