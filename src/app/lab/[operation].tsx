import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Award, Brain, Calculator, Check, Lock, Star, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors } from '@/constants/labs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { levelsForTingkat, levelsForLab, tingkatsForLab } from '@/curriculum';
import {
  currentTingkat,
  isExamReady,
  isLevelUnlocked,
  labMasteryPercent,
  masteryBand,
} from '@/curriculum/mastery';
import { Level, Operation, OPERATION_SYMBOL, Tipe } from '@/curriculum/types';
import { useTheme } from '@/hooks/use-theme';
import { LAB_NAMES, strings } from '@/i18n/strings.id';
import { useProgress } from '@/state/progress';

const NODE_SIZE = 48;
const EXAM_NODE_SIZE = 56;
const TIMELINE_COL_WIDTH = 64;

const TIPE_ICON: Record<Tipe, typeof Zap> = {
  fakta: Zap,
  algoritma: Calculator,
  konsep: Brain,
};

const TIPE_LABEL: Record<Tipe, string> = {
  fakta: 'Fakta cepat',
  algoritma: 'Algoritma',
  konsep: 'Konsep',
};

export default function PetaKeahlian() {
  const { operation } = useLocalSearchParams<{ operation: Operation }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const lab = operation as Operation;
  const progress = useProgress((s) => s.labs[lab]);
  const colors = LabColors[lab];
  const tingkats = tingkatsForLab(lab);
  const activeTingkat = currentTingkat(progress, lab);
  const overallPercent = labMasteryPercent(progress, levelsForLab(lab));

  const [selectedTingkat, setSelectedTingkat] = useState(activeTingkat);
  const selectedLevels = levelsForTingkat(lab, selectedTingkat);
  const selectedPassed = progress.tingkatPassed.includes(selectedTingkat);
  const selectedReachable = selectedTingkat <= activeTingkat;

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View
          style={[styles.header, { backgroundColor: colors.main, paddingTop: insets.top + Spacing.two }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed && styles.rowPressed]}>
            <ArrowLeft color={colors.main} size={22} />
          </Pressable>

          <View style={[styles.symbolBadge, { backgroundColor: theme.background }]}>
            <ThemedText style={[styles.symbolText, { color: colors.main }]}>
              {OPERATION_SYMBOL[lab]}
            </ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.title}>
            {LAB_NAMES[lab]}
          </ThemedText>
          <View style={styles.rankPill}>
            <Award color="#fff" size={14} />
            <ThemedText type="small" style={styles.rankPillText}>
              {progress.rank}
            </ThemedText>
          </View>

          <View style={styles.headerMeter}>
            <MasteryMeter value={overallPercent} color="#fff" height={10} />
            <ThemedText type="small" style={styles.headerMeterLabel}>
              {strings.penguasaan}: {overallPercent}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}>
            {tingkats.map((tingkat) => {
              const passed = progress.tingkatPassed.includes(tingkat);
              const reachable = tingkat <= activeTingkat;
              const active = tingkat === selectedTingkat;
              return (
                <Pressable
                  key={tingkat}
                  onPress={() => setSelectedTingkat(tingkat)}
                  style={({ pressed }) => [styles.tab, pressed && styles.rowPressed]}>
                  <ThemedText
                    type={active ? 'smallBold' : 'small'}
                    themeColor={active ? undefined : 'textSecondary'}
                    style={active && { color: colors.main }}>
                    {strings.tingkat(tingkat)}
                  </ThemedText>
                  <View style={styles.tabSub}>
                    {!reachable && <Lock size={11} color={theme.textSecondary} />}
                    {passed && <Check size={12} color={colors.main} strokeWidth={3} />}
                    <ThemedText type="small" themeColor="textSecondary" style={styles.tabSubText}>
                      {passed
                        ? 'Selesai'
                        : reachable
                          ? `${levelsForTingkat(lab, tingkat).length} level`
                          : 'Terkunci'}
                    </ThemedText>
                  </View>
                  <View style={[styles.tabUnderline, active && { backgroundColor: colors.main }]} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.timeline}>
            <View
              style={[
                styles.timelineLine,
                { left: TIMELINE_COL_WIDTH / 2, borderColor: theme.backgroundSelected },
              ]}
            />
            {selectedLevels.map((level) => (
              <TimelineNode key={level.id} level={level} reachable={selectedReachable} />
            ))}
            <TimelineExamNode
              lab={lab}
              tingkat={selectedTingkat}
              passed={selectedPassed}
              reachable={selectedReachable}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function TimelineNode({ level, reachable }: { level: Level; reachable: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const progress = useProgress((s) => s.labs[level.lab]);
  const colors = LabColors[level.lab];
  const mastery = progress.levels[level.id]?.mastery ?? 0;
  const unlocked = reachable && isLevelUnlocked(progress, level);
  const band = masteryBand(mastery);
  const mastered = band === 'dikuasai';
  const TipeIcon = TIPE_ICON[level.tipe];

  return (
    <Pressable
      disabled={!unlocked}
      onPress={() => router.push(`/practice/${level.lab}/${level.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowIconCol}>
        <View
          style={[
            styles.node,
            { backgroundColor: theme.background },
            !unlocked && { backgroundColor: theme.backgroundSelected },
            unlocked && !mastered && { borderWidth: 3, borderColor: colors.main },
            unlocked && mastered && { backgroundColor: colors.main, borderWidth: 0 },
          ]}>
          {!unlocked ? (
            <Lock color={theme.textSecondary} size={18} />
          ) : mastered ? (
            <Check color="#fff" size={20} strokeWidth={3} />
          ) : (
            <TipeIcon color={colors.main} size={20} />
          )}
          {level.isCore && (
            <View
              style={[styles.coreBadge, { backgroundColor: unlocked ? '#F59E0B' : theme.backgroundSelected }]}>
              <Star color="#fff" fill="#fff" size={10} />
            </View>
          )}
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.backgroundElement },
          unlocked && styles.cardShadow,
          !unlocked && styles.cardLocked,
        ]}>
        <View style={styles.cardMain}>
          <ThemedText type="smallBold" themeColor={unlocked ? undefined : 'textSecondary'}>
            {level.labelId}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {TIPE_LABEL[level.tipe]}
          </ThemedText>
        </View>
        <ThemedText
          type="smallBold"
          themeColor={unlocked ? undefined : 'textSecondary'}
          style={mastered ? { color: colors.main } : undefined}>
          {!unlocked ? '—' : mastered ? 'Selesai' : `${mastery}%`}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function TimelineExamNode({
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
  const active = passed || ready;

  return (
    <Pressable
      disabled={!ready}
      onPress={() => router.push(`/exam/${lab}/${tingkat}`)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowIconCol}>
        <View
          style={[
            styles.node,
            styles.examNode,
            { backgroundColor: theme.background },
            !active && { backgroundColor: theme.backgroundSelected },
            ready && { borderWidth: 3, borderColor: colors.main },
            passed && { backgroundColor: colors.main, borderWidth: 0 },
          ]}>
          {passed ? (
            <Check color="#fff" size={24} strokeWidth={3} />
          ) : (
            <Award color={ready ? colors.main : theme.textSecondary} size={24} />
          )}
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.backgroundElement },
          active && styles.cardShadow,
          !active && styles.cardLocked,
        ]}>
        <View style={styles.cardMain}>
          <ThemedText type="smallBold" themeColor={active ? undefined : 'textSecondary'} style={active && { color: colors.main }}>
            {strings.ujian}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {passed ? strings.ujianRules : ready ? strings.ujianReady : strings.ujianLocked(tingkat)}
          </ThemedText>
        </View>
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
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.four,
    paddingTop: Spacing.two,
    borderBottomLeftRadius: Spacing.five,
    borderBottomRightRadius: Spacing.five,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: Spacing.one,
  },
  symbolBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  symbolText: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: 800,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 28,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  rankPillText: {
    color: '#fff',
  },
  headerMeter: {
    width: '100%',
    gap: Spacing.half,
    marginTop: Spacing.two,
  },
  headerMeterLabel: {
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.9)',
  },
  tabsWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  tabsContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
  },
  tab: {
    alignItems: 'center',
    gap: Spacing.half,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    minWidth: 84,
  },
  tabSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  tabSubText: {
    fontSize: 11,
  },
  tabUnderline: {
    marginTop: Spacing.one,
    height: 3,
    width: '100%',
    borderRadius: 2,
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  timeline: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: NODE_SIZE / 2,
    bottom: EXAM_NODE_SIZE / 2,
    width: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
  },
  rowIconCol: {
    width: TIMELINE_COL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examNode: {
    width: EXAM_NODE_SIZE,
    height: EXAM_NODE_SIZE,
    borderRadius: EXAM_NODE_SIZE / 2,
  },
  coreBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  cardMain: {
    gap: Spacing.half,
    flexShrink: 1,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLocked: {
    opacity: 0.55,
  },
  rowPressed: {
    opacity: 0.75,
  },
});
