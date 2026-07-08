import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { Check, Gem } from 'lucide-react-native';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DiamondColor } from '@/constants/labs';
import {
  RARITY_ORDER,
  RARITY_PRICE,
  Rarity,
  Sticker,
  STICKERS,
  stickersByRarity,
} from '@/constants/stickers';
import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { useProgress } from '@/state/progress';

type Theme = ReturnType<typeof useTheme>;

const RARITY_LABEL: Record<Rarity, string> = {
  common: strings.tokoRarityCommon,
  rare: strings.tokoRarityRare,
  epic: strings.tokoRarityEpic,
  legendary: strings.tokoRarityLegendary,
  mythic: strings.tokoRarityMythic,
};

export default function Toko() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const diamonds = useProgress((s) => s.diamonds);
  const ownedStickers = useProgress((s) => s.ownedStickers);
  const buySticker = useProgress((s) => s.buySticker);

  // Derive once per change — not per render. Rebuilding a 100-entry Set and the
  // grouped catalog on every render would re-run for each of the 100 cards.
  const owned = useMemo(() => new Set(ownedStickers), [ownedStickers]);
  const groups = useMemo(() => stickersByRarity(), []);

  // Stable identity so memoized StickerCards don't all re-render when one is
  // bought (buySticker is itself a stable zustand action).
  const onBuy = useCallback(
    (id: string) => {
      const ok = buySticker(id);
      Haptics.notificationAsync(
        ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
      );
    },
    [buySticker]
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={[styles.hero, { paddingTop: insets.top + Spacing.four }]}>
            <ThemedText type="smallBold" style={styles.heroKicker}>
              {strings.toko.toUpperCase()}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroTitle}>
              {strings.tokoTitle}
            </ThemedText>
            <ThemedText style={styles.heroSub}>{strings.tokoSub}</ThemedText>
            <View style={styles.balanceChip}>
              <Gem color="#fff" fill="#fff" size={20} />
              <ThemedText type="smallBold" style={styles.balanceText}>
                {diamonds.toLocaleString('id-ID')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.body}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.ownedProgress}>
              {strings.tokoOwnedProgress(owned.size, STICKERS.length)}
            </ThemedText>

            {RARITY_ORDER.map((rarity) => (
              <View key={rarity} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                    {RARITY_LABEL[rarity].toUpperCase()}
                  </ThemedText>
                  <View style={[styles.priceBadge, { backgroundColor: `${DiamondColor}18` }]}>
                    <Gem color={DiamondColor} fill={DiamondColor} size={12} />
                    <ThemedText type="small" style={styles.priceBadgeText}>
                      {RARITY_PRICE[rarity]}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.grid}>
                  {groups[rarity].map((sticker) => (
                    <StickerCard
                      key={sticker.id}
                      sticker={sticker}
                      owned={owned.has(sticker.id)}
                      affordable={diamonds >= RARITY_PRICE[sticker.rarity]}
                      onBuy={onBuy}
                      theme={theme}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const StickerCard = memo(function StickerCard({
  sticker,
  owned,
  affordable,
  onBuy,
  theme,
}: {
  sticker: Sticker;
  owned: boolean;
  affordable: boolean;
  onBuy: (id: string) => void;
  theme: Theme;
}) {
  const price = RARITY_PRICE[sticker.rarity];
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.stickerTile, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText style={[styles.stickerEmoji, !owned && !affordable && styles.dim]}>
          {sticker.id}
        </ThemedText>
      </View>
      {owned ? (
        <View
          style={[styles.buyBtn, styles.ownedBtn]}
          accessibilityRole="text"
          accessibilityLabel={strings.dimiliki}>
          <Check color={theme.textSecondary} size={14} strokeWidth={3} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.buyLabel}>
            {strings.dimiliki}
          </ThemedText>
        </View>
      ) : (
        <Pressable
          onPress={() => onBuy(sticker.id)}
          disabled={!affordable}
          accessibilityRole="button"
          accessibilityLabel={`${sticker.id} — ${price}`}
          accessibilityState={{ disabled: !affordable }}
          style={({ pressed }) => [
            styles.buyBtn,
            { backgroundColor: affordable ? AccentColor : theme.backgroundSelected },
            pressed && affordable && styles.pressed,
          ]}>
          <Gem color={affordable ? '#fff' : theme.textSecondary} fill={affordable ? '#fff' : theme.textSecondary} size={13} />
          <ThemedText
            type="small"
            style={[styles.buyLabel, { color: affordable ? '#fff' : theme.textSecondary }]}>
            {price}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
});

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
  content: {
    paddingBottom: Spacing.five,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: AccentColor,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    borderBottomLeftRadius: Spacing.five,
    borderBottomRightRadius: Spacing.five,
    gap: Spacing.one,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2,
    marginBottom: Spacing.two,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 30,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  balanceText: {
    color: '#fff',
    fontSize: 16,
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  ownedProgress: {
    textAlign: 'center',
    marginTop: -Spacing.two,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    letterSpacing: 1,
    fontSize: 12,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 999,
  },
  priceBadgeText: {
    color: DiamondColor,
    fontWeight: '700',
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    width: '31%',
    flexGrow: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
  },
  stickerTile: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerEmoji: {
    fontSize: 34,
    lineHeight: 40,
  },
  dim: {
    opacity: 0.4,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    alignSelf: 'stretch',
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  ownedBtn: {
    backgroundColor: 'transparent',
  },
  buyLabel: {
    fontWeight: '700',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
