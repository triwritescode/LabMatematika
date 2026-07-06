import * as Haptics from 'expo-haptics';
import { Check, Delete } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  accentColor: string;
};

// Large-target numpad for young kids (targets ≥ 56px, specs §14).
export function Numpad({ onDigit, onBackspace, onSubmit, submitDisabled, accentColor }: Props) {
  const theme = useTheme();

  const press = (fn: () => void) => () => {
    Haptics.selectionAsync();
    fn();
  };

  const keyStyle = { backgroundColor: theme.backgroundElement };

  return (
    <View style={styles.grid}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <Pressable
          key={d}
          onPress={press(() => onDigit(d))}
          style={({ pressed }) => [styles.key, keyStyle, pressed && styles.pressed]}>
          <ThemedText style={styles.keyText}>{d}</ThemedText>
        </Pressable>
      ))}
      <Pressable
        onPress={press(onBackspace)}
        style={({ pressed }) => [styles.key, keyStyle, pressed && styles.pressed]}>
        <Delete color={theme.textSecondary} size={28} />
      </Pressable>
      <Pressable
        onPress={press(() => onDigit('0'))}
        style={({ pressed }) => [styles.key, keyStyle, pressed && styles.pressed]}>
        <ThemedText style={styles.keyText}>0</ThemedText>
      </Pressable>
      <Pressable
        onPress={press(onSubmit)}
        disabled={submitDisabled}
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
