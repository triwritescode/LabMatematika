import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import { useProgress } from '@/state/progress';
import {
  loadProfileSnapshot,
  saveProfileSnapshot,
  startProgressSync,
  stopProgressSync,
} from '@/state/sync';

// Auth + profile store. Mirrors the local-first zustand style of progress.ts,
// but this one is the source of truth for identity: Supabase session + the
// user's profile row (first/last/age). The router guard in _layout.tsx reads
// `status` to decide which route group to show.

export type AuthStatus = 'loading' | 'signedOut' | 'needsOnboarding' | 'ready';

// birthDate is an ISO `YYYY-MM-DD` string; age is derived from it (see lib/age).
type LocalProfile = { firstName: string; lastName: string; birthDate: string };

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: LocalProfile | null;
  // Best-effort name from the Google account, used to prefill onboarding.
  prefill: { firstName: string; lastName: string } | null;
  signingIn: boolean;
  savingProfile: boolean;
  error: string | null;
  init: () => void;
  signInWithGoogle: () => Promise<void>;
  saveProfile: (firstName: string, lastName: string, birthDate: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

let initialized = false;

export const useAuth = create<AuthState>()((set, get) => {
  // Pull the profile row for a signed-in user and derive the next status.
  async function resolveSession(session: Session | null) {
    if (!session) {
      set({ status: 'signedOut', session: null, user: null, profile: null });
      return;
    }

    // Identity is known → start offline-first progress sync immediately, so
    // local progress is available even before (or without) the network.
    void startProgressSync(session.user.id);

    // The local snapshot is authoritative for "already onboarded". `resolveSession`
    // runs on every auth event (token refresh, app foreground), and each one used
    // to re-query the profile row over the network — so a stale read-replica read
    // right after upsert, or an offline hiccup, could bounce a finished user back
    // to onboarding. Once a user has completed onboarding, resolve `ready` from the
    // snapshot and never downgrade.
    const snap = await loadProfileSnapshot(session.user.id);
    if (snap?.onboarded) {
      useProgress.getState().setChildName(snap.firstName);
      set({
        status: 'ready',
        session,
        user: session.user,
        profile: { firstName: snap.firstName, lastName: snap.lastName, birthDate: snap.birthDate },
      });
      return;
    }

    // Already resolved `ready` in-memory for this same user → don't re-query and
    // risk a transient downgrade from a lagging/failing read.
    const cur = get();
    if (cur.status === 'ready' && cur.user?.id === session.user.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, birth_date, onboarding_complete')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      // No onboarded snapshot and the network is down → genuinely unknown. Send
      // to onboarding, the safe default for a not-yet-onboarded account.
      set({ status: 'needsOnboarding', session, user: session.user, profile: null });
      return;
    }

    if (data && data.onboarding_complete && data.birth_date) {
      const profile: LocalProfile = {
        firstName: data.first_name,
        lastName: data.last_name,
        birthDate: data.birth_date,
      };
      // Keep the existing home-screen greeting working (reads childName).
      useProgress.getState().setChildName(profile.firstName);
      // Cache so future auth events short-circuit to `ready` above.
      await saveProfileSnapshot(session.user.id, { ...profile, onboarded: true });
      set({ status: 'ready', session, user: session.user, profile });
    } else {
      set({ status: 'needsOnboarding', session, user: session.user, profile: null });
    }
  }

  return {
    status: 'loading',
    session: null,
    user: null,
    profile: null,
    prefill: null,
    signingIn: false,
    savingProfile: false,
    error: null,

    init: () => {
      if (initialized) return;
      initialized = true;

      supabase.auth.getSession().then(({ data }) => resolveSession(data.session));

      supabase.auth.onAuthStateChange((_event, session) => {
        resolveSession(session);
      });
    },

    signInWithGoogle: async () => {
      set({ signingIn: true, error: null });
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();

        if (!isSuccessResponse(response)) {
          // User dismissed the account picker.
          set({ signingIn: false });
          return;
        }

        const { idToken, user } = response.data;
        if (!idToken) throw new Error('No ID token returned from Google.');

        set({
          prefill: {
            firstName: user.givenName ?? '',
            lastName: user.familyName ?? '',
          },
        });

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
        // onAuthStateChange fires → resolveSession sets the next status.
      } catch (err) {
        let message = 'Gagal masuk. Coba lagi.';
        if (isErrorWithCode(err)) {
          if (err.code === statusCodes.SIGN_IN_CANCELLED) {
            set({ signingIn: false });
            return;
          }
          if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            message = 'Google Play Services tidak tersedia.';
          }
        } else if (err instanceof Error) {
          message = err.message;
        }
        set({ error: message });
      } finally {
        set({ signingIn: false });
      }
    },

    saveProfile: async (firstName, lastName, birthDate) => {
      const user = get().user;
      if (!user) {
        set({ error: 'Sesi tidak ditemukan. Masuk ulang.' });
        return;
      }
      set({ savingProfile: true, error: null });
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: birthDate,
          onboarding_complete: true,
        });
        if (error) throw error;

        const profile: LocalProfile = { firstName: firstName.trim(), lastName: lastName.trim(), birthDate };
        useProgress.getState().setChildName(profile.firstName);
        void startProgressSync(user.id);
        // Persist the snapshot BEFORE flipping to `ready` so any auth event that
        // fires next resolves from it instead of a lagging remote read.
        await saveProfileSnapshot(user.id, { ...profile, onboarded: true });
        set({ status: 'ready', profile, prefill: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal menyimpan profil.';
        set({ error: message });
      } finally {
        set({ savingProfile: false });
      }
    },

    signOut: async () => {
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore — the Supabase sign-out below is what actually matters.
      }
      // Flush pending progress + clear local state BEFORE dropping the session,
      // so the final push still has a valid token and the next account starts
      // clean instead of inheriting this user's rows.
      await stopProgressSync();
      await supabase.auth.signOut();
      set({ status: 'signedOut', session: null, user: null, profile: null, prefill: null });
    },

    clearError: () => set({ error: null }),
  };
});
