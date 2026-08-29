import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/state/authStore';

export default function SignUp() {
  const theme = useTheme();
  const router = useRouter();
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    const { error } = await signUpWithEmail(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
    else router.replace('/(onboarding)/basics');
  }

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.lg }}>
        Create your account
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        Your data stays private and is protected end-to-end.
      </Text>

      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        helperText="At least 8 characters"
        value={password}
        onChangeText={setPassword}
      />

      {error && (
        <Text color="danger" variant="bodySmall" style={{ marginBottom: theme.spacing.sm }}>
          {error}
        </Text>
      )}

      <Button label="Create account" onPress={handleSubmit} loading={loading} fullWidth size="lg" />

      <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
        <Button label="Already have an account? Log in" variant="ghost" onPress={() => router.replace('/(auth)/sign-in')} />
      </View>
    </Screen>
  );
}
