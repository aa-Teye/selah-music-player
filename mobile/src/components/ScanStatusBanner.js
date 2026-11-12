import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Shows what the music scan is doing: live count + latest song found (with a moving
 * progress effect), "music access is off", errors, or the final result.
 */
export default function ScanStatusBanner({ status, showDone = false }) {
  const sweep = useRef(new Animated.Value(0)).current;
  const scanning = status?.state === 'scanning';

  useEffect(() => {
    if (!scanning) return undefined;
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1300,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      })
    );
    loop.start();
    return () => loop.stop();
  }, [scanning, sweep]);

  if (!status || status.state === 'idle') return null;

  if (scanning) {
    const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-140, 360] });
    const count = status.count || 0;
    return (
      <View style={styles.banner} testID="scan-banner">
        <View style={styles.row}>
          <Ionicons name="musical-notes" size={16} color="#12141A" />
          <Text style={styles.title}>
            Finding your music… {count} song{count === 1 ? '' : 's'}
          </Text>
        </View>
        {status.latest ? (
          <Text style={styles.sub} numberOfLines={1}>
            Added: {status.latest}
          </Text>
        ) : null}
        <View style={styles.track}>
          <Animated.View style={[styles.sweep, { transform: [{ translateX }] }]} />
        </View>
      </View>
    );
  }

  if (status.state === 'denied') {
    return (
      <TouchableOpacity
        style={[styles.banner, styles.warn]}
        onPress={() => Linking.openSettings().catch(() => {})}
        activeOpacity={0.85}
        testID="scan-banner"
      >
        <View style={styles.row}>
          <Ionicons name="lock-closed-outline" size={16} color="#B45309" />
          <Text style={[styles.title, styles.warnText]}>Music access is off</Text>
        </View>
        <Text style={[styles.sub, styles.warnText]}>
          Selah can't see your songs. Tap here, then allow "Music and audio".
        </Text>
      </TouchableOpacity>
    );
  }

  if (status.state === 'error') {
    return (
      <View style={[styles.banner, styles.warn]} testID="scan-banner">
        <View style={styles.row}>
          <Ionicons name="alert-circle-outline" size={16} color="#B45309" />
          <Text style={[styles.title, styles.warnText]}>The scan had a problem</Text>
        </View>
        <Text style={[styles.sub, styles.warnText]} numberOfLines={2}>
          {status.message || 'Please try Rescan, or use Import to pick songs.'}
        </Text>
      </View>
    );
  }

  if (status.state === 'done' && showDone) {
    const count = status.count || 0;
    return (
      <View style={styles.banner} testID="scan-banner">
        <View style={styles.row}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
          <Text style={styles.title}>
            {count} song{count === 1 ? '' : 's'} found {Platform.OS === 'android' ? 'on this phone' : "in Selah's folder"}
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    overflow: 'hidden'
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#12141A', fontSize: 14, fontWeight: '800', flexShrink: 1 },
  sub: { color: '#717886', fontSize: 12, marginTop: 4 },
  track: { height: 4, borderRadius: 2, backgroundColor: '#EEF0F4', marginTop: 10, overflow: 'hidden' },
  sweep: { width: 120, height: 4, borderRadius: 2, backgroundColor: '#12141A' },
  warn: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  warnText: { color: '#92400E' }
});
