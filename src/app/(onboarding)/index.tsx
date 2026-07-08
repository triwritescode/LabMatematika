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

import { DatePicker } from '@/components/date-picker';
import { MasteryMeter } from '@/components/mastery-meter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { ageFromISO, MAX_AGE, MIN_AGE } from '@/lib/age';
import { useAuth } from '@/state/auth';

// "5 Juni 2015" from an ISO date.
function formatBirth(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return strings.formatDate(d, strings.months[m - 1], y);
}

// Brand accent (matches login, header, active tab) so onboarding feels part of
// the same app rather than a one-off blue screen.
const ACCENT = AccentColor;

// Short slide + fade per step. The old SlideInRight/Left swept the whole card in
// from a full screen-width offscreen, which read as a jarring jump — especially
// with the step remount + keyboard resize. A small ±36px travel is smooth.
const enterRight = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: 36 }] },
  100: { opacity: 1, transform: [{ translateX: 0 }], easing: Easing.out(Easing.cubic) },
});
const enterLeft = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: -36 }] },
  100: { opacity: 1, transform: [{ translateX: 0 }], easing: Easing.out(Easing.cubic) },
});
// Birth date is mandatory — age is derived from it and will drive starting level
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
  // Birth date as ISO YYYY-MM-DD, chosen via the calendar; null until picked.
  const [birthISO, setBirthISO] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Only the name steps have a text field to focus.
    if (step === 2) return;
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [step]);

  const derivedAge = birthISO ? ageFromISO(birthISO) : NaN;

  const stepValid = useMemo(() => {
    if (step === 0) return firstName.trim().length > 0;
    if (step === 1) return lastName.trim().length > 0;
    return birthISO !== null && derivedAge >= MIN_AGE && derivedAge <= MAX_AGE;
  }, [step, firstName, lastName, birthISO, derivedAge]);

  function validateAndGetError(): string | null {
    if (step === 2) {
      if (birthISO === null) return strings.onboardingErrorDate;
      if (derivedAge < MIN_AGE || derivedAge > MAX_AGE) return strings.onboardingErrorAge;
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
    await saveProfile(firstName, lastName, birthISO as string);
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
              entering={direction === 1 ? enterRight.duration(280) : enterLeft.duration(280)}
              style={styles.stepBody}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                {config.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.stepSub}>
                {config.sub}
              </ThemedText>

              {step === 2 ? (
                <View style={styles.dateBlock}>
                  <ThemedText
                    type="subtitle"
                    style={[styles.selectedDate, { color: birthISO ? theme.text : theme.textSecondary }]}>
                    {birthISO ? formatBirth(birthISO) : strings.datePickerPlaceholder}
                  </ThemedText>
                  {birthISO ? (
                    <ThemedText type="smallBold" style={[styles.ageBadge, { color: ACCENT }]}>
                      {strings.ageYears(derivedAge)}
                    </ThemedText>
                  ) : null}
                  <DatePicker
                    value={birthISO}
                    onChange={(iso) => {
                      setLocalError(null);
                      setBirthISO(iso);
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
                    maxLength={24}
                    returnKeyType={isLast ? 'done' : 'next'}
                    onSubmitEditing={next}
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
                    {isLast ? strings.onboardingFinish : strings.onboardingNext}
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
    placeholder: strings.onboardingAgePlaceholder,
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
  stepTitle: {
    fontSize: 28,
    lineHeight: 36,
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
  ageBadge: {
    textAlign: 'center',
    marginTop: -Spacing.two,
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
