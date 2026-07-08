import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Gem } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { StreakCalendar } from '@/components/streak-calendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors } from '@/constants/labs';
import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { levelsForLab } from '@/curriculum';
import { labMasteryPercent } from '@/curriculum/mastery';
import { Operation, OPERATION_SYMBOL } from '@/curriculum/types';
import { LAB_NAMES, strings } from '@/i18n/strings.id';
import { LABS, useProgress } from '@/state/progress';

export default function Beranda() {
  const childName = useProgress((s) => s.childName);
  const diamonds = useProgress((s) => s.diamonds);
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
          <View style={styles.headerText}>
            <ThemedText type="subtitle" style={styles.greeting}>
              {strings.greeting(childName)}
            </ThemedText>
            <ThemedText style={styles.greetingSub}>{strings.greetingSub}</ThemedText>
          </View>
          <View style={styles.diamondChip}>
            <Gem color="#fff" fill="#fff" size={20} />
            <ThemedText type="smallBold" style={styles.diamondChipText}>
              {diamonds.toLocaleString('id-ID')}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.body, { paddingBottom: Spacing.three, gap: Spacing.five }]}>
          <StreakCalendar />

          <View style={styles.labSection}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
              {strings.labList.toUpperCase()}
            </ThemedText>
            <View style={styles.grid}>
              {LABS.map((lab) => (
                <LabCard key={lab} lab={lab} />
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function LabCard({ lab }: { lab: Operation }) {
  const router = useRouter();
  const progress = useProgress((s) => s.labs[lab]);
  const colors = LabColors[lab];
  const percent = labMasteryPercent(progress, levelsForLab(lab));

  return (
    <Pressable
      onPress={() => router.push(`/lab/${lab}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.soft },
        pressed && styles.cardPressed,
      ]}>
      <View style={[styles.symbolBadge, { backgroundColor: colors.main }]}>
        <ThemedText style={styles.symbolText}>{OPERATION_SYMBOL[lab]}</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.cardTitle}>
        {LAB_NAMES[lab]}
      </ThemedText>
      <ThemedText type="small" style={styles.cardRank}>
        {progress.rank}
      </ThemedText>
      <View style={styles.cardMeter}>
        <MasteryMeter value={percent} color={colors.main} height={8} />
        <ThemedText type="small" style={styles.cardPercent}>
          {percent}%
        </ThemedText>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    backgroundColor: AccentColor,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    borderBottomLeftRadius: Spacing.five,
    borderBottomRightRadius: Spacing.five,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerText: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  greeting: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 32,
  },
  greetingSub: {
    color: 'rgba(255,255,255,0.85)',
  },
  diamondChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  diamondChipText: {
    color: '#fff',
  },
  body: {
    flex: 1,
    padding: Spacing.four,
  },
  labSection: {
    gap: Spacing.three,
  },
  sectionTitle: {
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    flexBasis: '46%',
    flexGrow: 1,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.one,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  symbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
    transform: [{ rotate: '-6deg' }],
  },
  symbolText: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: 800,
  },
  cardTitle: {
    color: '#1F2937',
    fontSize: 16,
  },
  cardRank: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
  },
  cardMeter: {
    marginTop: Spacing.one,
    gap: Spacing.half,
  },
  cardPercent: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 14,
    alignSelf: 'flex-end',
  },
});
