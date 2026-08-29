import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { HEALTH_ARTICLES } from '@/constants/healthArticles';
import { askHealthQuestion } from '@/services/aiService';
import { SafetyBanner } from '@/components/SafetyBanner';
import type { SafetyClassification } from '@/lib/safety';

export default function HealthList() {
  const theme = useTheme();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [safety, setSafety] = useState<SafetyClassification | null>(null);

  async function ask() {
    setAsking(true);
    setAskError(null);
    setAnswer(null);
    const result = await askHealthQuestion(question);
    setAsking(false);
    if (result.error === 'safety_intercept') {
      setSafety({ level: 'urgent', category: 'withdrawal_risk', matchedSignals: [], action: 'show_withdrawal_guidance' });
      return;
    }
    if (result.unavailable || !result.data) {
      setAskError(result.error || 'AI is unavailable — browse the articles below instead.');
      return;
    }
    setAnswer(result.data.answer);
  }

  if (safety) return <SafetyBanner classification={safety} onDismiss={() => setSafety(null)} />;

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
        Health & Science
      </Text>
      <Text variant="bodySmall" color="tertiary" style={{ marginBottom: theme.spacing.md }}>
        Evidence-based information, cited to public health sources. Not a substitute for professional medical advice.
      </Text>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <TextField label="Ask a question" placeholder="e.g. How does alcohol affect sleep?" value={question} onChangeText={setQuestion} />
        <Button label="Ask" onPress={ask} loading={asking} disabled={!question.trim()} fullWidth />
        {askError && <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.spacing.xs }}>{askError}</Text>}
        {answer && <Text variant="body" style={{ marginTop: theme.spacing.sm }}>{answer}</Text>}
      </Card>

      {HEALTH_ARTICLES.map((a) => (
        <Card key={a.slug} onPress={() => router.push(`/(tabs)/more/health/${a.slug}`)} style={{ marginBottom: theme.spacing.sm }}>
          <Text variant="subheading">{a.title}</Text>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
            {a.summary}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
