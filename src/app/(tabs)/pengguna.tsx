import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronRight,
  Crown,
  Flame,
  Footprints,
  Gem,
  Glasses,
  Lock,
  LogOut,
  Pencil,
  Shirt,
  Smile,
  Sparkles,
  Store,
  User,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { memo, ReactNode, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DiamondColor, StreakColor } from '@/constants/labs';
import { RARITY_COLOR, STICKERS, Sticker } from '@/constants/stickers';
import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { ageFromISO } from '@/lib/age';
import { useAuth } from '@/state/auth';
import { useCurrentStreak, useProgress } from '@/state/progress';

// --- Mock data (feature not built yet — placeholders for the future). ---
const FRIEND_COUNT = 8;
const FRIEND_AVATARS = [
  { initial: 'A', color: '#3B82F6' },
  { initial: 'B', color: '#22C55E' },
  { initial: 'C', color: '#EAB308' },
  { initial: 'D', color: '#EF4444' },
];
type Theme = ReturnType<typeof useTheme>;

export default function Pengguna() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);
  const streak = useCurrentStreak();
  const diamonds = useProgress((s) => s.diamonds);
  const ownedStickers = useProgress((s) => s.ownedStickers);
  const owned = useMemo(() => new Set(ownedStickers), [ownedStickers]);
  // Profile shows a compact preview (owned first); the full 100-sticker catalog
  // lives in Toko. Recomputed only when ownership changes, not every render.
  const stickerPreview = useMemo(
    () =>
      [
        ...STICKERS.filter((s) => owned.has(s.id)),
        ...STICKERS.filter((s) => !owned.has(s.id)),
      ].slice(0, 12),
    [owned]
  );
  const age = profile?.birthDate ? ageFromISO(profile.birthDate) : null;
  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : strings.pengguna;

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={[styles.hero, { paddingTop: insets.top + Spacing.four }]}>
            <ThemedText type="smallBold" style={styles.heroKicker}>
              {strings.profil.toUpperCase()}
            </ThemedText>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <User color={AccentColor} size={44} strokeWidth={2.4} />
              </View>
              <Pressable style={styles.editBadge} hitSlop={8}>
                <Pencil color="#fff" size={14} strokeWidth={2.6} />
              </Pressable>
            </View>
            <ThemedText type="subtitle" style={styles.heroName}>
              {name}
            </ThemedText>
            {age !== null ? (
              <ThemedText style={styles.heroAge}>{strings.ageYears(age)}</ThemedText>
            ) : null}
          </View>

          <View style={styles.body}>
            {/* Stats trio */}
            <View style={styles.statsCard}>
              <Stat icon={<Flame color={StreakColor} fill={StreakColor} size={22} />} value={`${streak}`} label={strings.labelStreak} theme={theme} />
              <View style={[styles.statDivider, { backgroundColor: theme.backgroundSelected }]} />
              <Stat icon={<Gem color={DiamondColor} fill={DiamondColor} size={22} />} value={diamonds.toLocaleString('id-ID')} label={strings.labelDiamonds} theme={theme} />
              <View style={[styles.statDivider, { backgroundColor: theme.backgroundSelected }]} />
              <Stat icon={<Users color={AccentColor} size={22} />} value={`${FRIEND_COUNT}`} label={strings.labelTeman} theme={theme} />
            </View>

            {/* Karakterku */}
            <SectionHeader title={strings.karakterku} theme={theme} badge={strings.segeraHadir} />
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.characterRow}>
                <View style={styles.characterAvatar}>
                  <Smile color={AccentColor} size={52} strokeWidth={2.2} />
                  <View style={styles.characterSparkle}>
                    <Sparkles color="#fff" size={14} fill="#fff" />
                  </View>
                </View>
                <View style={styles.characterText}>
                  <ThemedText type="smallBold" style={styles.cardTitle}>
                    {name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {strings.karakterkuSub}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.slotRow}>
                <Slot icon={<Crown color={theme.textSecondary} size={22} />} label={strings.slotTopi} theme={theme} />
                <Slot icon={<Shirt color={theme.textSecondary} size={22} />} label={strings.slotBaju} theme={theme} />
                <Slot icon={<Footprints color={theme.textSecondary} size={22} />} label={strings.slotSepatu} theme={theme} />
                <Slot icon={<Glasses color={theme.textSecondary} size={22} />} label={strings.slotAksesori} theme={theme} />
              </View>
            </View>

            {/* Teman */}
            <SectionHeader title={strings.teman} theme={theme} />
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.friendRow}>
                <View style={styles.friendAvatars}>
                  {FRIEND_AVATARS.map((f, i) => (
                    <View
                      key={f.initial}
                      style={[
                        styles.friendAvatar,
                        { backgroundColor: f.color, marginLeft: i === 0 ? 0 : -12, borderColor: theme.backgroundElement },
                      ]}>
                      <ThemedText type="smallBold" style={styles.friendInitial}>
                        {f.initial}
                      </ThemedText>
                    </View>
                  ))}
                </View>
                <View style={styles.friendText}>
                  <ThemedText type="smallBold" style={styles.cardTitle}>
                    {strings.temanCount(FRIEND_COUNT)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {strings.temanKosong}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.addFriendBtn, pressed && styles.pressed]}
                hitSlop={6}>
                <UserPlus color="#fff" size={18} strokeWidth={2.4} />
                <ThemedText type="smallBold" style={styles.addFriendText}>
                  {strings.tambahTeman}
                </ThemedText>
              </Pressable>
            </View>

            {/* Stikerku */}
            <SectionHeader
              title={strings.stikerku}
              theme={theme}
              badge={strings.stikerProgress(owned.size, STICKERS.length)}
              badgeMuted
            />
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              {owned.size === 0 ? (
                <View style={styles.stickerEmpty}>
                  <View style={styles.stickerEmptyIcon}>
                    <Sparkles color={AccentColor} size={22} fill={AccentColor} />
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.stickerEmptyText}>
                    {strings.stikerKosong}
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.stickerGrid}>
                  {stickerPreview.map((s) => (
                    <StickerTile key={s.id} sticker={s} unlocked={owned.has(s.id)} theme={theme} />
                  ))}
                </View>
              )}
              <Pressable
                onPress={() => router.push('/toko')}
                accessibilityRole="button"
                accessibilityLabel={strings.bukaToko}
                style={({ pressed }) => [
                  styles.tokoLink,
                  { backgroundColor: `${AccentColor}12` },
                  pressed && styles.pressed,
                ]}>
                <Store color={AccentColor} size={18} strokeWidth={2.4} />
                <ThemedText type="smallBold" style={styles.tokoLinkText}>
                  {strings.bukaToko}
                </ThemedText>
                <ChevronRight color={AccentColor} size={18} strokeWidth={2.4} />
              </Pressable>
            </View>

            {/* Sign out */}
            <Pressable
              onPress={signOut}
              accessibilityRole="button"
              accessibilityLabel={strings.signOut}
              style={({ pressed }) => [
                styles.signOut,
                { borderColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <LogOut color={theme.text} size={18} />
              <ThemedText type="smallBold">{strings.signOut}</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Stat({ icon, value, label, theme }: { icon: ReactNode; value: string; label: string; theme: Theme }) {
  return (
    <View style={styles.stat}>
      {icon}
      <ThemedText type="smallBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function SectionHeader({ title, theme, badge, badgeMuted }: { title: string; theme: Theme; badge?: string; badgeMuted?: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      {badge ? (
        <View
          style={[
            styles.sectionBadge,
            badgeMuted ? { backgroundColor: theme.backgroundSelected } : { backgroundColor: `${AccentColor}18` },
          ]}>
          <ThemedText type="small" style={{ color: badgeMuted ? theme.textSecondary : AccentColor, fontWeight: '700', fontSize: 11 }}>
            {badge}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const StickerTile = memo(function StickerTile({ sticker, unlocked, theme }: { sticker: Sticker; unlocked: boolean; theme: Theme }) {
  const color = RARITY_COLOR[sticker.rarity];
  return (
    <View
      style={[
        styles.sticker,
        unlocked
          ? { backgroundColor: `${color}1A`, borderColor: color, borderWidth: 1.5 }
          : { backgroundColor: theme.backgroundSelected },
      ]}>
      {unlocked ? (
        <ThemedText style={styles.stickerEmoji}>{sticker.id}</ThemedText>
      ) : (
        <Lock color={theme.textSecondary} size={18} />
      )}
    </View>
  );
});

function Slot({ icon, label, theme }: { icon: ReactNode; label: string; theme: Theme }) {
  return (
    <Pressable style={({ pressed }) => [styles.slot, pressed && styles.pressed]}>
      <View style={[styles.slotTile, { borderColor: theme.backgroundSelected }]}>
        {icon}
        <View style={[styles.slotLock, { backgroundColor: theme.backgroundElement }]}>
          <Lock color={theme.textSecondary} size={11} />
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.slotLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingBottom: Spacing.five,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: AccentColor,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    borderBottomLeftRadius: Spacing.five,
    borderBottomRightRadius: Spacing.five,
    gap: Spacing.one,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2,
    marginBottom: Spacing.two,
  },
  avatarWrap: {
    marginBottom: Spacing.one,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: AccentColor,
  },
  heroName: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 30,
  },
  heroAge: {
    color: 'rgba(255,255,255,0.85)',
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  // Stats trio
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    marginTop: -Spacing.five,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 18,
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: '#6B7280',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: Spacing.two,
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitle: {
    letterSpacing: 1,
    fontSize: 12,
  },
  sectionBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 999,
  },
  // Generic card
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
  },
  // Character
  characterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  characterAvatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: `${AccentColor}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterSparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AccentColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterText: {
    flex: 1,
    gap: Spacing.half,
  },
  slotRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  slotTile: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLock: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  // Friends
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  friendAvatars: {
    flexDirection: 'row',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  friendInitial: {
    color: '#fff',
    fontSize: 15,
  },
  friendText: {
    flex: 1,
    gap: Spacing.half,
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: AccentColor,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  addFriendText: {
    color: '#fff',
  },
  // Stickers
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sticker: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  stickerEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  stickerEmpty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  stickerEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${AccentColor}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerEmptyText: {
    textAlign: 'center',
  },
  tokoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: 999,
  },
  tokoLinkText: {
    color: AccentColor,
    flexShrink: 1,
  },
  // Misc
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
