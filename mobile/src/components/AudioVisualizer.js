import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

const REST = 0.12;

/**
 * Decorative equalizer bars that dance while music plays and settle when it stops.
 * (They are an animation, not a live reading of the audio.)
 */
export default function AudioVisualizer({ playing, bars = 28, height = 34, color }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const barColor = color || c.ink;
  const values = useRef(Array.from({ length: bars }, () => new Animated.Value(REST))).current;

  useEffect(() => {
    if (!playing) {
      values.forEach((v) => {
        Animated.timing(v, { toValue: REST, duration: 300, useNativeDriver: true }).start();
      });
      return undefined;
    }

    const loops = values.map((v, i) => {
      const up = () => 0.35 + Math.random() * 0.65;
      const down = () => REST + Math.random() * 0.3;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: up(),
            duration: 260 + (i % 5) * 80,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(v, {
            toValue: down(),
            duration: 240 + (i % 4) * 100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach((l) => l.stop());
  }, [playing, values]);

  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[styles.bar, { height, backgroundColor: barColor, transform: [{ scaleY: v }] }]}
        />
      ))}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  bar: { width: 4, borderRadius: 2, opacity: 0.85 }
});
