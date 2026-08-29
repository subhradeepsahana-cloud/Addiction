import React, { useEffect, useState } from 'react';
import { View, Switch, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip, ChipGroup } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeProvider';
import { getPreferences, updatePreferences } from '@/services/preferencesService';
import { scheduleTriggerAlerts } from '@/services/notificationService';
import { SUPPORTED_EMERGENCY_COUNTRIES } from '@/constants/emergencyResources';
import { useAuthStore } from '@/state/authStore';
import { localStore } from '@/lib/localStore';
import { getSupabase } from '@/lib/supabase';
import type { UserPreferences } from '@/types/domain';

export default function Settings() {
  const theme = useTheme();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    getPreferences().then(setPrefs);
  }, []);

  async function patch(p: Partial<UserPreferences>) {
    const next = await updatePreferences(p);
    setPrefs(next);
  }

  async function exportData() {
    const supabase = getSupabase();
    if (!supabase) {
      Alert.alert('Local mode', 'Your data is stored only on this device. Connect a Supabase account to enable export.');
      return;
    }
    const { data, error } = await supabase.rpc('export_my_data');
    if (error) Alert.alert('Export failed', error.message);
    else Alert.alert('Export ready', 'Your data was retrieved. (Wire this to a share sheet in production.)');
  }

  function deleteAccount() {
    const supabase = getSupabase();
    if (!supabase) {
      Alert.alert('Local mode', 'Use "Delete local data" instead — there is no account to delete.');
      return;
    }
    Alert.alert('Delete your account?', 'This permanently deletes your account and all data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete account',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.functions.invoke('delete-account', { body: {} });
          if (error) Alert.alert('Failed', error.message);
          else {
            await localStore.clearAll();
            await signOut();
          }
        },
      },
    ]);
  }

  function deleteLocalData() {
    Alert.alert('Delete all local data?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => localStore.clearAll() },
    ]);
  }

  if (!prefs) return null;

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        Settings
      </Text>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.sm }}>Notifications</Text>
        <Row label="Trigger alerts" value={prefs.triggerAlertsEnabled} onChange={(v) => patch({ triggerAlertsEnabled: v })} />
        <Row label="Motivational messages" value={prefs.motivationalNotificationsEnabled} onChange={(v) => patch({ motivationalNotificationsEnabled: v })} />
        <Row label="Check-in reminders" value={prefs.checkinRemindersEnabled} onChange={(v) => patch({ checkinRemindersEnabled: v })} />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <TextField label="Quiet hours start" placeholder="22:00" value={prefs.quietHoursStart ?? ''} onChangeText={(v) => patch({ quietHoursStart: v })} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Quiet hours end" placeholder="08:00" value={prefs.quietHoursEnd ?? ''} onChangeText={(v) => patch({ quietHoursEnd: v })} />
          </View>
        </View>
        <Button label="Refresh predictive alerts" variant="outline" onPress={() => scheduleTriggerAlerts()} fullWidth style={{ marginTop: theme.spacing.xs }} />
      </Card>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.sm }}>Privacy</Text>
        <Row label="Location-based patterns" value={prefs.locationEnabled} onChange={(v) => patch({ locationEnabled: v })} />
        <Row label="Calendar-aware alerts" value={prefs.calendarEnabled} onChange={(v) => patch({ calendarEnabled: v })} />
        <Row label="Allow AI to use my data for coaching" value={prefs.aiDataSharingConsent} onChange={(v) => patch({ aiDataSharingConsent: v })} />
      </Card>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>Emergency resources — country</Text>
        <ChipGroup>
          {SUPPORTED_EMERGENCY_COUNTRIES.map((c) => (
            <Chip key={c} label={c} selected={prefs.emergencyCountry === c} onPress={() => patch({ emergencyCountry: c })} />
          ))}
        </ChipGroup>
      </Card>

      <Card style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="label" style={{ marginBottom: theme.spacing.sm }}>Your data</Text>
        <Button label="Export my data" variant="outline" onPress={exportData} fullWidth style={{ marginBottom: theme.spacing.xs }} />
        <Button label="Delete local data" variant="outline" onPress={deleteLocalData} fullWidth style={{ marginBottom: theme.spacing.xs }} />
        <Button label="Delete my account" variant="danger" onPress={deleteAccount} fullWidth />
      </Card>

      <Button label="Sign out" variant="ghost" onPress={signOut} fullWidth />
    </Screen>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
      <Text variant="body" style={{ flex: 1 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.colors.primary }} />
    </View>
  );
}
