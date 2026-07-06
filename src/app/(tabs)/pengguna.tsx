import { Flame, Gem, LogOut, User } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DiamondColor, StreakColor } from '@/constants/labs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { useAuth } from '@/state/auth';
import { useProgress } from '@/state/progress';

export default function Pengguna() {
  const theme = useTheme();
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);
  const streak = useProgress((s) => s.streak.count);
  const diamonds = useProgress((s) => s.diamonds);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
            <User color={theme.textSecondary} size={36} />
          </View>
          <ThemedText type="subtitle" style={styles.name}>
            {profile ? `${profile.firstName} ${profile.lastName}`.trim() : strings.pengguna}
          </ThemedText>
          {profile?.age ? (
            <ThemedText themeColor="textSecondary">{strings.ageYears(profile.age)}</ThemedText>
          ) : null}

          <View style={styles.statRow}>
            <View style={[styles.statChip, { backgroundColor: `${StreakColor}22` }]}>
              <Flame color={StreakColor} fill={StreakColor} size={18} />
              <ThemedText type="smallBold" style={{ color: StreakColor }}>
                {streak}
              </ThemedText>
            </View>
            <View style={[styles.statChip, { backgroundColor: `${DiamondColor}22` }]}>
              <Gem color={DiamondColor} fill={DiamondColor} size={18} />
              <ThemedText type="smallBold" style={{ color: DiamondColor }}>
                {diamonds.toLocaleString('id-ID')}
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={signOut}
            style={({ pressed }) => [
              styles.signOut,
              { borderColor: theme.backgroundSelected },
              pressed && styles.signOutPressed,
            ]}>
            <LogOut color={theme.text} size={18} />
            <ThemedText type="smallBold">{strings.signOut}</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
  },
  signOutPressed: {
    opacity: 0.7,
  },
});
