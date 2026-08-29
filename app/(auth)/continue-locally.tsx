import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/state/authStore';

export default function ContinueLocally() {
  const theme = useTheme();
  const router = useRouter();
  const continueLocally = useAuthStore((s) => s.continueLocally);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    await continueLocally(name.trim() || 'Friend');
    setLoading(false);
    router.replace('/(onboarding)/basics');
  }

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.lg }}>
        Try it locally
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        No account, no backend required. Everything is stored privately on this device. You can create a full account
        later without losing your data by connecting Supabase in Settings.
      </Text>

      <TextField label="What should we call you?" placeholder="Your name or nickname" value={name} onChangeText={setName} />

      <Button label="Continue" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
    </Screen>
  );
}
