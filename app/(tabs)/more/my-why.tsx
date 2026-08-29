import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Chip, ChipGroup } from '@/components/Chip';
import { useTheme } from '@/theme/ThemeProvider';
import { getMotivationPhotos, addMotivationPhoto, removeMotivationPhoto, resolvePhotoUri, type MotivationPhoto } from '@/services/motivationService';
import { MOTIVATION_OPTIONS } from '@/constants/drinkCatalog';
import type { MotivationTag } from '@/types/domain';

export default function MyWhy() {
  const theme = useTheme();
  const [photos, setPhotos] = useState<(MotivationPhoto & { uri: string })[]>([]);
  const [picking, setPicking] = useState(false);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState<MotivationTag | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const list = await getMotivationPhotos();
    const withUri = await Promise.all(list.map(async (p) => ({ ...p, uri: await resolvePhotoUri(p) })));
    setPhotos(withUri);
  }

  useEffect(() => {
    load();
  }, []);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPendingUri(result.assets[0].uri);
      setPicking(true);
    }
  }

  async function save() {
    if (!pendingUri || !description.trim()) return;
    setSaving(true);
    await addMotivationPhoto({ localUri: pendingUri, description: description.trim(), motivationTag: tag });
    setSaving(false);
    setPicking(false);
    setPendingUri(null);
    setDescription('');
    setTag(null);
    load();
  }

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: theme.spacing.sm }}>My Why</Text>
      <Text variant="body" color="secondary" style={{ marginTop: 4, marginBottom: theme.spacing.md }}>
        Photos and your own words about what matters most. We never guess what a photo means — only what you tell us.
      </Text>

      {picking ? (
        <Card style={{ marginBottom: theme.spacing.md }}>
          {pendingUri && <Image source={{ uri: pendingUri }} style={{ width: '100%', height: 180, borderRadius: theme.radii.md, marginBottom: theme.spacing.sm }} contentFit="cover" />}
          <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>What does this represent to you?</Text>
          <ChipGroup>
            {MOTIVATION_OPTIONS.map((opt) => (
              <Chip key={opt.tag} label={opt.label} selected={tag === opt.tag} onPress={() => setTag(opt.tag as MotivationTag)} />
            ))}
          </ChipGroup>
          <TextField
            label="In your own words"
            placeholder="Why does this matter to you?"
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button label="Cancel" variant="outline" onPress={() => setPicking(false)} style={{ flex: 1 }} />
            <Button label="Save" onPress={save} loading={saving} disabled={!description.trim()} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Button label="Add a photo" onPress={pickImage} fullWidth style={{ marginBottom: theme.spacing.md }} />
      )}

      {photos.map((p) => (
        <Card key={p.id} style={{ marginBottom: theme.spacing.sm, padding: 0, overflow: 'hidden' }}>
          <Image source={{ uri: p.uri }} style={{ width: '100%', height: 180 }} contentFit="cover" />
          <View style={{ padding: theme.spacing.md }}>
            <Text variant="body">{p.description}</Text>
            <Button label="Remove" variant="ghost" onPress={() => removeMotivationPhoto(p.id).then(load)} style={{ marginTop: theme.spacing.xs, alignSelf: 'flex-start' }} />
          </View>
        </Card>
      ))}

      {photos.length === 0 && !picking && (
        <Text variant="bodySmall" color="tertiary" center>
          No photos yet. Add one to build your collection.
        </Text>
      )}
    </Screen>
  );
}
