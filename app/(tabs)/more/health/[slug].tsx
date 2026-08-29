import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useTheme } from '@/theme/ThemeProvider';
import { HEALTH_ARTICLES } from '@/constants/healthArticles';

export default function HealthArticleDetail() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const article = HEALTH_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <Screen>
        <Text variant="body">Article not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm }}>{article.title}</Text>
      <Text variant="body" style={{ marginTop: theme.spacing.md, lineHeight: 24 }}>{article.content}</Text>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text variant="label">Source</Text>
        <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
          {article.sourceName} · Evidence level: {article.evidenceLevel}
        </Text>
        <Text variant="bodySmall" color="accent" style={{ marginTop: 4 }}>
          {article.sourceUrl}
        </Text>
      </Card>

      <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.lg }}>
        This is general, population-level information — not a diagnosis or individual medical advice.
      </Text>
    </Screen>
  );
}
