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
  onClose,
  sleepTimerRemaining,
  onSetSleepTimer,
  playbackSpeed = 1.0,
  onSetSpeed,
  crossfadeSeconds = 0,
  onSetCrossfade,
  activeSoundscape,
  onOpenAmbientSoundscapes
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
  const crossfadePresets = [
    { label: 'Off', seconds: 0 },
    { label: '3s', seconds: 3 },
    { label: '6s', seconds: 6 },
    { label: '9s', seconds: 9 },
    { label: '12s', seconds: 12 }
  ];

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0F1115" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Sound &amp; Settings</Text>
          <Text style={styles.subtitle}>Equalizer, Bedtime Timer, Crossfade, and Soundscapes</Text>
        </View>
      </View>

      {/* Bedtime Sleep Timer Card */}
      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={20} color="#12141A" />
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

      {/* Bedtime Ambient Soundscapes Card */}
      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="weather-night" size={20} color="#12141A" />
          <Text style={styles.cardTitle}>Bedtime Ambient Soundscapes</Text>
          {activeSoundscape && (
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSub}>
          {activeSoundscape
            ? `Playing soothing ${activeSoundscape.toUpperCase()} soundscape in the background`
            : "Layer soft rain, cathedral pad, or river sounds behind worship"}
        </Text>

        <TouchableOpacity 
          style={styles.actionCardBtn} 
          onPress={onOpenAmbientSoundscapes}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="music-note-plus" size={16} color="#FFFFFF" />
          <Text style={styles.actionCardBtnText}>
            {activeSoundscape ? "Change / Tune Soundscape" : "Choose Ambient Soundscape"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Audio Crossfade Card */}
      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="swap-horizontal" size={20} color="#12141A" />
          <Text style={styles.cardTitle}>Seamless Audio Crossfade</Text>
          {crossfadeSeconds > 0 && (
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>{crossfadeSeconds}s Blend</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSub}>Eliminates abrupt silence between consecutive songs</Text>

        <View style={styles.pillsRow}>
          {crossfadePresets.map((cf) => {
            const isSelected = crossfadeSeconds === cf.seconds;
            return (
              <TouchableOpacity
                key={cf.label}
                style={[styles.miniPill, isSelected && styles.miniPillActive]}
                onPress={() => onSetCrossfade && onSetCrossfade(cf.seconds)}
              >
                <Text style={[styles.miniPillText, isSelected && styles.miniPillTextActive]}>
                  {cf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Audio Playback Speed Card */}
      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer-outline" size={20} color="#12141A" />
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
          <Ionicons name="options-outline" size={20} color="#12141A" />
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
    backgroundColor: '#F8F9FA'
  },
  content: {
    padding: 16,
    paddingBottom: 130
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF0F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  title: {
    color: '#0F1115',
    fontSize: 20,
    fontWeight: '800'
  },
  subtitle: {
    color: '#717886',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 20
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
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
    color: '#0F1115',
    flex: 1
  },
  cardSub: {
    fontSize: 12,
    color: '#717886',
    marginBottom: 14
  },
  timerBadge: {
    backgroundColor: '#EEF0F4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  timerBadgeText: {
    color: '#12141A',
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
    backgroundColor: '#EEF0F4',
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  miniPillActive: {
    backgroundColor: '#12141A',
    borderColor: '#12141A'
  },
  miniPillText: {
    color: '#717886',
    fontSize: 13,
    fontWeight: '700'
  },
  miniPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  presetBtn: {
    backgroundColor: '#EEF0F4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  activePresetBtn: {
    backgroundColor: '#12141A',
    borderColor: '#12141A'
  },
  presetText: {
    color: '#717886',
    fontSize: 12,
    fontWeight: '700'
  },
  activePresetText: {
    color: '#FFFFFF',
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
    color: '#12141A',
    fontSize: 11,
    fontWeight: '700'
  },
  sliderTrack: {
    width: 6,
    height: 100,
    backgroundColor: '#EEF0F4',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'flex-end'
  },
  sliderFill: {
    width: '100%',
    backgroundColor: '#12141A',
    borderRadius: 3
  },
  sliderThumb: {
    position: 'absolute',
    left: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#12141A'
  },
  freqText: {
    color: '#0F1115',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4
  },
  labelText: {
    color: '#717886',
    fontSize: 9
  },
  complianceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  complianceTitle: {
    color: '#0F1115',
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
    color: '#717886',
    fontSize: 12,
    lineHeight: 17,
    flex: 1
  },
  actionCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#12141A',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6
  },
  actionCardBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  }
});
