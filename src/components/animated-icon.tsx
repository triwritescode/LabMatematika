import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { DimensionValue, Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { LabColors } from '@/constants/labs';
import { AccentColor } from '@/constants/theme';
import { OPERATION_SYMBOL, Operation } from '@/curriculum/types';
import { strings } from '@/i18n/strings.id';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

// Playful splash: brand-red backdrop, a scatter of lab-colored math badges that
// pop in like the Beranda cards, the logo bouncing to center, then app name +
// tagline. Whole overlay holds, then fades out over the ready app.

// Decorative math badges — mirrors the rotated, lab-colored symbol badges on the
// home screen. Positioned around the centered logo.
const FLOATING: {
  op: Operation;
  top: DimensionValue;
  left: DimensionValue;
  rotate: string;
  delay: number;
}[] = [
  { op: 'add', top: '18%', left: '14%', rotate: '-10deg', delay: 80 },
  { op: 'sub', top: '24%', left: '74%', rotate: '9deg', delay: 200 },
  { op: 'mul', top: '68%', left: '16%', rotate: '8deg', delay: 320 },
  { op: 'div', top: '72%', left: '72%', rotate: '-8deg', delay: 440 },
];

// Overlay opacity: hold, then fade out near the end (unmount on finish).
const overlayKeyframe = new Keyframe({
  0: { opacity: 1 },
  70: { opacity: 1 },
  88: { opacity: 0, easing: Easing.in(Easing.quad) },
  100: { opacity: 0 },
});

// Logo pops from small, overshoots with an elastic wobble, settles upright.
const logoKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.3 }, { rotate: '-14deg' }] },
  55: { opacity: 1, transform: [{ scale: 1.1 }, { rotate: '4deg' }], easing: Easing.elastic(1) },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }], easing: Easing.elastic(1) },
});

// A badge pops in with an elastic bounce (staggered per badge via .delay()).
const badgeKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0 }] },
  70: { opacity: 1, transform: [{ scale: 1.15 }], easing: Easing.elastic(1.1) },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.elastic(1.1) },
});

// Name + tagline rise and fade in under the logo.
const textKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 18 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
});

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const decorations = FLOATING.map(({ op, top, left, rotate, delay }) => (
    <Animated.View
      key={op}
      entering={animate ? badgeKeyframe.duration(520).delay(delay) : undefined}
      style={[styles.badgePos, { top, left }]}>
      <View style={[styles.badge, { backgroundColor: LabColors[op].main, transform: [{ rotate }] }]}>
        <Text style={styles.badgeText}>{OPERATION_SYMBOL[op]}</Text>
      </View>
    </Animated.View>
  ));

  const content = (
    <>
      {decorations}
      <View style={styles.center}>
        <Animated.View entering={animate ? logoKeyframe.duration(700) : undefined}>
          <Image
            style={styles.image}
            source={require('@/assets/icons/icon.png')}
          />
        </Animated.View>
        <Animated.View
          entering={animate ? textKeyframe.duration(500).delay(360) : undefined}
          style={styles.textBlock}>
          <Text style={styles.appName}>{strings.appName}</Text>
          <Text style={styles.tagline}>{strings.tagline}</Text>
        </Animated.View>
      </View>
    </>
  );

  return animate ? (
    <Animated.View
      entering={overlayKeyframe.duration(1900).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {content}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {content}
    </View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoIconKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/icons/icon.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoIconKeyframe.duration(DURATION)}>
        <Image
          style={styles.image}
          source={require('@/assets/icons/icon.png')}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 96,
    height: 90,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: AccentColor,
    experimental_backgroundImage: `linear-gradient(180deg, #C81418, ${AccentColor} 55%, #7C0103)`,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  center: {
    alignItems: 'center',
    gap: 20,
  },
  textBlock: {
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  badgePos: {
    position: 'absolute',
  },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
});
