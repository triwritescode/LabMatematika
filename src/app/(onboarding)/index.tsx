import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { Easing, FadeIn, Keyframe } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgePicker } from '@/components/age-picker';
import { MasteryMeter } from '@/components/mastery-meter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { MAX_AGE, MIN_AGE, toISODate } from '@/lib/age';
import { useAuth } from '@/state/auth';

// Store a synthetic birth date from the picked age: born `age` years ago on today's
// month/day, so ageFromISO(dob) === age today and stays stable (see docs/plan). The
// DB/sync/profile layers keep consuming an ISO birthDate unchanged. Feb-29 (or any
// day the born-year lacks) falls back to the 28th.
function synthBirthISO(age: number): string {
  const now = new Date();
  const y = now.getFullYear() - age;
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return toISODate(y, m, d) ?? toISODate(y, m, 28) ?? `${y}-01-01`;
}

// Brand accent (matches login, header, active tab) so onboarding feels part of
// the same app rather than a one-off blue screen.
const ACCENT = AccentColor;

// Vertical fade-rise per step. Horizontal translate (the old ±36px translateX)
// let the flex-1 input bleed past the screen's right edge mid-transition — the
// parent doesn't clip on the X axis, and the step remount + keyboard resize made
// the transient overflow visible as a cut-off input box. Y-axis travel is clipped
// by `content`'s overflow:hidden, so no horizontal reflow, no glitch. Direction is
// no longer needed for the animation, but forward/back still adjust it subtly.
const enterForward = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 16 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
});
const enterBack = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -16 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
});
// Birth date is mandatory — age is derived from it and will drive starting skill
// and test difficulty. Derived age must land in [MIN_AGE, MAX_AGE] (from lib/age).
const TOTAL_STEPS = 3;

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export default function Onboarding() {
  const theme = useTheme();
  const prefill = useAuth((s) => s.prefill);
  const saveProfile = useAuth((s) => s.saveProfile);
  const savingProfile = useAuth((s) => s.savingProfile);
  const serverError = useAuth((s) => s.error);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [firstName, setFirstName] = useState(prefill?.firstName ?? '');
  const [lastName, setLastName] = useState(prefill?.lastName ?? '');
  // Age in whole years, chosen via the wheel; null until picked. Birth date is
  // synthesized from it on save (synthBirthISO).
  const [age, setAge] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Only the name steps have a text field to focus.
    if (step === 2) return;
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [step]);

  const stepValid = useMemo(() => {
    if (step === 0) return firstName.trim().length > 0;
    if (step === 1) return true; // Last name is optional — empty is allowed.
    // The wheel is clamped to [MIN_AGE, MAX_AGE], so any picked age is in range.
    return age !== null && age >= MIN_AGE && age <= MAX_AGE;
  }, [step, firstName, age]);

  function validateAndGetError(): string | null {
    if (step === 2) {
      if (age === null || age < MIN_AGE || age > MAX_AGE) return strings.onboardingErrorAge;
    } else if (!stepValid) {
      return strings.onboardingErrorName;
    }
    return null;
  }

  async function next() {
    const err = validateAndGetError();
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    haptic();

    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
      return;
    }
    await saveProfile(firstName, lastName, synthBirthISO(age as number));
    // On success the router guard swaps to (tabs); on error the store sets `error`.
  }

  function back() {
    if (step === 0) return;
    setLocalError(null);
    haptic();
    setDirection(-1);
    setStep((s) => s - 1);
  }

  const config = STEP_CONFIG[step];
  const value = step === 0 ? firstName : lastName;
  const setValue = step === 0 ? setFirstName : setLastName;
  const shownError = localError ?? serverError;
  const isLast = step === TOTAL_STEPS - 1;
  // Last name is optional: label the advance button "Lewati" (skip) when it's blank.
  const nextLabel = isLast
    ? strings.onboardingFinish
    : step === 1 && lastName.trim().length === 0
      ? strings.onboardingSkip
      : strings.onboardingNext;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            <View style={styles.header}>
              <MasteryMeter value={((step + 1) / TOTAL_STEPS) * 100} color={ACCENT} height={8} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.progressLabel}>
                {strings.onboardingProgress(step + 1, TOTAL_STEPS)}
              </ThemedText>
            </View>

            <Animated.View
              key={step}
              entering={direction === 1 ? enterForward.duration(260) : enterBack.duration(260)}
              style={styles.stepBody}>
              <View style={styles.titleRow}>
                <ThemedText type="subtitle" style={styles.stepTitle}>
                  {config.title}
                </ThemedText>
                {step === 1 ? (
                  <ThemedText
                    type="smallBold"
                    style={[styles.optionalBadge, { color: theme.textSecondary, backgroundColor: theme.backgroundElement }]}>
                    {strings.onboardingOptional}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText themeColor="textSecondary" style={styles.stepSub}>
                {config.sub}
              </ThemedText>

              {step === 2 ? (
                <View style={styles.dateBlock}>
                  <ThemedText
                    type="subtitle"
                    style={[styles.selectedDate, { color: age !== null ? theme.text : theme.textSecondary }]}>
                    {age !== null ? strings.ageYears(age) : strings.agePickerPlaceholder}
                  </ThemedText>
                  <AgePicker
                    value={age}
                    onChange={(a) => {
                      setLocalError(null);
                      setAge(a);
                    }}
                  />
                </View>
              ) : (
                <View style={styles.inputRow}>
                  <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={(t) => {
                      setLocalError(null);
                      setValue(t);
                    }}
                    placeholder={config.placeholder}
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="words"
                    autoComplete={step === 0 ? 'name-given' : 'name-family'}
                    textContentType={step === 0 ? 'givenName' : 'familyName'}
                    maxLength={24}
                    returnKeyType={isLast ? 'done' : 'next'}
                    onSubmitEditing={next}
                    submitBehavior="submit"
                    style={[
                      styles.input,
                      { color: theme.text, backgroundColor: theme.backgroundElement },
                    ]}
                  />
                </View>
              )}

              {shownError ? (
                <Animated.View entering={FadeIn}>
                  <ThemedText type="small" style={styles.error}>
                    {shownError}
                  </ThemedText>
                </Animated.View>
              ) : null}
            </Animated.View>

            <View style={styles.controls}>
              {step > 0 ? (
                <Pressable
                  onPress={back}
                  disabled={savingProfile}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    {strings.onboardingBack}
                  </ThemedText>
                </Pressable>
              ) : (
                <View style={styles.backSpacer} />
              )}

              <Pressable
                onPress={next}
                disabled={!stepValid || savingProfile}
                style={({ pressed }) => [
                  styles.nextButton,
                  { opacity: !stepValid || savingProfile ? 0.5 : pressed ? 0.85 : 1 },
                ]}>
                {savingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText type="smallBold" style={styles.nextLabel}>
                    {nextLabel}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const STEP_CONFIG = [
  {
    title: strings.onboardingFirstNameTitle,
    sub: strings.onboardingFirstNameSub,
    placeholder: strings.onboardingFirstNamePlaceholder,
  },
  {
    title: strings.onboardingLastNameTitle,
    sub: strings.onboardingLastNameSub,
    placeholder: strings.onboardingLastNamePlaceholder,
  },
  {
    title: strings.onboardingAgeTitle,
    sub: strings.onboardingAgeSub,
    // Step 2 (age wheel) has no text input, so no placeholder.
    placeholder: '',
  },
] as const;

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    // Clip step-transition travel so an animating flex child can never bleed past
    // the screen edge (see enterForward/enterBack).
    overflow: 'hidden',
  },
  header: {
    gap: Spacing.one,
  },
  progressLabel: {
    alignSelf: 'flex-end',
  },
  stepBody: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stepTitle: {
    fontSize: 28,
    lineHeight: 36,
  },
  optionalBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    fontSize: 12,
  },
  stepSub: {
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 20,
  },
  dateBlock: {
    gap: Spacing.three,
  },
  selectedDate: {
    textAlign: 'center',
    fontSize: 22,
  },
  error: {
    color: '#EF4444',
    marginTop: Spacing.one,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  backButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  backSpacer: {
    width: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  nextButton: {
    flex: 1,
    maxWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    minHeight: 52,
  },
  nextLabel: {
    color: '#fff',
    fontSize: 16,
  },
});
