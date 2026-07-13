import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { Numpad } from '@/components/numpad';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors } from '@/constants/labs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getSkill } from '@/curriculum';
import { buildExam, ExamAnswer, judgeExam } from '@/curriculum/exam';
import { rankFor } from '@/curriculum/mastery';
import { Operation } from '@/curriculum/types';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { useProgress } from '@/state/progress';

// Ujian Kenaikan Level: test conditions — no hints, no explanations,
// no re-queue, NO timer (specs §4.3).
export default function Ujian() {
  const params = useLocalSearchParams<{ operation: Operation; level: string }>();
  const router = useRouter();
  const theme = useTheme();
  const lab = params.operation as Operation;
  const level = Number(params.level);
  const colors = LabColors[lab];

  const passLevel = useProgress((s) => s.passLevel);
  const touchStreak = useProgress((s) => s.touchStreak);
  const addDiamonds = useProgress((s) => s.addDiamonds);

  const [questions] = useState(() => buildExam(lab, level));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [input, setInput] = useState('');
  const [finished, setFinished] = useState(false);
  // Guards the terminal award (passLevel/streak/diamonds) against a double-tap
  // firing submit twice on the last question before the re-render disables it.
  const finalized = useRef(false);

  const question = questions[index];

  function submit() {
    if (!input) return;
    Haptics.selectionAsync();
    const nextAnswers = [
      ...answers,
      { question, correct: Number(input) === question.answer },
    ];
    setAnswers(nextAnswers);
    setInput('');
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      if (finalized.current) return;
      finalized.current = true;
      const verdict = judgeExam(nextAnswers);
      if (verdict.passed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        passLevel(lab, level);
      }
      touchStreak();
      // Earn 1 diamond per correct answer (runs once — this branch is terminal).
      if (verdict.correctCount > 0) addDiamonds(verdict.correctCount);
      setFinished(true);
    }
  }

  if (finished) {
    const verdict = judgeExam(answers);
    const failedLevel = verdict.failedLevelId ? getSkill(verdict.failedLevelId) : undefined;
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.verdictWrap]}>
          <View style={[styles.verdictCard, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle" style={styles.verdictTitle}>
              {verdict.passed ? strings.lulus : strings.hampir}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {strings.examScore(verdict.correctCount, answers.length)}
            </ThemedText>

            {verdict.passed ? (
              <>
                <ThemedText type="smallBold" style={{ color: colors.main }}>
                  {strings.naikTingkat(level + 1)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {strings.rankBaru(rankFor(lab, [level]))}
                </ThemedText>
                <Pressable
                  onPress={() => router.back()}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.main },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={{ color: '#fff' }}>
                    {strings.lanjut}
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                {failedLevel && (
                  <ThemedText type="smallBold">
                    {strings.perluDikuatkan(failedLevel.labelId)}
                  </ThemedText>
                )}
                <Pressable
                  onPress={() =>
                    failedLevel
                      ? router.replace(`/practice/${lab}/${failedLevel.id}`)
                      : router.back()
                  }
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.main },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={{ color: '#fff' }}>
                    {strings.latihanLagi}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => router.back()}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: theme.backgroundSelected },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold">{strings.kembali}</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <X color={theme.textSecondary} size={26} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="small" themeColor="textSecondary">
              {strings.ujian} · {strings.level(level)}
            </ThemedText>
            <ThemedText type="smallBold">
              {strings.soalOf(index + 1, questions.length)}
            </ThemedText>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <MasteryMeter value={(index / questions.length) * 100} color={colors.main} height={6} />

        <View style={styles.questionArea}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rules}>
            {strings.ujianRules}
          </ThemedText>
          <ThemedText style={styles.question}>
            {question.prompt} = {input || '…'}
          </ThemedText>
        </View>

        <View style={styles.numpadWrap}>
          <Numpad
            onDigit={(d) => input.length < 6 && setInput(input + d)}
            onBackspace={() => setInput(input.slice(0, -1))}
            onSubmit={submit}
            submitDisabled={!input}
            accentColor={colors.main}
          />
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
  rules: {
    textAlign: 'center',
  },
  question: {
    fontSize: 44,
    lineHeight: 56,
    fontWeight: 800,
    textAlign: 'center',
  },
  numpadWrap: {
    paddingTop: Spacing.two,
  },
  verdictWrap: {
    justifyContent: 'center',
  },
  verdictCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  verdictTitle: {
    fontSize: 30,
    lineHeight: 36,
  },
  button: {
    borderRadius: 999,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
