import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: number; // 0..100
  color: string;
  height?: number;
};

export function MasteryMeter({ value, color, height = 10 }: Props) {
  const theme = useTheme();
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.backgroundSelected }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View
        style={[styles.fill, { width: `${pct}%`, borderRadius: height / 2, backgroundColor: color }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
