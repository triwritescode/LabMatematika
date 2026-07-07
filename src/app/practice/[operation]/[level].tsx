import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { Numpad } from '@/components/numpad';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors } from '@/constants/labs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getLevel, makeQuestion } from '@/curriculum';
import { initialDiff, nextDiff } from '@/curriculum/adaptive';
import { explain } from '@/curriculum/explain';
import { Operation, OPERATION_SYMBOL, Question } from '@/curriculum/types';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { useProgress } from '@/state/progress';

const SESSION_SIZE = 10;

type Phase = 'question' | 'correct' | 'wrong' | 'done';

export default function LatihanTerarah() {
  const { level: levelId } = useLocalSearchParams<{ operation: Operation; level: string }>();
  const router = useRouter();
  const theme = useTheme();

  const level = getLevel(levelId);
  const colors = LabColors[level.lab];

  const recordAnswer = useProgress((s) => s.recordAnswer);
  const touchStreak = useProgress((s) => s.touchStreak);
  const masteryNow = useProgress((s) => s.labs[level.lab].levels[level.id]?.mastery ?? 0);
  const [masteryStart, setMasteryStart] = useState(masteryNow);

  // Questions already served this session — no repeats within a Latihan.
  const seenRef = useRef<Set<string>>(new Set());
  const [diff, setDiff] = useState(() => initialDiff(masteryNow));
  const [question, setQuestion] = useState<Question>(() =>
    makeQuestion(level, initialDiff(masteryNow), seenRef.current)
  );
  const [asked, setAsked] = useState(1); // fresh questions served
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [requeue, setRequeue] = useState<Question[]>([]);
  const [isRetry, setIsRetry] = useState(false);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('question');
  const [showSteps, setShowSteps] = useState(false);
  const [mascotLine, setMascotLine] = useState('');
  // Monotonic: only grows when a question is actually requeued, so the
  // displayed total never shrinks mid-session (e.g. 12 -> 11).
  const [totalPlanned, setTotalPlanned] = useState(SESSION_SIZE);

  function submit() {
    if (!input) return;
    const correct = Number(input) === question.answer;
    recordAnswer(level.lab, level.id, correct, question.diff, streak);
    setAnswered((n) => n + 1);
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCorrectCount((n) => n + 1);
      setStreak((s) => s + 1);
      setMascotLine(pickLine(strings.mascotCorrect));
      setPhase('correct');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStreak(0);
      setMascotLine(pickLine(strings.mascotWrong));
      // Missed items re-queue in-session (once).
      if (!isRetry) {
        setRequeue((q) => [...q, question]);
        setTotalPlanned((t) => t + 1);
      }
      setPhase('wrong');
    }
    setDiff((d) => nextDiff(d, correct, correct ? streak + 1 : 0));
  }

  function advance() {
    setInput('');
    setShowSteps(false);
    if (asked < SESSION_SIZE) {
      setQuestion(makeQuestion(level, diff, seenRef.current));
      setAsked((n) => n + 1);
      setIsRetry(false);
      setPhase('question');
    } else if (requeue.length > 0) {
      const [next, ...rest] = requeue;
      setRequeue(rest);
      setQuestion(next);
      setIsRetry(true);
      setPhase('question');
    } else {
      setPhase('done');
    }
  }

  // Correct answers advance automatically after a short beat.
  useEffect(() => {
    if (phase !== 'correct') return;
    const t = setTimeout(advance, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Record the daily streak once the session is actually finished. Keyed on the
  // 'done' phase (not buried in advance()) so it can't be skipped by a stale
  // closure. touchStreak() is idempotent per day.
  useEffect(() => {
    if (phase === 'done') touchStreak();
  }, [phase, touchStreak]);

  function restart() {
    setMasteryStart(masteryNow);
    const d = initialDiff(masteryNow);
    setDiff(d);
    seenRef.current.clear();
    setQuestion(makeQuestion(level, d, seenRef.current));
    setAsked(1);
    setAnswered(0);
    setCorrectCount(0);
    setStreak(0);
    setRequeue([]);
    setIsRetry(false);
    setTotalPlanned(SESSION_SIZE);
    setInput('');
    setShowSteps(false);
    setPhase('question');
  }

  if (phase === 'done') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.doneWrap]}>
          <View style={[styles.doneCard, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle" style={styles.doneTitle}>
              {strings.sessionDone}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {strings.sessionScore(correctCount, answered)}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: colors.main }}>
              {strings.masteryUp(masteryStart, masteryNow)}
            </ThemedText>
            <MasteryMeter value={masteryNow} color={colors.main} />
            <View style={styles.doneButtons}>
              <Pressable
                onPress={restart}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">{strings.ulangi}</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: colors.main },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>
                  {strings.selesai}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const progressIndex = Math.min(answered + 1, totalPlanned);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <X color={theme.textSecondary} size={26} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="small" themeColor="textSecondary">
              {level.labelId}
            </ThemedText>
            <ThemedText type="smallBold">{strings.soalOf(progressIndex, totalPlanned)}</ThemedText>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <MasteryMeter
          value={(progressIndex / totalPlanned) * 100}
          color={colors.main}
          height={6}
        />

        <View style={styles.questionArea}>
          <ThemedText style={styles.question}>
            {question.a} {OPERATION_SYMBOL[level.lab]} {question.b} = {input || '…'}
          </ThemedText>

          {phase === 'correct' && (
            <View style={[styles.banner, styles.bannerCorrect]}>
              <ThemedText type="smallBold" style={styles.bannerTextCorrect}>
                {strings.benar} {mascotLine}
              </ThemedText>
            </View>
          )}

          {phase === 'wrong' && (
            <View style={styles.wrongWrap}>
              <View style={[styles.banner, styles.bannerWrong]}>
                <ThemedText type="smallBold" style={styles.bannerTextWrong}>
                  {strings.belumTepat} — {strings.jawabanBenar(question.answer)}
                </ThemedText>
                <ThemedText type="small" style={styles.bannerTextWrong}>
                  {mascotLine}
                </ThemedText>
              </View>
              {showSteps ? (
                <ScrollView
                  style={[styles.steps, { backgroundColor: theme.backgroundElement }]}
                  contentContainerStyle={styles.stepsContent}>
                  {explain(level.explainId, question.a, question.b).map((step, i) => (
                    <ThemedText key={i} type="small">
                      {i + 1}. {step}
                    </ThemedText>
                  ))}
                </ScrollView>
              ) : (
                <Pressable
                  onPress={() => setShowSteps(true)}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: theme.backgroundSelected },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold">{strings.lihatCaranya}</ThemedText>
                </Pressable>
              )}
              <Pressable
                onPress={advance}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: colors.main },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>
                  {strings.lanjut}
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.numpadWrap}>
          <Numpad
            onDigit={(d) => phase === 'question' && input.length < 6 && setInput(input + d)}
            onBackspace={() => setInput(input.slice(0, -1))}
            onSubmit={submit}
            submitDisabled={!input || phase !== 'question'}
            accentColor={colors.main}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function pickLine(lines: readonly string[]): string {
  return lines[Math.floor(Math.random() * lines.length)];
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
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  headerCenter: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  headerSpacer: {
    width: 26,
  },
  questionArea: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  question: {
    fontSize: 44,
    lineHeight: 56,
    fontWeight: 800,
    textAlign: 'center',
  },
  banner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  bannerCorrect: {
    backgroundColor: '#22C55E22',
  },
  bannerWrong: {
    backgroundColor: '#EF444422',
  },
  bannerTextCorrect: {
    color: '#15803D',
    textAlign: 'center',
  },
  bannerTextWrong: {
    color: '#B91C1C',
  },
  wrongWrap: {
    gap: Spacing.two,
  },
  steps: {
    maxHeight: 180,
    borderRadius: Spacing.three,
  },
  stepsContent: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  button: {
    borderRadius: 999,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    flexGrow: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  numpadWrap: {
    paddingTop: Spacing.two,
  },
  doneWrap: {
    justifyContent: 'center',
  },
  doneCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  doneTitle: {
    fontSize: 26,
    lineHeight: 32,
  },
  doneButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
