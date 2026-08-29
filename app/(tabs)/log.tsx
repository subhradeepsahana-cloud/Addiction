import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip, ChipGroup } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeProvider';
import { DRINK_CATALOG, SERVING_SIZE_MULTIPLIER, SERVING_SIZE_LABEL, TRIGGER_OPTIONS } from '@/constants/drinkCatalog';
import { logDrink } from '@/services/drinkService';
import { extractDrinksFromText } from '@/services/aiService';
import type { DrinkCategory, ServingSize, TriggerTag } from '@/types/domain';
import { isBackendConfigured } from '@/lib/env';
import { track } from '@/services/analyticsService';

type Mode = 'quick' | 'describe';

export default function LogDrink() {
  const theme = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('quick');

  // Quick log state
  const [category, setCategory] = useState<DrinkCategory>('beer');
  const [servingSize, setServingSize] = useState<ServingSize>('regular');
  const [quantity, setQuantity] = useState(1);
  const [trigger, setTrigger] = useState<TriggerTag | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Describe (natural language) state
  const [description, setDescription] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ category: DrinkCategory; name: string; quantity: number; servingSize: ServingSize }[] | null>(
    null
  );

  const catalogEntry = DRINK_CATALOG.find((d) => d.category === category) ?? DRINK_CATALOG[0];

  async function handleQuickSave() {
    setSaving(true);
    const multiplier = SERVING_SIZE_MULTIPLIER[servingSize];
    await logDrink({
      drinkCategory: category,
      drinkName: catalogEntry.name,
      quantity,
      servingSize,
      volumeMl: catalogEntry.defaultVolumeMl * multiplier,
      abvPercent: catalogEntry.defaultAbvPercent,
      trigger,
      source: 'manual',
    });
    setSaving(false);
    setSaved(true);
    track('drink_logged', { source: 'quick' });
    setTimeout(() => router.replace('/(tabs)'), 900);
  }

  async function handleExtract() {
    setExtracting(true);
    setExtractError(null);
    const result = await extractDrinksFromText(description);
    setExtracting(false);
    if (result.unavailable) {
      setExtractError(result.error || 'AI is unavailable right now. Try Quick Log instead.');
      return;
    }
    if (!result.data || result.data.drinks.length === 0) {
      setExtractError(result.data?.clarification_question || "Couldn't identify any drinks — try Quick Log instead.");
      return;
    }
    setPending(
      result.data.drinks.map((d) => ({ category: d.drink_category, name: d.drink_name, quantity: d.quantity, servingSize: d.serving_size }))
    );
  }

  async function confirmExtracted() {
    if (!pending) return;
    setSaving(true);
    for (const item of pending) {
      const entry = DRINK_CATALOG.find((c) => c.category === item.category) ?? DRINK_CATALOG[0];
      const multiplier = SERVING_SIZE_MULTIPLIER[item.servingSize];
      await logDrink({
        drinkCategory: item.category,
        drinkName: item.name,
        quantity: item.quantity,
        servingSize: item.servingSize,
        volumeMl: entry.defaultVolumeMl * multiplier,
        abvPercent: entry.defaultAbvPercent,
        source: 'nl_extraction',
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.replace('/(tabs)'), 900);
  }

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm }}>
        Log a drink
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: 4, marginBottom: theme.spacing.md }}>
        No judgment — just tracking. This helps the app understand your patterns.
      </Text>

      <ChipGroup>
        <Chip label="Quick log" selected={mode === 'quick'} onPress={() => setMode('quick')} />
        <Chip label="Describe it" selected={mode === 'describe'} onPress={() => setMode('describe')} />
      </ChipGroup>

      {mode === 'quick' ? (
        <Card style={{ marginTop: theme.spacing.sm }}>
          <Text variant="label" color="secondary" style={{ marginBottom: theme.spacing.xs }}>
            Drink type
          </Text>
          <ChipGroup>
            {DRINK_CATALOG.filter((d, i, arr) => arr.findIndex((x) => x.category === d.category) === i).map((d) => (
              <Chip key={d.category} label={d.category} selected={category === d.category} onPress={() => setCategory(d.category)} />
            ))}
          </ChipGroup>

          <Text variant="label" color="secondary" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
            Serving size
          </Text>
          <ChipGroup>
            {(Object.keys(SERVING_SIZE_LABEL) as ServingSize[]).map((s) => (
              <Chip key={s} label={SERVING_SIZE_LABEL[s]} selected={servingSize === s} onPress={() => setServingSize(s)} />
            ))}
          </ChipGroup>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md }}>
            <Text variant="label" color="secondary" style={{ flex: 1 }}>
              Quantity
            </Text>
            <Button label="−" variant="outline" onPress={() => setQuantity((q) => Math.max(1, q - 1))} style={{ width: 44, paddingHorizontal: 0 }} />
            <Text variant="heading" style={{ marginHorizontal: theme.spacing.md }}>
              {quantity}
            </Text>
            <Button label="+" variant="outline" onPress={() => setQuantity((q) => Math.min(20, q + 1))} style={{ width: 44, paddingHorizontal: 0 }} />
          </View>

          <Text variant="label" color="secondary" style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
            What's the context? (optional)
          </Text>
          <ChipGroup>
            {TRIGGER_OPTIONS.map((opt) => (
              <Chip key={opt.tag} label={opt.label} selected={trigger === opt.tag} onPress={() => setTrigger(opt.tag as TriggerTag)} />
            ))}
          </ChipGroup>

          <Button
            label={saved ? 'Saved ✓' : 'Save'}
            onPress={handleQuickSave}
            loading={saving}
            disabled={saved}
            fullWidth
            size="lg"
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      ) : (
        <Card style={{ marginTop: theme.spacing.sm }}>
          {!isBackendConfigured() && (
            <Text variant="bodySmall" color="tertiary" style={{ marginBottom: theme.spacing.sm }}>
              Natural-language logging requires AI to be configured. Use Quick Log for now.
            </Text>
          )}
          <TextField
            label="Describe what you had"
            placeholder="e.g. Two large whiskies and one beer"
            multiline
            value={description}
            onChangeText={setDescription}
          />
          {extractError && (
            <Text color="danger" variant="bodySmall" style={{ marginBottom: theme.spacing.sm }}>
              {extractError}
            </Text>
          )}

          {!pending ? (
            <Button label="Interpret" onPress={handleExtract} loading={extracting} disabled={!description.trim()} fullWidth />
          ) : (
            <View>
              <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>
                Confirm before saving
              </Text>
              {pending.map((p, i) => (
                <Text key={i} variant="body" style={{ marginBottom: 2 }}>
                  • {p.quantity} × {p.name}
                </Text>
              ))}
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
                <Button label="Edit" variant="outline" onPress={() => setPending(null)} style={{ flex: 1 }} />
                <Button
                  label={saved ? 'Saved ✓' : 'Confirm & save'}
                  onPress={confirmExtracted}
                  loading={saving}
                  disabled={saved}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </Card>
      )}
    </Screen>
  );
}
