import React, { useState } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { SafetyBanner } from '@/components/SafetyBanner';
import { useTheme } from '@/theme/ThemeProvider';
import { sendCoachMessage } from '@/services/aiService';
import { isBackendConfigured } from '@/lib/env';
import type { SafetyClassification } from '@/lib/safety';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export default function Coach() {
  const theme = useTheme();
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'welcome', role: 'assistant', text: "Hi — I'm here to help, no judgment. What's on your mind?" },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [safety, setSafety] = useState<SafetyClassification | null>(null);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Msg = { id: `u_${Date.now()}`, role: 'user', text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);
    const result = await sendCoachMessage(conversationId, userMsg.text, 'coach');
    setSending(false);

    if (result.safety.level !== 'none') {
      setSafety(result.safety);
      return;
    }
    if (result.unavailable || !result.data?.message) {
      setMessages((m) => [
        ...m,
        { id: `a_${Date.now()}`, role: 'assistant', text: result.error || 'The AI Coach is unavailable right now. Your check-ins and cravings are still being tracked normally.' },
      ]);
      return;
    }
    setConversationId(result.data.conversationId);
    setMessages((m) => [...m, { id: `a_${Date.now()}`, role: 'assistant', text: result.data!.message }]);
  }

  if (safety) return <SafetyBanner classification={safety} onDismiss={() => setSafety(null)} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll={false}>
        <Text variant="title" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          AI Coach
        </Text>
        {!isBackendConfigured() && (
          <Text variant="caption" color="tertiary" style={{ marginBottom: theme.spacing.sm }}>
            AI requires Supabase + OpenAI configuration. Replies are unavailable in local mode.
          </Text>
        )}
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: item.role === 'user' ? theme.colors.primary : theme.colors.surfaceMuted,
                borderRadius: theme.radii.lg,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
                maxWidth: '85%',
              }}
            >
              <Text style={{ color: item.role === 'user' ? theme.colors.onPrimary : theme.colors.textPrimary }}>{item.text}</Text>
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <TextField placeholder="Type a message..." value={input} onChangeText={setInput} />
          </View>
          <Button label="Send" onPress={send} loading={sending} disabled={!input.trim()} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
