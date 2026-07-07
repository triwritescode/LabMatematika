import { Ionicons } from '@expo/vector-icons';
import { VectorIcon } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { AccentColor, Colors } from '@/constants/theme';
import { strings } from '@/i18n/strings.id';

// Filled icon on select (not just a tint swap) makes the active tab pop.
function tabIcon(outline: keyof typeof Ionicons.glyphMap, filled: keyof typeof Ionicons.glyphMap) {
  return (
    <NativeTabs.Trigger.Icon
      src={{
        default: <VectorIcon family={Ionicons} name={outline} />,
        selected: <VectorIcon family={Ionicons} name={filled} />,
      }}
      selectedColor={AccentColor}
    />
  );
}

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      iconColor={colors.textSecondary}
      labelStyle={{ selected: { color: AccentColor, fontWeight: 'bold' } }}
      indicatorColor={`${AccentColor}26`}
      rippleColor={`${AccentColor}33`}
      blurEffect="systemChromeMaterial">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{strings.beranda}</NativeTabs.Trigger.Label>
        {tabIcon('home-outline', 'home')}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="kejuaraan">
        <NativeTabs.Trigger.Label>{strings.kejuaraan}</NativeTabs.Trigger.Label>
        {tabIcon('trophy-outline', 'trophy')}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="laboratorium">
        <NativeTabs.Trigger.Label>{strings.laboratorium}</NativeTabs.Trigger.Label>
        {tabIcon('flask-outline', 'flask')}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="toko">
        <NativeTabs.Trigger.Label>{strings.toko}</NativeTabs.Trigger.Label>
        {tabIcon('cart-outline', 'cart')}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="pengguna">
        <NativeTabs.Trigger.Label>{strings.pengguna}</NativeTabs.Trigger.Label>
        {tabIcon('person-outline', 'person')}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
