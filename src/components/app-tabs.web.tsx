import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { FlaskConical, House, ShoppingBag, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';

export default function AppTabs() {
  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon={House}>{strings.beranda}</TabButton>
          </TabTrigger>
          <TabTrigger name="laboratorium" href="/laboratorium" asChild>
            <TabButton icon={FlaskConical}>{strings.lab}</TabButton>
          </TabTrigger>
          <TabTrigger name="toko" href="/toko" asChild>
            <TabButton icon={ShoppingBag}>{strings.toko}</TabButton>
          </TabTrigger>
          <TabTrigger name="pengguna" href="/pengguna" asChild>
            <TabButton icon={User}>{strings.pengguna}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: typeof House;
};

export function TabButton({ children, isFocused, icon: Icon, ...props }: TabButtonProps) {
  const theme = useTheme();
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!isFocused) return;
    scale.setValue(0.8);
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [isFocused, scale]);

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View style={[styles.iconPill, isFocused && { backgroundColor: `${AccentColor}1F` }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon
            color={isFocused ? AccentColor : theme.textSecondary}
            fill={isFocused ? AccentColor : 'none'}
            size={22}
          />
        </Animated.View>
      </View>
      <ThemedText
        type="small"
        style={[styles.tabLabel, isFocused && { color: AccentColor, fontWeight: 'bold' }]}
        themeColor={isFocused ? undefined : 'textSecondary'}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  return (
    <View style={[styles.barWrap, { backgroundColor: theme.background }]}>
      <View
        {...props}
        style={[styles.bar, { borderTopColor: theme.backgroundSelected }, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
    height: '100%',
  },
  slot: {
    flex: 1,
  },
  barWrap: {
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MaxContentWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  iconPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
