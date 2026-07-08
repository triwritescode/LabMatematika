import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentColor, Colors } from '@/constants/theme';
import { strings } from '@/i18n/strings.id';

// Filled icon on select (not just a tint swap) makes the active tab pop.
function tabIcon(outline: keyof typeof Ionicons.glyphMap, filled: keyof typeof Ionicons.glyphMap) {
  const Icon = ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? filled : outline} size={size} color={color} />
  );
  Icon.displayName = `TabIcon(${filled})`;
  return Icon;
}

// Compact bar height (native default ~80 felt too tall). Real content sits in
// BAR_HEIGHT; the safe-area bottom inset is added on top so the bar clears the
// gesture pill without inflating the touch row.
const BAR_HEIGHT = 58;

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AccentColor,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIconStyle: { marginTop: 2 },
        tabBarStyle: {
          height: BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          backgroundColor: colors.background,
          // Top separation: hairline border + soft shadow lifting the bar off content.
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? '#2A2B2E' : '#E6E6EA',
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: strings.beranda, tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="kejuaraan"
        options={{ title: strings.kejuaraan, tabBarIcon: tabIcon('trophy-outline', 'trophy') }}
      />
      <Tabs.Screen
        name="laboratorium"
        options={{ title: strings.laboratorium, tabBarIcon: tabIcon('flask-outline', 'flask') }}
      />
      <Tabs.Screen
        name="toko"
        options={{ title: strings.toko, tabBarIcon: tabIcon('cart-outline', 'cart') }}
      />
      <Tabs.Screen
        name="pengguna"
        options={{ title: strings.pengguna, tabBarIcon: tabIcon('person-outline', 'person') }}
      />
    </Tabs>
  );
}
