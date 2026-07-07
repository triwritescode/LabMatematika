import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Flame,
  Layers,
  Lock,
  Medal,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors } from '@/constants/labs';
import { AccentColor, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { levelsForLab, tingkatsForLab } from '@/curriculum';
import { isLevelUnlocked, labMasteryPercent, masteryBand } from '@/curriculum/mastery';
import { LabProgress, Level, Operation, OPERATION_SYMBOL } from '@/curriculum/types';
import { useTheme } from '@/hooks/use-theme';
import { LAB_NAMES, strings } from '@/i18n/strings.id';
import { LABS, useCurrentStreak, useProgress } from '@/state/progress';

type Theme = ReturnType<typeof useTheme>;

export default function Laboratorium() {
  const streak = useCurrentStreak();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
          <View style={styles.headerText}>
            <ThemedText type="subtitle" style={styles.title}>
              {strings.laboratorium}
            </ThemedText>
            <ThemedText style={styles.titleSub}>{strings.labProgressSub}</ThemedText>
          </View>
          {streak > 0 && (
            <View style={styles.streakPill}>
              <Flame color="#fff" fill="#fff" size={18} />
              <ThemedText type="smallBold" style={styles.streakPillText}>
                {strings.streak(streak)}
              </ThemedText>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {LABS.map((lab) => (
            <LabSummary key={lab} lab={lab} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function LabSummary({ lab }: { lab: Operation }) {
  const router = useRouter();
  const theme = useTheme();
  const progress = useProgress((s) => s.labs[lab]);
  const colors = LabColors[lab];
  const levels = levelsForLab(lab);
  const percent = labMasteryPercent(progress, levels);
  const totalTingkat = tingkatsForLab(lab).length;
  const masteredCount = levels.filter(
    (level) => masteryBand(progress.levels[level.id]?.mastery ?? 0) === 'dikuasai'
  ).length;
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderLeftColor: colors.main }]}>
      <Pressable
        onPress={() => router.push(`/lab/${lab}`)}
        style={({ pressed }) => [styles.cardTop, pressed && styles.cardPressed]}>
        <View style={styles.cardHeader}>
          <View style={[styles.symbolBadge, { backgroundColor: colors.main }]}>
            <ThemedText style={styles.symbolText}>{OPERATION_SYMBOL[lab]}</ThemedText>
          </View>
          <View style={styles.cardHeaderText}>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              {LAB_NAMES[lab]}
            </ThemedText>
            <View style={styles.rank}>
              <Medal color={colors.main} size={14} />
              <ThemedText type="small" themeColor="textSecondary">
                {progress.rank}
              </ThemedText>
            </View>
          </View>
          <ChevronRight color={theme.textSecondary} size={20} />
        </View>

        <View style={styles.meterRow}>
          <View style={styles.meter}>
            <MasteryMeter value={percent} color={colors.main} />
          </View>
          <ThemedText type="smallBold">{percent}%</ThemedText>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: colors.soft }]}>
            <Layers color={colors.main} size={14} />
            <ThemedText type="small" style={{ color: colors.main }}>
              {progress.tingkatPassed.length}/{totalTingkat} tingkat
            </ThemedText>
          </View>
          <View style={[styles.statChip, { backgroundColor: colors.soft }]}>
            <CheckCircle2 color={colors.main} size={14} />
            <ThemedText type="small" style={{ color: colors.main }}>
              {masteredCount}/{levels.length} {strings.bandDikuasai.toLowerCase()}
            </ThemedText>
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={({ pressed }) => [styles.toggleRow, pressed && styles.cardPressed]}>
        <ThemedText type="smallBold" style={{ color: colors.main }}>
          {expanded ? strings.sembunyikanSkill : strings.lihatSemuaSkill(levels.length)}
        </ThemedText>
        <ChevronDown
          color={colors.main}
          size={18}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {expanded && (
        <View style={styles.skillList}>
          {levels.map((level, i) => (
            <SkillRow
              key={level.id}
              level={level}
              progress={progress}
              colors={colors}
              theme={theme}
              isLast={i === levels.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SkillRow({
  level,
  progress,
  colors,
  theme,
  isLast,
}: {
  level: Level;
  progress: LabProgress;
  colors: (typeof LabColors)[Operation];
  theme: Theme;
  isLast: boolean;
}) {
  const router = useRouter();
  const mastery = progress.levels[level.id]?.mastery ?? 0;
  const unlocked = isLevelUnlocked(progress, level);
  const mastered = masteryBand(mastery) === 'dikuasai';

  return (
    <Pressable
      disabled={!unlocked}
      onPress={() => router.push(`/practice/${level.lab}/${level.id}`)}
      style={({ pressed }) => [
        styles.skillRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.backgroundSelected },
        pressed && unlocked && styles.cardPressed,
      ]}>
      <View
        style={[
          styles.skillDot,
          { backgroundColor: theme.backgroundSelected },
          unlocked && !mastered && { backgroundColor: colors.soft, borderWidth: 2, borderColor: colors.main },
          mastered && { backgroundColor: colors.main },
        ]}>
        {!unlocked ? (
          <Lock size={12} color={theme.textSecondary} />
        ) : mastered ? (
          <Check size={13} color="#fff" strokeWidth={3} />
        ) : null}
      </View>
      <ThemedText
        type="small"
        numberOfLines={1}
        themeColor={unlocked ? undefined : 'textSecondary'}
        style={styles.skillRowLabel}>
        {level.labelId}
      </ThemedText>
      <ThemedText
        type="smallBold"
        themeColor="textSecondary"
        style={mastered && { color: colors.main }}>
        {!unlocked ? strings.terkunci : mastered ? strings.selesai : `${mastery}%`}
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
  title: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 32,
  },
  titleSub: {
    color: 'rgba(255,255,255,0.85)',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  streakPillText: {
    color: '#fff',
  },
  content: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.four,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardTop: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  symbolBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  symbolText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: 800,
  },
  cardHeaderText: {
    flex: 1,
    gap: Spacing.half,
  },
  cardTitle: {
    fontSize: 17,
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  skillList: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  skillDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillRowLabel: {
    flex: 1,
  },
});
