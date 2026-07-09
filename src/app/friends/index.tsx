import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Check, Flame, Gem, Share2, UserPlus, X } from 'lucide-react-native';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DiamondColor, StreakColor } from '@/constants/labs';
import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { type Friend, type Pending, useFriends } from '@/state/friends';

type Theme = ReturnType<typeof useTheme>;

// Deterministic avatar color from an id, so a given friend always looks the same.
const AVATAR_COLORS = ['#3B82F6', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initialOf(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}
function fullName(first: string, last: string): string {
  return `${first} ${last}`.trim();
}

export default function TemanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const friends = useFriends((s) => s.friends);
  const incoming = useFriends((s) => s.incoming);
  const outgoing = useFriends((s) => s.outgoing);
  const myCode = useFriends((s) => s.myCode);
  const respond = useFriends((s) => s.respond);
  const remove = useFriends((s) => s.remove);
  const load = useFriends((s) => s.load);

  // Refresh on focus — friend streaks change when either party practices, and a
  // friend's active_days changes aren't visible to our realtime (own-rows RLS),
  // so re-pull whenever the screen comes forward.
  useFocusEffect(useCallback(() => void load(), [load]));

  const onShare = useCallback(() => {
    if (!myCode) return;
    void Share.share({ message: strings.bagikanKodePesan(myCode) });
  }, [myCode]);

  const onRemove = useCallback(
    (f: Friend) => {
      Alert.alert(strings.hapusTeman, strings.hapusTemanKonfirmasi(fullName(f.first_name, f.last_name)), [
        { text: strings.batal, style: 'cancel' },
        { text: strings.hapus, style: 'destructive', onPress: () => void remove(f.friendship_id) },
      ]);
    },
    [remove]
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={strings.batal}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ArrowLeft color={AccentColor} size={22} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {strings.temanJudul}
          </ThemedText>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* My friend code */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              {strings.kodeTemanku}
            </ThemedText>
            <ThemedText type="title" style={styles.code}>
              {myCode ?? '••••••'}
            </ThemedText>
            <View style={styles.codeActions}>
              <Pressable
                onPress={onShare}
                disabled={!myCode}
                accessibilityRole="button"
                accessibilityLabel={strings.bagikanKode}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, !myCode && styles.disabled]}>
                <Share2 color="#fff" size={18} strokeWidth={2.4} />
                <ThemedText type="smallBold" style={styles.primaryBtnText}>
                  {strings.bagikanKode}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.push('/friends/add')}
                accessibilityRole="button"
                accessibilityLabel={strings.tambahTeman}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { borderColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}>
                <UserPlus color={theme.text} size={18} strokeWidth={2.4} />
                <ThemedText type="smallBold">{strings.tambahTeman}</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Incoming requests */}
          {incoming.length > 0 ? (
            <>
              <SectionHeader title={strings.permintaanMasuk} theme={theme} count={incoming.length} />
              {incoming.map((p) => (
                <RequestRow key={p.friendship_id} pending={p} theme={theme} onRespond={respond} />
              ))}
            </>
          ) : null}

          {/* Friends list */}
          <SectionHeader title={strings.daftarTeman} theme={theme} count={friends.length || undefined} />
          {friends.length === 0 ? (
            <View style={[styles.card, styles.emptyCard, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                {strings.temanListKosong}
              </ThemedText>
            </View>
          ) : (
            friends.map((f) => <FriendRow key={f.friendship_id} friend={f} theme={theme} onRemove={onRemove} />)
          )}

          {/* Outgoing pending */}
          {outgoing.length > 0 ? (
            <>
              <SectionHeader title={strings.menungguKonfirmasi} theme={theme} />
              {outgoing.map((p) => (
                <View key={p.friendship_id} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
                  <Avatar id={p.user_id} name={p.first_name} />
                  <View style={styles.rowText}>
                    <ThemedText type="smallBold">{fullName(p.first_name, p.last_name)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {strings.menungguKonfirmasi}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Avatar({ id, name }: { id: string; name: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: avatarColor(id) }]}>
      <ThemedText type="smallBold" style={styles.avatarInitial}>
        {initialOf(name)}
      </ThemedText>
    </View>
  );
}

function SectionHeader({ title, theme, count }: { title: string; theme: Theme; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      {count !== undefined ? (
        <View style={[styles.sectionBadge, { backgroundColor: `${AccentColor}18` }]}>
          <ThemedText type="small" style={styles.sectionBadgeText}>
            {count}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function RequestRow({
  pending,
  theme,
  onRespond,
}: {
  pending: Pending;
  theme: Theme;
  onRespond: (id: string, accept: boolean) => void;
}) {
  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <Avatar id={pending.user_id} name={pending.first_name} />
      <View style={styles.rowText}>
        <ThemedText type="smallBold">{fullName(pending.first_name, pending.last_name)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {strings.permintaanTeman}
        </ThemedText>
      </View>
      <Pressable
        onPress={() => onRespond(pending.friendship_id, false)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={strings.tolak}
        style={({ pressed }) => [styles.iconBtn, { borderColor: theme.backgroundSelected }, pressed && styles.pressed]}>
        <X color={theme.textSecondary} size={18} strokeWidth={2.6} />
      </Pressable>
      <Pressable
        onPress={() => onRespond(pending.friendship_id, true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={strings.terima}
        style={({ pressed }) => [styles.iconBtn, styles.acceptBtn, pressed && styles.pressed]}>
        <Check color="#fff" size={18} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

function FriendRow({
  friend,
  theme,
  onRemove,
}: {
  friend: Friend;
  theme: Theme;
  onRemove: (f: Friend) => void;
}) {
  return (
    <Pressable
      onLongPress={() => onRemove(friend)}
      accessibilityRole="button"
      accessibilityLabel={fullName(friend.first_name, friend.last_name)}
      accessibilityHint={strings.hapusTeman}
      style={({ pressed }) => [styles.row, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
      <Avatar id={friend.friend_id} name={friend.first_name} />
      <View style={styles.rowText}>
        <ThemedText type="smallBold">{fullName(friend.first_name, friend.last_name)}</ThemedText>
        <View style={styles.diamondRow}>
          <Gem color={DiamondColor} fill={DiamondColor} size={13} />
          <ThemedText type="small" themeColor="textSecondary">
            {friend.diamonds.toLocaleString('id-ID')}
          </ThemedText>
        </View>
      </View>
      {friend.streak > 0 ? (
        <View
          style={[
            styles.streakPill,
            { backgroundColor: friend.sharedToday ? `${StreakColor}22` : theme.backgroundSelected },
          ]}
          accessibilityLabel={strings.runtunanHari(friend.streak)}>
          <Flame
            color={friend.sharedToday ? StreakColor : theme.textSecondary}
            fill={friend.sharedToday ? StreakColor : 'transparent'}
            size={15}
          />
          <ThemedText
            type="smallBold"
            style={[styles.streakNum, { color: friend.sharedToday ? StreakColor : theme.textSecondary }]}>
            {friend.streak}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.five },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  code: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 6,
    color: AccentColor,
    fontWeight: '800',
  },
  codeActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
    alignSelf: 'stretch',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: AccentColor,
    paddingVertical: Spacing.three,
    borderRadius: 999,
  },
  primaryBtnText: { color: '#fff' },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    marginBottom: Spacing.half,
  },
  sectionTitle: { letterSpacing: 1, fontSize: 12 },
  sectionBadge: {
    minWidth: 20,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: 'center',
  },
  sectionBadgeText: { color: AccentColor, fontWeight: '700', fontSize: 11 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  rowText: { flex: 1, gap: 2 },
  diamondRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  streakNum: { fontSize: 13 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 17 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  acceptBtn: { backgroundColor: AccentColor, borderColor: AccentColor },
  emptyCard: { alignItems: 'center' },
  emptyText: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
