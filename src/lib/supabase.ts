import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env. Copy .env.example to .env.local and fill it (see SETUP.md).'
  );
}

// Typed row shapes for the progress-sync tables (see supabase/schema.sql §5).
// Every table carries the change-tracking trio Legend-State needs: updated_at,
// created_at, deleted. `id` is a DETERMINISTIC string (see state/sync.ts) so the
// same fact converges to one row across devices.
type SyncMeta = { created_at: string; updated_at: string; deleted: boolean };

export type SkillMasteryRow = {
  id: string;
  user_id: string;
  lab: string;
  skill_id: string;
  mastery: number;
  attempts: number;
  last_practiced_at: string | null;
  due_for_review: string | null;
} & SyncMeta;

export type LabMetaRow = {
  id: string;
  user_id: string;
  lab: string;
  rank: string;
  placement_done: boolean;
} & SyncMeta;

export type LevelsPassedRow = {
  id: string;
  user_id: string;
  lab: string;
  level: number;
} & SyncMeta;

// Global question bank (read-only content; see supabase/schema.sql §5g).
export type QuestionRow = {
  code: string;
  skill_id: string;
  lab: string;
  level: number;
  skill: string;
  ordinal: number;
  prompt: string;
  answer: number;
  difficulty: 'mudah' | 'sedang' | 'sulit';
  explanation: string;
} & SyncMeta;

export type ActiveDayRow = {
  id: string;
  user_id: string;
  day: string; // ISO yyyy-mm-dd
} & SyncMeta;

export type UserStatsRow = {
  id: string;
  user_id: string;
  diamonds: number;
} & SyncMeta;

export type OwnedStickerRow = {
  id: string; // '<uid>:<stickerId>'
  user_id: string;
  sticker_id: string;
} & SyncMeta;

// Friends (§6). Direction-bearing: one row per relationship. Written only via
// the RPCs below (RLS grants SELECT to involved parties, no direct writes).
export type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  updated_at: string;
};

// Shapes returned by the friends RPCs (list_friends / list_pending).
export type FriendRow = {
  friendship_id: string;
  friend_id: string;
  first_name: string;
  last_name: string;
  friend_code: string;
  diamonds: number;
  since: string;
};

export type PendingRow = {
  friendship_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  friend_code: string;
  direction: 'incoming' | 'outgoing';
  created_at: string;
};

// Shared Friend Streak (§7): derived, per accepted friend. `shared_today` = both
// practiced today (flame lit); `streak` = consecutive shared days ending
// today/yesterday.
export type FriendStreakRow = {
  friend_id: string;
  streak: number;
  shared_today: boolean;
};

// Minimal Database generic (GenericSchema-shaped) so supabase-js queries and
// syncedSupabase infer collection names + row types. Only declares the columns
// the app reads/writes.
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      skill_mastery: Table<SkillMasteryRow>;
      lab_meta: Table<LabMetaRow>;
      levels_passed: Table<LevelsPassedRow>;
      active_days: Table<ActiveDayRow>;
      user_stats: Table<UserStatsRow>;
      owned_stickers: Table<OwnedStickerRow>;
      questions: Table<QuestionRow>;
      friendships: Table<FriendshipRow>;
    };
    Views: Record<string, never>;
    Functions: {
      send_friend_request: { Args: { code: string }; Returns: FriendshipRow };
      respond_friend_request: { Args: { friendship_id: string; accept: boolean }; Returns: undefined };
      remove_friend: { Args: { friendship_id: string }; Returns: undefined };
      list_friends: { Args: Record<string, never>; Returns: FriendRow[] };
      list_pending: { Args: Record<string, never>; Returns: PendingRow[] };
      friend_streaks: { Args: Record<string, never>; Returns: FriendStreakRow[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection on native (that's a web OAuth concern).
    detectSessionInUrl: false,
  },
});

// Keep the access token fresh only while the app is foregrounded. Supabase RN
// pattern: pause refresh in the background to avoid needless network churn.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  onboarding_complete: boolean;
  friend_code: string | null;
};
