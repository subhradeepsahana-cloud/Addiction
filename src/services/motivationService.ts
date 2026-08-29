import { localStore, Collections, makeLocalId } from '@/lib/localStore';
import { getSupabase } from '@/lib/supabase';
import { requireUserId } from './base';
import type { MotivationTag } from '@/types/domain';

export interface MotivationPhoto {
  id: string;
  userId: string;
  motivationTag: MotivationTag | null;
  /** Local file URI (offline mode) or Supabase Storage path (backend mode). */
  imageUri: string;
  isRemote: boolean;
  description: string;
  displayOrder: number;
  createdAt: string;
}

export async function getMotivationPhotos(): Promise<MotivationPhoto[]> {
  const photos = await localStore.list<MotivationPhoto>(Collections.motivationPhotos);
  return photos.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function addMotivationPhoto(input: {
  localUri: string;
  description: string;
  motivationTag: MotivationTag | null;
}): Promise<MotivationPhoto> {
  const userId = requireUserId();
  const existing = await getMotivationPhotos();

  let imageUri = input.localUri;
  let isRemote = false;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const path = `${userId}/${Date.now()}.jpg`;
      const response = await fetch(input.localUri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('motivation-photos').upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
      if (error) throw error;
      imageUri = path;
      isRemote = true;
    } catch {
      // Fall back to storing the local URI; the photo still works offline.
    }
  }

  const photo: MotivationPhoto = {
    id: makeLocalId(),
    userId,
    motivationTag: input.motivationTag,
    imageUri,
    isRemote,
    description: input.description,
    displayOrder: existing.length,
    createdAt: new Date().toISOString(),
  };

  await localStore.insert(Collections.motivationPhotos, photo);

  if (supabase && isRemote) {
    try {
      await supabase.from('motivation_photos').insert({
        id: photo.id,
        user_id: userId,
        storage_path: photo.imageUri,
        description: photo.description,
        display_order: photo.displayOrder,
      });
    } catch {
      // local copy remains authoritative
    }
  }

  return photo;
}

export async function removeMotivationPhoto(id: string): Promise<void> {
  const photo = await localStore.get<MotivationPhoto>(Collections.motivationPhotos, id);
  await localStore.remove(Collections.motivationPhotos, id);

  const supabase = getSupabase();
  if (supabase && photo?.isRemote) {
    try {
      await supabase.storage.from('motivation-photos').remove([photo.imageUri]);
      await supabase.from('motivation_photos').delete().eq('id', id);
    } catch {
      // best-effort cleanup
    }
  }
}

/** Resolves a displayable URI for a photo — a signed URL for remote photos, or the local file URI. */
export async function resolvePhotoUri(photo: MotivationPhoto): Promise<string> {
  if (!photo.isRemote) return photo.imageUri;
  const supabase = getSupabase();
  if (!supabase) return photo.imageUri;
  try {
    const { data, error } = await supabase.storage.from('motivation-photos').createSignedUrl(photo.imageUri, 3600);
    if (error || !data) return photo.imageUri;
    return data.signedUrl;
  } catch {
    return photo.imageUri;
  }
}

// ── Motivation tags/free text (the "why" reasons) ──────────────────────
export interface MotivationEntry {
  tag: MotivationTag;
  freeText: string | null;
}

const MOTIVATIONS_KEY = 'motivations';

export async function getMotivations(): Promise<MotivationEntry[]> {
  return (await localStore.getValue<MotivationEntry[]>(MOTIVATIONS_KEY)) ?? [];
}

export async function saveMotivations(entries: MotivationEntry[]): Promise<void> {
  await localStore.setValue(MOTIVATIONS_KEY, entries);

  const supabase = getSupabase();
  const userId = requireUserId();
  if (supabase) {
    try {
      await supabase.from('motivations').delete().eq('user_id', userId);
      if (entries.length) {
        await supabase.from('motivations').insert(
          entries.map((e, i) => ({ user_id: userId, tag: e.tag, free_text: e.freeText, display_order: i }))
        );
      }
    } catch {
      // non-fatal
    }
  }
}
