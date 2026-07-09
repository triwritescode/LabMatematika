import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AccentColor, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MAX_AGE, MIN_AGE } from '@/lib/age';

// A horizontal, snap-to-center age wheel. Pure JS (no native module — runs in Expo
// Go). The kid scrolls or taps their age; the centered item is the selection. We ask
// age directly rather than a birth date because only age is ever consumed downstream
// (see lib/age + onboarding), and a young learner knows their age, not their DOB.

type Props = {
  // Selected age, or null when nothing chosen yet.
  value: number | null;
  onChange: (age: number) => void;
};

// A plausible learner age to center on before the user has picked.
const DEFAULT_AGE = 8;
const ITEM_WIDTH = 64;

const AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

function ageToIndex(age: number): number {
  return Math.min(AGES.length - 1, Math.max(0, age - MIN_AGE));
}

export function AgePicker({ value, onChange }: Props) {
  const theme = useTheme();
  const listRef = useRef<FlatList<number>>(null);

  // Live centered index (updates during the drag so the highlight tracks the wheel),
  // seeded from the current value or the default.
  const [centerIndex, setCenterIndex] = useState(() => ageToIndex(value ?? DEFAULT_AGE));
  const [sidePad, setSidePad] = useState(0);
  const lastHaptic = useRef(centerIndex);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    // Pad both ends by half the leftover width so the first/last item can rest dead
    // center under the highlight.
    setSidePad(Math.max(0, (e.nativeEvent.layout.width - ITEM_WIDTH) / 2));
  }, []);

  const indexFromOffset = (x: number) => Math.round(x / ITEM_WIDTH);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.min(AGES.length - 1, Math.max(0, indexFromOffset(e.nativeEvent.contentOffset.x)));
    setCenterIndex(idx);
    if (idx !== lastHaptic.current) {
      lastHaptic.current = idx;
      if (Platform.OS !== 'web') Haptics.selectionAsync();
    }
  }, []);

  const commit = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.min(AGES.length - 1, Math.max(0, indexFromOffset(e.nativeEvent.contentOffset.x)));
      onChange(AGES[idx]);
    },
    [onChange],
  );

  const selectIndex = useCallback(
    (idx: number) => {
      listRef.current?.scrollToOffset({ offset: idx * ITEM_WIDTH, animated: true });
      setCenterIndex(idx);
      onChange(AGES[idx]);
      if (Platform.OS !== 'web') Haptics.selectionAsync();
    },
    [onChange],
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]} onLayout={onLayout}>
      {/* Center highlight rail behind the wheel. */}
      <View pointerEvents="none" style={styles.railWrap}>
        <View style={[styles.rail, { borderColor: AccentColor }]} />
      </View>

      <FlatList
        ref={listRef}
        data={AGES}
        keyExtractor={(a) => String(a)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        initialScrollIndex={ageToIndex(value ?? DEFAULT_AGE)}
        getItemLayout={(_, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
        contentContainerStyle={{ paddingHorizontal: sidePad }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={commit}
        renderItem={({ item, index }) => {
          const selected = index === centerIndex;
          return (
            <Pressable
              onPress={() => selectIndex(index)}
              style={styles.item}
              accessibilityRole="button"
              accessibilityLabel={`${item} tahun`}
              accessibilityState={{ selected }}>
              <ThemedText
                style={[
                  styles.itemText,
                  selected
                    ? { color: AccentColor, fontSize: 34, fontWeight: '800' }
                    : { color: theme.textSecondary, fontSize: 20 },
                ]}>
                {item}
              </ThemedText>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const RAIL_WIDTH = ITEM_WIDTH - Spacing.two;

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    overflow: 'hidden',
  },
  railWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: {
    width: RAIL_WIDTH,
    height: 60,
    borderRadius: Spacing.three,
    borderWidth: 2,
  },
  item: {
    width: ITEM_WIDTH,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontVariant: ['tabular-nums'],
  },
});
