import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { getPreferences } from '@/services/preferencesService';
import { getEmergencyResources } from '@/constants/emergencyResources';

export default function Safety() {
  const theme = useTheme();
  const [countryCode, setCountryCode] = useState('US');

  useEffect(() => {
    getPreferences().then((p) => setCountryCode(p.emergencyCountry));
  }, []);

  const resources = getEmergencyResources(countryCode);

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        Safety & Help
      </Text>

      <Card style={{ marginBottom: theme.spacing.sm, backgroundColor: theme.colors.dangerBg, borderWidth: 0 }}>
        <Text variant="label" color="danger">{resources.emergencyLabel}</Text>
        <Button label={`Call ${resources.emergencyNumber}`} variant="danger" fullWidth style={{ marginTop: theme.spacing.sm }} onPress={() => Linking.openURL(`tel:${resources.emergencyNumber.replace(/[^0-9]/g, '')}`)} />
      </Card>

      {resources.crisisLine && (
        <Card style={{ marginBottom: theme.spacing.sm }}>
          <Text variant="label">{resources.crisisLine.name}</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 2 }}>{resources.crisisLine.contact}</Text>
        </Card>
      )}

      {resources.alcoholSupportLine && (
        <Card style={{ marginBottom: theme.spacing.sm }}>
          <Text variant="label">{resources.alcoholSupportLine.name}</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 2 }}>{resources.alcoholSupportLine.contact}</Text>
        </Card>
      )}

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>When to seek urgent help</Text>
        <Text variant="body" color="secondary">
          Seek immediate medical attention for: seizures, hallucinations, confusion, severe tremors, severe vomiting, or loss of
          consciousness — especially after reducing or stopping heavy, regular drinking. These can be signs of dangerous alcohol
          withdrawal.
        </Text>
      </Card>

      <Card>
        <Text variant="caption" color="tertiary">
          This app provides educational and behavioral support and is not a substitute for professional medical care, diagnosis, or
          treatment. Suddenly stopping alcohol after heavy or prolonged drinking can carry serious health risks — seek medical
          guidance before doing so.
        </Text>
      </Card>
    </Screen>
  );
}
