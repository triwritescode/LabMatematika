import { Flame } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { StreakColor } from '@/constants/labs';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { computeStreak, shiftISO, useProgress } from '@/state/progress';

// Duolingo-style streak strip for Beranda: the current week (Mon–Sun) with a
// flame on every practiced day, headlined by the current streak. Read-only; the
// day-history it renders is written by touchStreak() when a session completes.

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StreakCalendar() {
  const theme = useTheme();
  const activeDates = useProgress((s) => s.activeDates);
  const activeSet = useMemo(() => new Set(activeDates), [activeDates]);
  const streak = useMemo(() => computeStreak(activeDates), [activeDates]);

  const today = todayISO();

  // Monday-first week containing today. JS getUTCDay: 0=Sun..6=Sat → shift Mon=0.
  const week = useMemo(() => {
    const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
    const monday = shiftISO(today, -dow);
    return Array.from({ length: 7 }, (_, i) => shiftISO(monday, i));
  }, [today]);

  const subtitle =
    streak === 0
      ? strings.streakNone
      : activeSet.has(today)
        ? strings.streakTodayDone
        : strings.streakKeep;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <View style={[styles.flameBadge, { backgroundColor: `${StreakColor}22` }]}>
          <Flame color={StreakColor} fill={StreakColor} size={24} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="smallBold" style={{ color: StreakColor, fontSize: 18 }}>
            {strings.streakDays(streak)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        </View>
      </View>

      <View style={styles.week}>
        {week.map((iso, i) => {
          const active = activeSet.has(iso);
          const isToday = iso === today;
          const future = iso > today;
          const dayNum = Number(iso.slice(8, 10));
          return (
            <View key={iso} style={styles.cell}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.weekLabel}>
                {strings.weekdaysShort[i]}
              </ThemedText>
              <View
                style={[
                  styles.dayDot,
                  active && { backgroundColor: StreakColor },
                  isToday && !active && { borderWidth: 2, borderColor: StreakColor },
                ]}>
                {active ? (
                  <Flame color="#fff" fill="#fff" size={18} />
                ) : (
                  <ThemedText
                    type="small"
                    themeColor={future ? 'textSecondary' : undefined}
                    style={[future && { opacity: 0.6 }]}>
                    {dayNum}
                  </ThemedText>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flameBadge: {
    width: 44,
    height: 44,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  weekLabel: {
    fontSize: 12,
  },
  dayDot: {
    width: 36,
    height: 36,
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
