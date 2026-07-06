import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { FlaskConical, House, Store, Trophy, User } from 'lucide-react-native';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

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
          <TabTrigger name="kejuaraan" href="/kejuaraan" asChild>
            <TabButton icon={Trophy}>{strings.kejuaraan}</TabButton>
          </TabTrigger>
          <TabTrigger name="laboratorium" href="/laboratorium" asChild>
            <TabButton icon={FlaskConical}>{strings.laboratorium}</TabButton>
          </TabTrigger>
          <TabTrigger name="toko" href="/toko" asChild>
            <TabButton icon={Store}>{strings.toko}</TabButton>
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
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Icon color={isFocused ? AccentColor : theme.textSecondary} size={24} />
      <ThemedText
        type="small"
        style={[styles.tabLabel, isFocused && { color: AccentColor }]}
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
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
