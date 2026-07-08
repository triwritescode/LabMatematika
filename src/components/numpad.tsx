import * as Haptics from 'expo-haptics';
import { Check, Delete } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';

type Props = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  accentColor: string;
};

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

// Large-target numpad for young kids (targets ≥ 56px, specs §14). Memoized so it
// doesn't re-render on every keystroke — pass stable callbacks from the parent.
function NumpadBase({ onDigit, onBackspace, onSubmit, submitDisabled, accentColor }: Props) {
  const theme = useTheme();

  const press = (fn: () => void) => () => {
    Haptics.selectionAsync();
    fn();
  };

  const keyStyle = { backgroundColor: theme.backgroundElement };

  return (
    <View style={styles.grid}>
      {DIGITS.map((d) => (
        <Pressable
          key={d}
          onPress={press(() => onDigit(d))}
          accessibilityRole="button"
          accessibilityLabel={strings.numpadDigit(d)}
          style={({ pressed }) => [styles.key, keyStyle, pressed && styles.pressed]}>
          <ThemedText style={styles.keyText}>{d}</ThemedText>
        </Pressable>
      ))}
      <Pressable
        onPress={press(onBackspace)}
        accessibilityRole="button"
        accessibilityLabel={strings.numpadBackspace}
        style={({ pressed }) => [styles.key, keyStyle, pressed && styles.pressed]}>
        <Delete color={theme.textSecondary} size={28} />
      </Pressable>
      <Pressable
        onPress={press(() => onDigit('0'))}
        accessibilityRole="button"
        accessibilityLabel={strings.numpadDigit('0')}
        style={({ pressed }) => [styles.key, keyStyle, pressed && styles.pressed]}>
        <ThemedText style={styles.keyText}>0</ThemedText>
      </Pressable>
      <Pressable
        onPress={press(onSubmit)}
        disabled={submitDisabled}
        accessibilityRole="button"
        accessibilityLabel={strings.numpadSubmit}
        accessibilityState={{ disabled: !!submitDisabled }}
        style={({ pressed }) => [
          styles.key,
          { backgroundColor: accentColor, opacity: submitDisabled ? 0.4 : 1 },
          pressed && styles.pressed,
        ]}>
        <Check color="#fff" size={32} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

export const Numpad = memo(NumpadBase);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  key: {
    flexBasis: '31%',
    flexGrow: 1,
    height: 64,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.97 }],
  },
});
