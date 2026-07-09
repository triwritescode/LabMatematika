import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import type { FriendRow, PendingRow } from '@/lib/supabase';

// A friend + their derived shared streak (Runtunan Teman, §7). streak/sharedToday
// are merged in from the friend_streaks RPC after list_friends returns.
export type Friend = FriendRow & { streak: number; sharedToday: boolean };

// Friends store — the app's online/social state. Deliberately NOT routed through
// the offline-first progress outbox (sync.ts): a friend request needs the other
// user to exist server-side *now*, so it can't be a fire-and-forget mutation.
// This mirrors how auth.ts is a separate store from progress.ts.
//
// Reads go through SECURITY DEFINER RPCs (list_friends / list_pending) so the
// own-rows RLS on profiles stays intact; a realtime subscription on `friendships`
// re-pulls when a request arrives or is accepted on another device.
//
// Offline: the last successful list is cached in AsyncStorage and shown while
// the network is down; mutating actions surface a Bahasa error instead of
// silently queueing (a request to an unknown peer can't be replayed blindly).

export type Pending = PendingRow;

// Error codes raised by the RPCs (schema §6c) → Bahasa messages. Anything else
// (network, unknown) falls back to a generic message.
const ERROR_MESSAGES: Record<string, string> = {
  code_not_found: 'Kode teman tidak ditemukan.',
  cannot_add_self: 'Itu kodemu sendiri, lho!',
  already_friends: 'Kalian sudah berteman.',
  request_exists: 'Permintaan sudah dikirim sebelumnya.',
  not_authenticated: 'Sesi tidak ditemukan. Masuk ulang.',
};

function messageFor(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  for (const code of Object.keys(ERROR_MESSAGES)) {
    if (raw.includes(code)) return ERROR_MESSAGES[code];
  }
  return 'Ada masalah koneksi. Coba lagi.';
}

const cacheKey = (u: string) => `lm-friends:cache:${u}`;

type FriendsCache = { friends: Friend[]; myCode: string | null };

type FriendsState = {
  friends: Friend[];
  incoming: Pending[];
  outgoing: Pending[];
  myCode: string | null;
  loading: boolean;
  // Set by sendRequest so the Add screen can show a Bahasa error inline.
  actionError: string | null;
  load: () => Promise<void>;
  sendRequest: (code: string) => Promise<boolean>;
  respond: (friendshipId: string, accept: boolean) => Promise<void>;
  remove: (friendshipId: string) => Promise<void>;
  clearActionError: () => void;
};

let uid: string | null = null;
let channel: RealtimeChannel | null = null;

export const useFriends = create<FriendsState>()((set, get) => ({
  friends: [],
  incoming: [],
  outgoing: [],
  myCode: null,
  loading: false,
  actionError: null,

  load: async () => {
    if (!uid) return;
    set({ loading: true });
    try {
      const [friendsRes, pendingRes, streaksRes, profileRes] = await Promise.all([
        supabase.rpc('list_friends'),
        supabase.rpc('list_pending'),
        supabase.rpc('friend_streaks'),
        supabase.from('profiles').select('friend_code').eq('id', uid).maybeSingle(),
      ]);
      if (friendsRes.error || pendingRes.error) throw friendsRes.error ?? pendingRes.error;

      const pending = (pendingRes.data ?? []) as Pending[];
      // Merge each friend's derived shared streak (friend_streaks may fail
      // independently — default to 0 so the list still renders).
      const streaks = new Map(
        (streaksRes.data ?? []).map((s) => [s.friend_id, s])
      );
      const friends: Friend[] = (friendsRes.data ?? []).map((f) => {
        const st = streaks.get(f.friend_id);
        return { ...f, streak: st?.streak ?? 0, sharedToday: st?.shared_today ?? false };
      });
      const myCode = profileRes.data?.friend_code ?? get().myCode;

      set({
        friends,
        incoming: pending.filter((p) => p.direction === 'incoming'),
        outgoing: pending.filter((p) => p.direction === 'outgoing'),
        myCode,
        loading: false,
      });
      void AsyncStorage.setItem(cacheKey(uid), JSON.stringify({ friends, myCode } as FriendsCache));
    } catch {
      // Offline / server error — keep whatever's already shown (cache).
      set({ loading: false });
    }
  },

  sendRequest: async (code) => {
    set({ actionError: null });
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      set({ actionError: 'Masukkan kode teman dulu.' });
      return false;
    }
    const { error } = await supabase.rpc('send_friend_request', { code: trimmed });
    if (error) {
      set({ actionError: messageFor(error) });
      return false;
    }
    await get().load();
    return true;
  },

  respond: async (friendshipId, accept) => {
    // Optimistic: drop the incoming request immediately.
    set((s) => ({ incoming: s.incoming.filter((p) => p.friendship_id !== friendshipId) }));
    const { error } = await supabase.rpc('respond_friend_request', {
      friendship_id: friendshipId,
      accept,
    });
    // Reconcile either way (accept adds a friend row; a failure restores state).
    await get().load();
    if (error) set({ actionError: messageFor(error) });
  },

  remove: async (friendshipId) => {
    set((s) => ({
      friends: s.friends.filter((f) => f.friendship_id !== friendshipId),
      outgoing: s.outgoing.filter((p) => p.friendship_id !== friendshipId),
    }));
    const { error } = await supabase.rpc('remove_friend', { friendship_id: friendshipId });
    await get().load();
    if (error) set({ actionError: messageFor(error) });
  },

  clearActionError: () => set({ actionError: null }),
}));

/** Begin loading + live-updating this user's friends. Idempotent per uid. */
export async function startFriends(userId: string): Promise<void> {
  if (uid === userId) return;
  if (uid) await stopFriends();
  uid = userId;

  // Hydrate from cache so the list shows instantly (and while offline).
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (raw) {
      const cache = JSON.parse(raw) as FriendsCache;
      useFriends.setState({ friends: cache.friends ?? [], myCode: cache.myCode ?? null });
    }
  } catch {
    // ignore corrupt cache
  }

  void useFriends.getState().load();

  // Any change to a row I'm part of → re-pull. RLS already scopes what I see, so
  // subscribing broadly and refetching is simplest and correct.
  channel = supabase
    .channel(`friendships:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friendships' },
      () => void useFriends.getState().load()
    )
    .subscribe();
}

/** Stop live updates + clear local friends state. Call before sign-out. */
export async function stopFriends(): Promise<void> {
  if (channel) {
    await supabase.removeChannel(channel);
    channel = null;
  }
  uid = null;
  useFriends.setState({
    friends: [],
    incoming: [],
    outgoing: [],
    myCode: null,
    loading: false,
    actionError: null,
  });
}
