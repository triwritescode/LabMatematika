import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleSigninButton } from '@/components/google-signin-button';
import { ThemedText } from '@/components/themed-text';
import { LabColors } from '@/constants/labs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { strings } from '@/i18n/strings.id';
import { OPERATION_SYMBOL } from '@/curriculum/types';
import { useAuth } from '@/state/auth';

export default function Login() {
  const error = useAuth((s) => s.error);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
            <View style={styles.symbolRow}>
              {(['add', 'sub', 'mul', 'div'] as const).map((lab, i) => (
                <Animated.View
                  key={lab}
                  entering={FadeInDown.delay(150 + i * 90).duration(500)}
                  style={[styles.symbolBadge, { backgroundColor: LabColors[lab].main }]}>
                  <ThemedText style={styles.symbolText}>{OPERATION_SYMBOL[lab]}</ThemedText>
                </Animated.View>
              ))}
            </View>
            <ThemedText type="subtitle" style={styles.title}>
              {strings.authWelcomeTitle}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.sub}>
              {strings.authWelcomeSub}
            </ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(450).duration(600)} style={styles.actions}>
            <GoogleSigninButton />
            {error ? (
              <Animated.View entering={FadeIn}>
                <ThemedText type="small" style={styles.error}>
                  {error}
                </ThemedText>
              </Animated.View>
            ) : null}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#208AEF',
  },
  safeArea: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  symbolRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  symbolBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: 800,
  },
  title: {
    color: '#ffffff',
  },
  sub: {
    color: '#E6F1FF',
    fontSize: 16,
  },
  actions: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  error: {
    color: '#FFE1E1',
    textAlign: 'center',
  },
});
