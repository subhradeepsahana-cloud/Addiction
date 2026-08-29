import { create } from 'zustand';
import { getSupabase } from '@/lib/supabase';
import { isBackendConfigured } from '@/lib/env';
import { localStore } from '@/lib/localStore';
import { makeLocalId } from '@/lib/localStore';

export interface AuthUser {
  id: string;
  email: string | null;
  isLocalOnly: boolean;
}

interface AuthState {
  user: AuthUser | null;
  initializing: boolean;
  init: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  continueLocally: (displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const LOCAL_USER_KEY = 'local_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initializing: true,

  init: async () => {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      set({
        user: session ? { id: session.user.id, email: session.user.email ?? null, isLocalOnly: false } : null,
        initializing: false,
      });
      supabase.auth.onAuthStateChange((_event, newSession) => {
        set({
          user: newSession ? { id: newSession.user.id, email: newSession.user.email ?? null, isLocalOnly: false } : null,
        });
      });
      return;
    }

    // Mock / offline mode: check for a previously created local profile.
    const local = await localStore.getValue<AuthUser>(LOCAL_USER_KEY);
    set({ user: local, initializing: false });
  },

  signUpWithEmail: async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Backend not configured. Use "Continue without an account" instead.' };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.session) {
      set({ user: { id: data.user!.id, email: data.user!.email ?? null, isLocalOnly: false } });
    }
    return { error: null };
  },

  signInWithEmail: async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Backend not configured. Use "Continue without an account" instead.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    set({ user: { id: data.user.id, email: data.user.email ?? null, isLocalOnly: false } });
    return { error: null };
  },

  continueLocally: async (displayName: string) => {
    if (isBackendConfigured()) {
      return { error: 'This app instance is configured to require an account.' };
    }
    const user: AuthUser = { id: makeLocalId(), email: null, isLocalOnly: true };
    await localStore.setValue(LOCAL_USER_KEY, user);
    await localStore.setValue('profile_display_name', displayName);
    set({ user });
    return { error: null };
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    await localStore.setValue(LOCAL_USER_KEY, null);
    set({ user: null });
  },
}));

export function currentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}
