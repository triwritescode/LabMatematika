import { Flame, Medal } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors, StreakColor } from '@/constants/labs';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { levelsForLab, tingkatsForLab } from '@/curriculum';
import { labMasteryPercent, masteryBand } from '@/curriculum/mastery';
import { Operation } from '@/curriculum/types';
import { useTheme } from '@/hooks/use-theme';
import { LAB_NAMES, strings } from '@/i18n/strings.id';
import { LABS, useCurrentStreak, useProgress } from '@/state/progress';

export default function Laboratorium() {
  const streak = useCurrentStreak();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.title}>
            {strings.laboratorium}
          </ThemedText>

          {streak > 0 && (
            <View style={styles.streakRow}>
              <Flame color={StreakColor} fill={StreakColor} size={20} />
              <ThemedText type="smallBold" style={{ color: StreakColor }}>
                Runtutan {strings.streak(streak)}
              </ThemedText>
            </View>
          )}

          {LABS.map((lab) => (
            <LabSummary key={lab} lab={lab} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const BAND_LABEL = {
  belum: strings.bandBelum,
  sedang: strings.bandSedang,
  dikuasai: strings.bandDikuasai,
} as const;

function LabSummary({ lab }: { lab: Operation }) {
  const theme = useTheme();
  const progress = useProgress((s) => s.labs[lab]);
  const colors = LabColors[lab];
  const levels = levelsForLab(lab);
  const percent = labMasteryPercent(progress, levels);
  const totalTingkat = tingkatsForLab(lab).length;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.cardHeader}>
        <ThemedText type="smallBold" style={{ color: colors.main }}>
          Lab {LAB_NAMES[lab]}
        </ThemedText>
        <View style={styles.rank}>
          <Medal color={colors.main} size={16} />
          <ThemedText type="small" themeColor="textSecondary">
            {progress.rank}
          </ThemedText>
        </View>
      </View>

      <View style={styles.meterRow}>
        <View style={styles.meter}>
          <MasteryMeter value={percent} color={colors.main} />
        </View>
        <ThemedText type="smallBold">{percent}%</ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {strings.tingkat(progress.tingkatPassed.length)} dari {totalTingkat} lulus ujian
      </ThemedText>

      <View style={styles.levels}>
        {levels.map((level) => {
          const mastery = progress.levels[level.id]?.mastery ?? 0;
          return (
            <View key={level.id} style={styles.levelRow}>
              <ThemedText type="small" style={styles.levelLabel}>
                {level.labelId}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {BAND_LABEL[masteryBand(mastery)]}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
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
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  meter: {
    flex: 1,
  },
  levels: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  levelLabel: {
    flexShrink: 1,
  },
});
