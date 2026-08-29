import React, { useEffect, useState } from 'react';
import { View, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { IntensityScale } from '@/components/IntensityScale';
import { useTheme } from '@/theme/ThemeProvider';
import { getTodayCheckin, submitCheckin } from '@/services/checkinService';
import { checkAndLogSafety } from '@/services/safetyService';
import { SafetyBanner } from '@/components/SafetyBanner';
import type { SafetyClassification } from '@/lib/safety';

export default function Checkin() {
  const theme = useTheme();
  const router = useRouter();
  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [craving, setCraving] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [drankAlcohol, setDrankAlcohol] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [safety, setSafety] = useState<SafetyClassification | null>(null);

  useEffect(() => {
    getTodayCheckin().then((c) => {
      if (c) {
        setMood(c.mood);
        setStress(c.stress);
        setCraving(c.craving);
        setSleepHours(c.sleepHours?.toString() ?? '');
        setDrankAlcohol(!!c.drankAlcohol);
        setNotes(c.notes ?? '');
        setAlreadyDone(true);
      }
    });
  }, []);

  async function handleSubmit() {
    if (notes.trim()) {
      const classification = await checkAndLogSafety(notes, 'checkin');
      if (classification.level !== 'none') {
        setSafety(classification);
        return;
      }
    }
    setSaving(true);
    await submitCheckin({ mood, stress, craving, sleepHours: sleepHours ? Number(sleepHours) : null, drankAlcohol, notes: notes || null });
    setSaving(false);
    router.back();
  }

  if (safety) {
    return <SafetyBanner classification={safety} onDismiss={() => setSafety(null)} />;
  }

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm }}>
        Daily check-in
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: 4, marginBottom: theme.spacing.md }}>
        {alreadyDone ? "You've already checked in today — feel free to update it." : 'Takes about 30 seconds.'}
      </Text>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.sm }}>
          Mood
        </Text>
        <IntensityScale value={mood} onChange={setMood} min={1} max={10} lowLabel="Low" highLabel="Great" accessibilityLabel="Mood" />
      </Card>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.sm }}>
          Stress
        </Text>
        <IntensityScale value={stress} onChange={setStress} min={1} max={10} lowLabel="Calm" highLabel="High" accessibilityLabel="Stress" />
      </Card>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.sm }}>
          Craving
        </Text>
        <IntensityScale value={craving} onChange={setCraving} min={0} max={10} lowLabel="None" highLabel="Strong" accessibilityLabel="Craving" />
      </Card>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label">Did you drink alcohol today?</Text>
          <Switch value={drankAlcohol} onValueChange={setDrankAlcohol} trackColor={{ true: theme.colors.primary }} />
        </View>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <TextField
          label="Sleep (hours, optional)"
          keyboardType="numeric"
          value={sleepHours}
          onChangeText={setSleepHours}
          placeholder="e.g. 7"
        />
        <TextField label="Anything important? (optional)" multiline value={notes} onChangeText={setNotes} />
      </Card>

      <Button label="Save check-in" onPress={handleSubmit} loading={saving} fullWidth size="lg" />
      <Button label="Skip for now" variant="ghost" onPress={() => router.back()} fullWidth />
    </Screen>
  );
}
