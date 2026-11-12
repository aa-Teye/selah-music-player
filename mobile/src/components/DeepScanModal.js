import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Linking, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

const ANDROID_STEPS = {
  1: "Checking the phone's music list",
  2: 'Searching every folder',
  3: 'Reading song details'
};
const IPHONE_STEPS = { 1: "Checking Selah's folder", 2: "Checking Selah's folder", 3: 'Reading song details' };

const count = (x) => Number(x || 0).toLocaleString();
const clock = (secs) => {
  const s = Math.max(0, Math.round(secs || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
};

/** The detailed-scan screen: live progress while it scans, then a summary. */
export default function DeepScanModal({ scan, onStop, onClose }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const spin = useRef(new Animated.Value(0)).current;
  const running = scan?.state === 'running';

  useEffect(() => {
    if (!running) return undefined;
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [running, spin]);

  if (!scan || !scan.visible) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const step = scan.step || 1;
  const stepText =
    Platform.OS === 'android' ? `Step ${step} of 3 · ${ANDROID_STEPS[step]}` : IPHONE_STEPS[step];

  const stat = (label, value) => (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  let body;
  if (running) {
    body = (
      <>
        <Animated.View style={[styles.iconWrap, { transform: [{ rotate }] }]}>
          <MaterialCommunityIcons name="radar" size={46} color={c.ink} />
        </Animated.View>
        <Text style={styles.title}>Scanning for music</Text>
        <Text style={styles.step}>{stepText}</Text>
        {step === 2 && scan.folder ? (
          <Text style={styles.folder} numberOfLines={1}>
            {scan.folder}
          </Text>
        ) : null}
        {step === 3 && scan.total > 0 ? (
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.min(100, (scan.done / scan.total) * 100)}%` }]} />
          </View>
        ) : null}
        <View style={styles.statsRow}>
          {stat('Songs found', count(scan.found))}
          {Platform.OS === 'android' && stat('Folders', count(scan.folders))}
          {Platform.OS === 'android' && stat('Files checked', count(scan.files))}
        </View>
        <Text style={styles.note}>
          Time {clock(scan.seconds)} · a detailed scan can take a few minutes
        </Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onStop} testID="deep-scan-stop" activeOpacity={0.8}>
          <Text style={styles.secondaryText}>Stop scan</Text>
        </TouchableOpacity>
      </>
    );
  } else if (scan.state === 'denied') {
    body = (
      <>
        <Ionicons name="lock-closed" size={44} color={c.warnText} />
        <Text style={styles.title}>Music access is off</Text>
        <Text style={styles.summary}>
          Selah can't see your songs. Allow "Music and audio" for Selah in Settings, then scan again.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => Linking.openSettings().catch(() => {})}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.secondaryText}>Close</Text>
        </TouchableOpacity>
      </>
    );
  } else if (scan.state === 'error') {
    body = (
      <>
        <Ionicons name="alert-circle" size={44} color={c.warnText} />
        <Text style={styles.title}>The scan had a problem</Text>
        <Text style={styles.summary}>{scan.message || 'Please try again, or use Import to pick songs.'}</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.secondaryText}>Close</Text>
        </TouchableOpacity>
      </>
    );
  } else {
    const parts = [`${count(scan.total)} song${scan.total === 1 ? '' : 's'} in your library`];
    if (scan.added) parts.push(`${count(scan.added)} new`);
    if (scan.removed) parts.push(`${count(scan.removed)} removed (no longer on the phone)`);
    body = (
      <>
        <Ionicons
          name={scan.cancelled ? 'pause-circle' : 'checkmark-circle'}
          size={50}
          color={scan.cancelled ? '#F59E0B' : '#10B981'}
        />
        <Text style={styles.title}>{scan.cancelled ? 'Scan stopped' : 'Scan complete'}</Text>
        <Text style={styles.summary}>{parts.join(' · ')}</Text>
        {Platform.OS === 'android' && (
          <Text style={styles.note}>
            Searched {count(scan.folders)} folders and {count(scan.files)} files in {clock(scan.seconds)}
          </Text>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={onClose} testID="deep-scan-done" activeOpacity={0.85}>
          <Text style={styles.primaryText}>Done</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={running ? onStop : onClose}>
      <View style={styles.overlay}>
        <View style={styles.box} testID="deep-scan">
          {body}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(8, 9, 12, 0.6)',
      justifyContent: 'center',
      padding: 24
    },
    box: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 28,
      paddingHorizontal: 22,
      alignItems: 'center',
      gap: 10
    },
    iconWrap: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4
    },
    title: { color: c.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
    step: { color: c.textMuted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
    folder: {
      color: c.ink,
      fontSize: 13,
      fontWeight: '700',
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      maxWidth: '100%'
    },
    bar: { alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: c.surfaceStrong, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: c.inverse },
    statsRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around', marginTop: 6 },
    stat: { alignItems: 'center', minWidth: 80 },
    statValue: { color: c.text, fontSize: 20, fontWeight: '900' },
    statLabel: { color: c.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
    note: { color: c.textSubtle, fontSize: 12, textAlign: 'center' },
    summary: { color: c.textSecondary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 21 },
    primaryBtn: {
      alignSelf: 'stretch',
      alignItems: 'center',
      backgroundColor: c.inverse,
      borderRadius: 16,
      paddingVertical: 14,
      marginTop: 8
    },
    primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    secondaryBtn: {
      alignSelf: 'stretch',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      borderRadius: 16,
      paddingVertical: 13,
      marginTop: 4
    },
    secondaryText: { color: c.ink, fontWeight: '800', fontSize: 14 }
  });
