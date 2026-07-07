import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleSigninButton } from '@/components/google-signin-button';
import { ThemedText } from '@/components/themed-text';
import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { strings } from '@/i18n/strings.id';
import { useAuth } from '@/state/auth';

const appVersion = Constants.expoConfig?.version ?? '1.0.5';

export default function Login() {
  const error = useAuth((s) => s.error);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.main}>
            <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
              <Image
                source={require('@/assets/images/lab-matematika-logo-login.png')}
                style={styles.logo}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
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

          <View style={styles.footer}>
            <ThemedText type="smallBold" style={styles.footerText}>
              {strings.authVersion(appVersion)}
            </ThemedText>
            <ThemedText type="small" style={styles.footerText}>
              {strings.authMadeWithLove}
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AccentColor,
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
    alignItems: 'center',
  },
  main: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.six,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    aspectRatio: 344 / 244,
  },
  actions: {
    width: '100%',
    gap: Spacing.three,
  },
  error: {
    color: '#FFE1E1',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.half,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  footerText: {
    color: '#FFFFFF',
    opacity: 0.85,
  },
});
