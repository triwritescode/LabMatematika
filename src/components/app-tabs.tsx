import { Ionicons } from '@expo/vector-icons';
import { VectorIcon } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { AccentColor, Colors } from '@/constants/theme';
import { strings } from '@/i18n/strings.id';

function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return (
    <NativeTabs.Trigger.Icon
      src={<VectorIcon family={Ionicons} name={name} />}
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
      labelStyle={{ selected: { color: AccentColor } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{strings.beranda}</NativeTabs.Trigger.Label>
        {tabIcon('home-outline')}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="kejuaraan">
        <NativeTabs.Trigger.Label>{strings.kejuaraan}</NativeTabs.Trigger.Label>
        {tabIcon('trophy-outline')}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="laboratorium">
        <NativeTabs.Trigger.Label>{strings.laboratorium}</NativeTabs.Trigger.Label>
        {tabIcon('flask-outline')}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="toko">
        <NativeTabs.Trigger.Label>{strings.toko}</NativeTabs.Trigger.Label>
        {tabIcon('cart-outline')}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="pengguna">
        <NativeTabs.Trigger.Label>{strings.pengguna}</NativeTabs.Trigger.Label>
        {tabIcon('person-outline')}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
