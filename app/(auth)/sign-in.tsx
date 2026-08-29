import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/state/authStore';

export default function SignIn() {
  const theme = useTheme();
  const router = useRouter();
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const { error } = await signInWithEmail(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
    else router.replace('/');
  }

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.lg }}>
        Welcome back
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        Log in to continue your progress.
      </Text>

      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextField label="Password" secureTextEntry autoCapitalize="none" value={password} onChangeText={setPassword} />

      {error && (
        <Text color="danger" variant="bodySmall" style={{ marginBottom: theme.spacing.sm }}>
          {error}
        </Text>
      )}

      <Button label="Log in" onPress={handleSubmit} loading={loading} fullWidth size="lg" />

      <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
        <Button label="Need an account? Sign up" variant="ghost" onPress={() => router.replace('/(auth)/sign-up')} />
      </View>
    </Screen>
  );
}
