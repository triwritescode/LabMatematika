import { AlertTriangle } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { strings } from '@/i18n/strings.id';

// Friendly, kid-safe fallback for the expo-router ErrorBoundary. A JS render
// crash must never leave a 3-year-old on a white screen — show a calm retry
// instead. Progress lives in AsyncStorage, so retry loses nothing.
export function ErrorFallback({ retry }: { retry: () => Promise<void> }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.iconWrap}>
          <AlertTriangle color={AccentColor} size={40} />
        </View>
        <ThemedText type="subtitle" style={styles.title}>
          {strings.errorTitle}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sub}>
          {strings.errorSub}
        </ThemedText>
        <Pressable
          onPress={() => retry()}
          accessibilityRole="button"
          accessibilityLabel={strings.errorRetry}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: AccentColor },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>
            {strings.errorRetry}
          </ThemedText>
        </Pressable>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${AccentColor}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.two,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
