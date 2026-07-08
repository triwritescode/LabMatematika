import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AccentColor, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { MAX_AGE, MIN_AGE, toISODate } from '@/lib/age';

// A self-contained calendar for picking a birth date. Pure JS (no native module,
// so it runs in Expo Go and needs no prebuild). Selectable range is derived from
// the age bounds: born no later than MIN_AGE years ago, no earlier than MAX_AGE.

type Props = {
  // Selected date as ISO YYYY-MM-DD, or null when nothing chosen yet.
  value: string | null;
  onChange: (iso: string) => void;
};

// Midnight Date for a Y/M(0-based)/D triple — keeps comparisons date-only.
function atMidnight(year: number, month: number, day: number): Date {
  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function DatePicker({ value, onChange }: Props) {
  const theme = useTheme();

  const { minDate, maxDate } = useMemo(() => {
    const now = new Date();
    return {
      // Oldest allowed: MAX_AGE years ago. Youngest allowed: MIN_AGE years ago.
      minDate: atMidnight(now.getFullYear() - MAX_AGE, now.getMonth(), now.getDate()),
      maxDate: atMidnight(now.getFullYear() - MIN_AGE, now.getMonth(), now.getDate()),
    };
  }, []);

  // Which month the grid is showing. Start on the selected date, else on the
  // latest allowed month (a plausible spot for a young learner's birth year).
  const initial = useMemo(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    return { year: maxDate.getFullYear(), month: maxDate.getMonth() };
  }, [value, maxDate]);

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Monday-first index of the 1st (JS getDay: 0=Sun..6=Sat).
  const leadingBlanks = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const atMinMonth = viewYear === minDate.getFullYear() && viewMonth <= minDate.getMonth();
  const atMaxMonth = viewYear === maxDate.getFullYear() && viewMonth >= maxDate.getMonth();

  function step(deltaMonths: number) {
    let y = viewYear;
    let m = viewMonth + deltaMonths;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    setViewYear(y);
    setViewMonth(m);
  }

  function stepYear(delta: number) {
    const y = viewYear + delta;
    if (y < minDate.getFullYear() || y > maxDate.getFullYear()) return;
    setViewYear(y);
  }

  const canYearDown = viewYear > minDate.getFullYear();
  const canYearUp = viewYear < maxDate.getFullYear();

  const cells: (number | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      {/* Header: year ‹‹, month ‹, label, month ›, year ›› */}
      <View style={styles.header}>
        <Nav dir="left" onPress={() => stepYear(-1)} disabled={!canYearDown} big theme={theme} />
        <Nav dir="left" onPress={() => step(-1)} disabled={atMinMonth} theme={theme} />
        <ThemedText type="smallBold" style={styles.headerLabel}>
          {strings.months[viewMonth]} {viewYear}
        </ThemedText>
        <Nav dir="right" onPress={() => step(1)} disabled={atMaxMonth} theme={theme} />
        <Nav dir="right" onPress={() => stepYear(1)} disabled={!canYearUp} big theme={theme} />
      </View>

      {/* Weekday header */}
      <View style={styles.weekRow}>
        {strings.weekdaysShort.map((w) => (
          <ThemedText key={w} type="small" themeColor="textSecondary" style={styles.weekLabel}>
            {w}
          </ThemedText>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) return <View key={`b${idx}`} style={styles.cell} />;
          const cellDate = atMidnight(viewYear, viewMonth, day);
          const disabled = cellDate < minDate || cellDate > maxDate;
          const iso = toISODate(viewYear, viewMonth + 1, day);
          const selected = value !== null && iso === value;
          return (
            <View key={day} style={styles.cell}>
              <Pressable
                disabled={disabled}
                onPress={() => iso && onChange(iso)}
                style={({ pressed }) => [
                  styles.dayButton,
                  selected && { backgroundColor: AccentColor },
                  pressed && !selected && { backgroundColor: AccentColor + '22' },
                ]}>
                <ThemedText
                  type="small"
                  style={[
                    styles.dayText,
                    { color: selected ? '#fff' : disabled ? theme.textSecondary : theme.text },
                    disabled && styles.dayDisabled,
                  ]}>
                  {day}
                </ThemedText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Nav({
  dir,
  onPress,
  disabled,
  big,
  theme,
}: {
  dir: 'left' | 'right';
  onPress: () => void;
  disabled?: boolean;
  big?: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  const Icon = dir === 'left' ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [styles.nav, { opacity: disabled ? 0.25 : pressed ? 0.5 : 1 }]}>
      <Icon color={theme.text} size={big ? 22 : 20} strokeWidth={big ? 2.5 : 2} />
      {big ? (
        <Icon color={theme.text} size={22} strokeWidth={2.5} style={styles.navSecond} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  navSecond: {
    marginLeft: -14,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekLabel: {
    flexBasis: '14.2857%',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    flexBasis: '14.2857%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 15,
  },
  dayDisabled: {
    opacity: 0.35,
  },
});
