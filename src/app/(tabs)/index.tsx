import { useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasteryMeter } from '@/components/mastery-meter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabColors, StreakColor } from '@/constants/labs';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { levelsForLab } from '@/curriculum';
import { labMasteryPercent } from '@/curriculum/mastery';
import { Operation, OPERATION_SYMBOL } from '@/curriculum/types';
import { useTheme } from '@/hooks/use-theme';
import { LAB_NAMES, strings } from '@/i18n/strings.id';
import { LABS, useProgress } from '@/state/progress';

export default function Beranda() {
  const childName = useProgress((s) => s.childName);
  const streak = useProgress((s) => s.streak.count);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="subtitle" style={styles.greeting}>
                {strings.greeting(childName)}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{strings.greetingSub}</ThemedText>
            </View>
            {streak > 0 && (
              <View style={styles.streakChip}>
                <Flame color={StreakColor} fill={StreakColor} size={20} />
                <ThemedText type="smallBold" style={{ color: StreakColor }}>
                  {strings.streak(streak)}
                </ThemedText>
              </View>
            )}
          </View>

          {!childName && <NameCard />}

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            {strings.labList.toUpperCase()}
          </ThemedText>

          <View style={styles.grid}>
            {LABS.map((lab) => (
              <LabCard key={lab} lab={lab} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function NameCard() {
  const setChildName = useProgress((s) => s.setChildName);
  const [name, setName] = useState('');
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.nameCard}>
      <ThemedText type="smallBold">{strings.namePrompt}</ThemedText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={strings.namePlaceholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.nameInput, { color: theme.text, backgroundColor: theme.background }]}
        maxLength={20}
      />
      <Pressable
        onPress={() => name.trim() && setChildName(name)}
        style={({ pressed }) => [
          styles.nameButton,
          { backgroundColor: LabColors.add.main, opacity: pressed || !name.trim() ? 0.6 : 1 },
        ]}>
        <ThemedText type="smallBold" style={{ color: '#fff' }}>
          {strings.nameSave}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function LabCard({ lab }: { lab: Operation }) {
  const router = useRouter();
  const progress = useProgress((s) => s.labs[lab]);
  const colors = LabColors[lab];
  const percent = labMasteryPercent(progress, levelsForLab(lab));

  return (
    <Pressable
      onPress={() => router.push(`/lab/${lab}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.soft },
        pressed && styles.cardPressed,
      ]}>
      <View style={[styles.symbolBadge, { backgroundColor: colors.main }]}>
        <ThemedText style={styles.symbolText}>{OPERATION_SYMBOL[lab]}</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.cardTitle}>
        {LAB_NAMES[lab]}
      </ThemedText>
      <ThemedText type="small" style={styles.cardRank}>
        {progress.rank}
      </ThemedText>
      <View style={styles.cardMeter}>
        <MasteryMeter value={percent} color={colors.main} height={8} />
        <ThemedText type="small" style={styles.cardPercent}>
          {percent}%
        </ThemedText>
      </View>
    </Pressable>
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
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerText: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  greeting: {
    fontSize: 26,
    lineHeight: 32,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#F9731622',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  nameCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  nameInput: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  nameButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.two,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    flexBasis: '46%',
    flexGrow: 1,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  symbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  symbolText: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: 800,
  },
  cardTitle: {
    color: '#1F2937',
    fontSize: 16,
  },
  cardRank: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
  },
  cardMeter: {
    marginTop: Spacing.one,
    gap: Spacing.half,
  },
  cardPercent: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 14,
    alignSelf: 'flex-end',
  },
});
