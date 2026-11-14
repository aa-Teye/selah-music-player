import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet, StatusBar, Platform, Pressable, AccessibilityInfo } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

/**
 * Selah's opening: the gold logo (exactly where the phone's own start screen
 * shows it) rises in a soft glow while "SELAH" appears letter by letter with a
 * light sweep, then everything fades into Home. About two seconds; a tap skips it.
 * With "Reduce motion" turned on in the phone's settings, nothing moves.
 *
 * The whole opening runs from ONE value animated on the phone's display side, so it
 * stays smooth even while the app is busy loading your songs at start-up.
 */
export const introSettings = { enabled: !global.__SELAH_NO_INTRO }; // the whole-app tests skip it

const BG = '#08090C'; // same as the start screen in app.json
const GOLD = '#E8C468';
const LOGO = 180; // same as imageWidth in app.json, so the hand-over is seamless
const GLOW = 360;
const RISE = -58;
const TOTAL = 2100; // ms
const SETTLED = 0.83; // everything is in place; after this the opening fades out
const LETTERS = ['S', 'E', 'L', 'A', 'H'];
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: undefined });

export function hideNativeSplash() {
  Promise.resolve()
    .then(() => SplashScreen.hideAsync())
    .catch(() => {});
}

/** A smooth start-fast, end-slow move from `from` to `to` between moments a and b (0..1 of the opening) */
const easeOut = (a, b, from = 0, to = 1) => ({
  inputRange: [a, a + (b - a) * 0.25, a + (b - a) * 0.5, b],
  outputRange: [from, from + (to - from) * 0.55, from + (to - from) * 0.85, to],
  extrapolate: 'clamp'
});

export default function IntroSplash({ onDone }) {
  const progress = useRef(new Animated.Value(0)).current; // 0 → 1 over the whole opening
  const skip = useRef(new Animated.Value(1)).current; // a tap fades out early
  const ended = useRef(false);
  const leaving = useRef(false);
  const started = useRef(false);
  const unmounted = useRef(false);

  const end = () => {
    if (ended.current) return;
    ended.current = true;
    if (onDone) onDone();
  };

  const finish = () => {
    if (leaving.current) return;
    leaving.current = true;
    Animated.timing(skip, { toValue: 0, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(end);
  };

  // Starts once the opening is really on screen (an animation started earlier can miss the views)
  const start = () => {
    if (started.current || unmounted.current) return;
    started.current = true;
    // The first frame looks exactly like the phone's start screen: swap them, then animate
    hideNativeSplash();
    Animated.timing(progress, { toValue: 1, duration: TOTAL, easing: Easing.linear, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) end();
      }
    );
    Promise.resolve()
      .then(() => AccessibilityInfo.isReduceMotionEnabled())
      .then((reduce) => {
        if (!reduce || unmounted.current || leaving.current) return;
        // Reduce motion: everything simply in place, then a gentle fade
        progress.stopAnimation();
        progress.setValue(SETTLED);
        Animated.timing(progress, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }).start(end);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const fallback = setTimeout(start, 500); // in case the layout news is late
    const safety = setTimeout(finish, TOTAL + 3000); // never keep anyone waiting
    return () => {
      unmounted.current = true;
      clearTimeout(fallback);
      clearTimeout(safety);
      progress.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rise = progress.interpolate(easeOut(0, 0.26));
  const logoMove = {
    transform: [
      { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, RISE] }) },
      { scale: rise.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) }
    ]
  };
  const glowStyle = {
    opacity: progress.interpolate({ inputRange: [0, 0.2, 0.45, 1], outputRange: [0, 1, 0.55, 0.55], extrapolate: 'clamp' }),
    transform: [
      { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, RISE] }) },
      { scale: progress.interpolate({ inputRange: [0, 0.2, 0.45], outputRange: [0.6, 1.12, 1], extrapolate: 'clamp' }) }
    ]
  };
  const letterStyle = (i) => {
    const start = 0.1 + i * 0.035;
    const length = 0.18;
    // each letter pops up with a tiny overshoot
    const v = progress.interpolate({
      inputRange: [start, start + length * 0.6, start + length],
      outputRange: [0, 1.06, 1],
      extrapolate: 'clamp'
    });
    return {
      opacity: v.interpolate({ inputRange: [0, 0.6, 1.06], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
      transform: [
        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
        { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }
      ]
    };
  };
  const subtitleStyle = { opacity: progress.interpolate({ inputRange: [0.42, 0.55], outputRange: [0, 1], extrapolate: 'clamp' }) };
  const shineStyle = {
    opacity: progress.interpolate({ inputRange: [0.44, 0.47, 0.72, 0.75], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }),
    transform: [
      { translateX: progress.interpolate({ inputRange: [0.45, 0.75], outputRange: [-90, 250], extrapolate: 'clamp' }) },
      { skewX: '-20deg' }
    ]
  };
  const fadeOut = Animated.multiply(
    progress.interpolate({ inputRange: [SETTLED, 1], outputRange: [1, 0], extrapolate: 'clamp' }),
    skip
  );

  return (
    <Animated.View style={[styles.root, { opacity: fadeOut }]} testID="intro-splash" onLayout={start}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityRole="button" accessibilityLabel="Selah. Tap to skip">
        <Animated.Image
          source={require('../../assets/intro-glow.png')}
          style={[styles.glow, glowStyle]}
          pointerEvents="none"
        />
        <Animated.Image
          source={require('../../assets/logo-emblem.png')}
          style={[styles.logo, logoMove]}
          resizeMode="contain"
          testID="intro-logo"
        />
        <View style={styles.wordSpot} pointerEvents="none">
          <View style={styles.word}>
            {LETTERS.map((ch, i) => (
              <Animated.Text key={ch + i} style={[styles.letter, letterStyle(i)]}>
                {ch}
              </Animated.Text>
            ))}
            <Animated.View style={[styles.shine, shineStyle]} />
          </View>
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>MUSIC PLAYER</Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: BG, zIndex: 1000, elevation: 1000 },
  glow: { position: 'absolute', width: GLOW, height: GLOW, top: '50%', left: '50%', marginTop: -GLOW / 2, marginLeft: -GLOW / 2 },
  logo: { position: 'absolute', width: LOGO, height: LOGO, top: '50%', left: '50%', marginTop: -LOGO / 2, marginLeft: -LOGO / 2 },
  wordSpot: { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: 34, alignItems: 'center' },
  word: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4 },
  letter: {
    color: GOLD,
    fontSize: 46,
    fontWeight: '700',
    fontFamily: SERIF,
    letterSpacing: 6,
    marginHorizontal: 2,
    textShadowColor: 'rgba(232, 196, 104, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16
  },
  shine: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    left: 0,
    width: 34,
    backgroundColor: 'rgba(255, 248, 225, 0.28)'
  },
  subtitle: { color: '#BFAE86', fontSize: 12, fontWeight: '700', letterSpacing: 6, marginTop: 6 }
});
