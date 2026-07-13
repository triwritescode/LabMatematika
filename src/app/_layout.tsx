import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { DarkTheme, DefaultTheme, ErrorBoundaryProps, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ErrorFallback } from '@/components/error-fallback';
import { hydrateBankCache, refreshBankFromRemote } from '@/curriculum/bank';
import { useAuth } from '@/state/auth';

// expo-router renders this instead of a white screen when any child route
// throws during render. Kid-safe fallback with a retry (see error-fallback).
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <ErrorFallback retry={retry} />;
}

SplashScreen.preventAutoHideAsync();

// Native Google sign-in needs the Web client ID (see SETUP.md). Configured once.
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

// Redirect the user to the right route group based on auth status. This is the
// classic expo-router auth-guard pattern (segments + replace).
function useProtectedRoute() {
  const status = useAuth((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    const root = segments[0];
    const inAuth = root === '(auth)';
    const inOnboarding = root === '(onboarding)';

    if (status === 'signedOut' && !inAuth) {
      router.replace('/(auth)/login');
    } else if (status === 'needsOnboarding' && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (status === 'ready' && (inAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [status, segments, router]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const status = useAuth((s) => s.status);
  const init = useAuth((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  // Question bank: layer the persisted remote cache over the bundled questions,
  // then (best-effort, offline-safe) pull any updates. Bank is global content,
  // so this runs regardless of auth; foreground re-pulls are handled in sync.ts.
  useEffect(() => {
    void hydrateBankCache().then(() => refreshBankFromRemote());
  }, []);

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  useProtectedRoute();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lab/[operation]" />
        <Stack.Screen name="practice/[operation]/[skill]" />
        <Stack.Screen name="exam/[operation]/[level]" />
        <Stack.Screen name="friends/index" />
        <Stack.Screen name="friends/add" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
