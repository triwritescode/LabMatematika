import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Award, Check, Lock } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors } from '@/constants/labs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { levelsForTingkat, tingkatsForLab } from '@/curriculum';
import {
  currentTingkat,
  isExamReady,
  isLevelUnlocked,
  masteryBand,
} from '@/curriculum/mastery';
import { Level, Operation } from '@/curriculum/types';
import { useTheme } from '@/hooks/use-theme';
import { LAB_NAMES, strings } from '@/i18n/strings.id';
import { useProgress } from '@/state/progress';

const BAND_LABEL = {
  belum: strings.bandBelum,
  sedang: strings.bandSedang,
  dikuasai: strings.bandDikuasai,
} as const;

export default function PetaKeahlian() {
  const { operation } = useLocalSearchParams<{ operation: Operation }>();
  const router = useRouter();
  const theme = useTheme();
  const lab = operation as Operation;
  const progress = useProgress((s) => s.labs[lab]);
  const colors = LabColors[lab];
  const tingkats = tingkatsForLab(lab);
  const activeTingkat = currentTingkat(progress, lab);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft color={theme.text} size={26} />
          </Pressable>
          <View style={styles.headerText}>
            <ThemedText type="smallBold" style={{ color: colors.main }}>
              {strings.petaKeahlian}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.title}>
              Lab {LAB_NAMES[lab]}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {progress.rank}
            </ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {tingkats.map((tingkat) => {
            const passed = progress.tingkatPassed.includes(tingkat);
            const reachable = tingkat <= activeTingkat;
            return (
              <View key={tingkat} style={styles.tingkatSection}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.tingkatTitle}>
                  {strings.tingkat(tingkat).toUpperCase()}
                  {passed ? '  ✓' : ''}
                </ThemedText>
                {levelsForTingkat(lab, tingkat).map((level) => (
                  <LevelRow key={level.id} level={level} reachable={reachable} />
                ))}
                <ExamRow lab={lab} tingkat={tingkat} passed={passed} reachable={reachable} />
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function LevelRow({ level, reachable }: { level: Level; reachable: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const progress = useProgress((s) => s.labs[level.lab]);
  const colors = LabColors[level.lab];
  const mastery = progress.levels[level.id]?.mastery ?? 0;
  const unlocked = reachable && isLevelUnlocked(progress, level);
  const band = masteryBand(mastery);

  return (
    <Pressable
      disabled={!unlocked}
      onPress={() => router.push(`/practice/${level.lab}/${level.id}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        !unlocked && styles.rowLocked,
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.rowHeader}>
        <ThemedText type="smallBold" style={styles.rowLabel}>
          {level.labelId}
          {level.isCore ? ' ⭐' : ''}
        </ThemedText>
        {unlocked ? (
          <ThemedText type="small" themeColor="textSecondary">
            {mastery}% · {BAND_LABEL[band]}
          </ThemedText>
        ) : (
          <Lock color={theme.textSecondary} size={16} />
        )}
      </View>
      <MasteryMeter value={unlocked ? mastery : 0} color={colors.main} height={8} />
      {!unlocked && (
        <ThemedText type="small" themeColor="textSecondary">
          {strings.lockedHint}
        </ThemedText>
      )}
    </Pressable>
  );
}

function ExamRow({
  lab,
  tingkat,
  passed,
  reachable,
}: {
  lab: Operation;
  tingkat: number;
  passed: boolean;
  reachable: boolean;
}) {
  const router = useRouter();
  const theme = useTheme();
  const progress = useProgress((s) => s.labs[lab]);
  const colors = LabColors[lab];
  const ready = reachable && !passed && isExamReady(progress, lab, tingkat);

  if (passed) {
    return (
      <View style={[styles.row, styles.examRow, { borderColor: colors.main }]}>
        <View style={styles.rowHeader}>
          <View style={styles.examTitle}>
            <Check color={colors.main} size={18} strokeWidth={3} />
            <ThemedText type="smallBold" style={{ color: colors.main }}>
              {strings.ujian} — {strings.lulus}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      disabled={!ready}
      onPress={() => router.push(`/exam/${lab}/${tingkat}`)}
      style={({ pressed }) => [
        styles.row,
        styles.examRow,
        { borderColor: ready ? colors.main : theme.backgroundSelected },
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.rowHeader}>
        <View style={styles.examTitle}>
          <Award color={ready ? colors.main : theme.textSecondary} size={18} />
          <ThemedText
            type="smallBold"
            style={{ color: ready ? colors.main : theme.textSecondary }}>
            {strings.ujian}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {ready ? strings.ujianReady : strings.ujianLocked(tingkat)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.two,
  },
  headerText: {
    gap: Spacing.half,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  tingkatSection: {
    gap: Spacing.two,
  },
  tingkatTitle: {
    letterSpacing: 1,
  },
  row: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowLocked: {
    opacity: 0.55,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rowLabel: {
    flexShrink: 1,
  },
  examRow: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  examTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
