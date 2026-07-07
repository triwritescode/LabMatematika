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
import Animated, { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors } from '@/constants/labs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { useAuth } from '@/state/auth';

const ACCENT = LabColors.add.main;
const MIN_AGE = 1;
const MAX_AGE = 120;
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
  const [age, setAge] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [step]);

  const ageNum = parseInt(age, 10);

  const stepValid = useMemo(() => {
    if (step === 0) return firstName.trim().length > 0;
    if (step === 1) return lastName.trim().length > 0;
    return Number.isFinite(ageNum) && ageNum >= MIN_AGE && ageNum <= MAX_AGE;
  }, [step, firstName, lastName, ageNum]);

  function validateAndGetError(): string | null {
    if (step === 2) {
      if (!Number.isFinite(ageNum) || ageNum < MIN_AGE || ageNum > MAX_AGE) {
        return strings.onboardingErrorAge;
      }
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
    await saveProfile(firstName, lastName, ageNum);
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
  const value = step === 0 ? firstName : step === 1 ? lastName : age;
  const setValue = step === 0 ? setFirstName : step === 1 ? setLastName : setAge;
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
              entering={direction === 1 ? SlideInRight.duration(320) : SlideInLeft.duration(320)}
              style={styles.stepBody}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                {config.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.stepSub}>
                {config.sub}
              </ThemedText>

              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  value={value}
                  onChangeText={(t) => {
                    setLocalError(null);
                    setValue(step === 2 ? t.replace(/[^0-9]/g, '') : t);
                  }}
                  placeholder={config.placeholder}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType={step === 2 ? 'number-pad' : 'default'}
                  autoCapitalize={step === 2 ? 'none' : 'words'}
                  maxLength={step === 2 ? 3 : 24}
                  returnKeyType={isLast ? 'done' : 'next'}
                  onSubmitEditing={next}
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
                {step === 2 ? (
                  <ThemedText themeColor="textSecondary" style={styles.ageUnit}>
                    {strings.onboardingAgeUnit}
                  </ThemedText>
                ) : null}
              </View>

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
  ageUnit: {
    fontSize: 18,
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
