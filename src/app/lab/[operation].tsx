import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Award, Check, Lock, Star } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors } from '@/constants/labs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { levelsForLab, levelsForTingkat, tingkatsForLab } from '@/curriculum';
import {
  currentTingkat,
  isExamReady,
  isLevelUnlocked,
  labMasteryPercent,
  masteryBand,
} from '@/curriculum/mastery';
import { Level, Operation, OPERATION_SYMBOL } from '@/curriculum/types';
import { useTheme } from '@/hooks/use-theme';
import { LAB_NAMES, strings } from '@/i18n/strings.id';
import { useProgress } from '@/state/progress';

// Zigzag offsets for the Duolingo-style skill path, cycling every 4 nodes.
const PATH_OFFSETS = [0, 56, 0, -56];
const NODE_SIZE = 76;
const EXAM_NODE_SIZE = 92;

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

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {tingkats.map((tingkat) => {
            const passed = progress.tingkatPassed.includes(tingkat);
            const reachable = tingkat <= activeTingkat;
            const levels = levelsForTingkat(lab, tingkat);
            return (
              <View key={tingkat} style={styles.tingkatSection}>
                <View style={[styles.tingkatBanner, { backgroundColor: colors.soft }]}>
                  <ThemedText type="smallBold" style={{ color: colors.main }}>
                    {strings.tingkat(tingkat).toUpperCase()}
                  </ThemedText>
                  {passed && <Check color={colors.main} size={16} strokeWidth={3} />}
                </View>

                <View style={styles.path}>
                  {levels.map((level, i) => (
                    <PathNode
                      key={level.id}
                      level={level}
                      reachable={reachable}
                      offset={PATH_OFFSETS[i % PATH_OFFSETS.length]}
                    />
                  ))}
                  <ExamNode
                    lab={lab}
                    tingkat={tingkat}
                    passed={passed}
                    reachable={reachable}
                    offset={PATH_OFFSETS[levels.length % PATH_OFFSETS.length]}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function PathNode({
  level,
  reachable,
  offset,
}: {
  level: Level;
  reachable: boolean;
  offset: number;
}) {
  const router = useRouter();
  const theme = useTheme();
  const progress = useProgress((s) => s.labs[level.lab]);
  const colors = LabColors[level.lab];
  const mastery = progress.levels[level.id]?.mastery ?? 0;
  const unlocked = reachable && isLevelUnlocked(progress, level);
  const band = masteryBand(mastery);
  const mastered = band === 'dikuasai';

  return (
    <View style={[styles.nodeWrap, { transform: [{ translateX: offset }] }]}>
      <Pressable
        disabled={!unlocked}
        onPress={() => router.push(`/practice/${level.lab}/${level.id}`)}
        style={({ pressed }) => [
          styles.node,
          !unlocked && { backgroundColor: theme.backgroundSelected },
          unlocked &&
            !mastered && {
              backgroundColor: theme.background,
              borderWidth: 5,
              borderColor: colors.main,
            },
          unlocked && mastered && { backgroundColor: colors.main },
          unlocked && styles.nodeShadow,
          pressed && styles.rowPressed,
        ]}>
        {!unlocked ? (
          <Lock color={theme.textSecondary} size={26} />
        ) : mastered ? (
          <Check color="#fff" size={30} strokeWidth={3} />
        ) : (
          <ThemedText type="smallBold" style={{ color: colors.main, fontSize: 18 }}>
            {mastery}%
          </ThemedText>
        )}
        {level.isCore && (
          <View style={[styles.coreBadge, { backgroundColor: unlocked ? '#F59E0B' : theme.backgroundSelected }]}>
            <Star color="#fff" fill="#fff" size={12} />
          </View>
        )}
      </Pressable>
      <ThemedText
        type="small"
        themeColor={unlocked ? undefined : 'textSecondary'}
        style={styles.nodeLabel}
        numberOfLines={2}>
        {level.labelId}
      </ThemedText>
    </View>
  );
}

function ExamNode({
  lab,
  tingkat,
  passed,
  reachable,
  offset,
}: {
  lab: Operation;
  tingkat: number;
  passed: boolean;
  reachable: boolean;
  offset: number;
}) {
  const router = useRouter();
  const theme = useTheme();
  const progress = useProgress((s) => s.labs[lab]);
  const colors = LabColors[lab];
  const ready = reachable && !passed && isExamReady(progress, lab, tingkat);
  const active = passed || ready;

  return (
    <View style={[styles.nodeWrap, { transform: [{ translateX: offset }] }]}>
      <Pressable
        disabled={!ready}
        onPress={() => router.push(`/exam/${lab}/${tingkat}`)}
        style={({ pressed }) => [
          styles.node,
          styles.examNode,
          !active && { backgroundColor: theme.backgroundSelected },
          ready && {
            backgroundColor: theme.background,
            borderWidth: 5,
            borderColor: colors.main,
          },
          passed && { backgroundColor: colors.main },
          active && styles.nodeShadow,
          pressed && styles.rowPressed,
        ]}>
        {passed ? (
          <Check color="#fff" size={34} strokeWidth={3} />
        ) : (
          <Award color={ready ? colors.main : theme.textSecondary} size={34} />
        )}
      </Pressable>
      <ThemedText
        type="smallBold"
        themeColor={active ? undefined : 'textSecondary'}
        style={[styles.nodeLabel, active && { color: colors.main }]}
        numberOfLines={2}>
        {strings.ujian}
      </ThemedText>
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
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.six,
  },
  tingkatSection: {
    gap: Spacing.four,
    alignItems: 'center',
  },
  tingkatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  path: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  nodeWrap: {
    alignItems: 'center',
    gap: Spacing.one,
    width: 100,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  examNode: {
    width: EXAM_NODE_SIZE,
    height: EXAM_NODE_SIZE,
    borderRadius: EXAM_NODE_SIZE / 2,
  },
  coreBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nodeLabel: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 15,
  },
  rowPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
