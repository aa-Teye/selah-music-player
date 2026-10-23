import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function EqualizerScreen({
  sleepTimerRemaining,
  onSetSleepTimer,
  playbackSpeed = 1.0,
  onSetSpeed
}) {
  const [activePreset, setActivePreset] = useState('worship');

  const presets = [
    { id: 'worship', name: 'Worship' },
    { id: 'bass', name: 'Bass Boost' },
    { id: 'acoustic', name: 'Acoustic' },
    { id: 'vocal', name: 'Vocal' },
    { id: 'flat', name: 'Flat' }
  ];

  const bands = [
    { freq: '60 Hz', label: 'Sub-Bass', gain: '+4 dB', level: 0.7 },
    { freq: '230 Hz', label: 'Warmth', gain: '+2 dB', level: 0.55 },
    { freq: '910 Hz', label: 'Presence', gain: '0 dB', level: 0.5 },
    { freq: '3.6 kHz', label: 'Vocals', gain: '+3 dB', level: 0.65 },
    { freq: '14 kHz', label: 'Air', gain: '+5 dB', level: 0.8 }
  ];

  const sleepPresets = [
    { label: 'Off', minutes: null },
    { label: '15m', minutes: 15 },
    { label: '30m', minutes: 30 },
    { label: '45m', minutes: 45 },
    { label: '60m', minutes: 60 }
  ];

  const speedPresets = [0.75, 1.0, 1.25, 1.5, 2.0];

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sound &amp; Settings</Text>
      <Text style={styles.subtitle}>Equalizer, Bedtime Timer, and Audio Tuning</Text>

      {/* Bedtime Sleep Timer Card */}
      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={20} color="#E5A93C" />
          <Text style={styles.cardTitle}>Bedtime Sleep Timer</Text>
          {sleepTimerRemaining ? (
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>{formatTime(sleepTimerRemaining)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardSub}>Music fades out automatically when you fall asleep</Text>

        <View style={styles.pillsRow}>
          {sleepPresets.map((sp) => {
            const isSelected = sp.minutes === null 
              ? !sleepTimerRemaining 
              : sleepTimerRemaining && Math.round(sleepTimerRemaining / 60) === sp.minutes;
            return (
              <TouchableOpacity
                key={sp.label}
                style={[styles.miniPill, isSelected && styles.miniPillActive]}
                onPress={() => onSetSleepTimer && onSetSleepTimer(sp.minutes)}
              >
                <Text style={[styles.miniPillText, isSelected && styles.miniPillTextActive]}>
                  {sp.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Audio Playback Speed Card */}
      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer-outline" size={20} color="#E5A93C" />
          <Text style={styles.cardTitle}>Playback Speed</Text>
        </View>
        <Text style={styles.cardSub}>Great for audiobooks, sermons, and acoustic study</Text>

        <View style={styles.pillsRow}>
          {speedPresets.map((speed) => {
            const isSelected = playbackSpeed === speed;
            return (
              <TouchableOpacity
                key={speed}
                style={[styles.miniPill, isSelected && styles.miniPillActive]}
                onPress={() => onSetSpeed && onSetSpeed(speed)}
              >
                <Text style={[styles.miniPillText, isSelected && styles.miniPillTextActive]}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5-Band Equalizer */}
      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="options-outline" size={20} color="#E5A93C" />
          <Text style={styles.cardTitle}>5-Band Graphic Equalizer</Text>
        </View>
        <Text style={styles.cardSub}>Tailored audio profiles for worship and headphones</Text>

        {/* Presets Row */}
        <View style={styles.presetsRow}>
          {presets.map((p) => {
            const isActive = activePreset === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.presetBtn, isActive && styles.activePresetBtn]}
                onPress={() => setActivePreset(p.id)}
              >
                <Text style={[styles.presetText, isActive && styles.activePresetText]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5-Band Graphic Sliders Visual */}
        <View style={styles.bandsGrid}>
          {bands.map((b, idx) => (
            <View key={idx} style={styles.bandCol}>
              <Text style={styles.gainText}>{b.gain}</Text>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { height: `${b.level * 100}%` }]} />
                <View style={[styles.sliderThumb, { bottom: `${b.level * 100}%` }]} />
              </View>
              <Text style={styles.freqText}>{b.freq}</Text>
              <Text style={styles.labelText}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Google Play & Store Compliance */}
      <View style={styles.complianceCard}>
        <View style={styles.complianceHeader}>
          <Ionicons name="shield-checkmark" size={18} color="#10B981" />
          <Text style={styles.complianceTitle}>Google Play &amp; YouTube Compliant</Text>
        </View>

        <View style={styles.pointRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.pointText}>
            Official YouTube Player API: Plays via official embed with all creator rights protected.
          </Text>
        </View>

        <View style={styles.pointRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.pointText}>
            No Audio Ripping: Never downloads or separates copyrighted streams.
          </Text>
        </View>

        <View style={styles.pointRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.pointText}>
            Private Device Storage: Your phone MP3s stay on your device with complete privacy.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D14'
  },
  content: {
    padding: 16,
    paddingBottom: 120
  },
  title: {
    color: '#F3F4F6',
    fontSize: 22,
    fontWeight: '800'
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 20
  },
  settingCard: {
    backgroundColor: '#121824',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2937'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    flex: 1
  },
  cardSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 14
  },
  timerBadge: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5A93C'
  },
  timerBadgeText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '800'
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  miniPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1A2333',
    borderWidth: 1,
    borderColor: '#263346'
  },
  miniPillActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C'
  },
  miniPillText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700'
  },
  miniPillTextActive: {
    color: '#0A0D14',
    fontWeight: '800'
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  presetBtn: {
    backgroundColor: '#1A2333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263346'
  },
  activePresetBtn: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C'
  },
  presetText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700'
  },
  activePresetText: {
    color: '#0A0D14',
    fontWeight: '800'
  },
  bandsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8
  },
  bandCol: {
    alignItems: 'center',
    gap: 6
  },
  gainText: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '700'
  },
  sliderTrack: {
    width: 6,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'flex-end'
  },
  sliderFill: {
    width: '100%',
    backgroundColor: '#E5A93C',
    borderRadius: 3
  },
  sliderThumb: {
    position: 'absolute',
    left: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF'
  },
  freqText: {
    color: '#F3F4F6',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4
  },
  labelText: {
    color: '#6B7280',
    fontSize: 9
  },
  complianceCard: {
    backgroundColor: '#121824',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: '#1F2937'
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  complianceTitle: {
    color: '#A7F3D0',
    fontWeight: '800',
    fontSize: 13
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10
  },
  pointText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 17,
    flex: 1
  }
});
