import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

// Android phones have their own equalizer (sound effects panel) that Selah can open.
export async function openPhoneEqualizer() {
  try {
    await Linking.sendIntent('android.media.action.DISPLAY_AUDIO_EFFECT_CONTROL_PANEL');
    return true;
  } catch {
    Alert.alert(
      'No equalizer found',
      "Selah couldn't find a built-in equalizer on this phone. Look for \"Sound effects\" or \"Equalizer\" in your phone's Settings."
    );
    return false;
  }
}

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
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

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
            <Ionicons name="arrow-back" size={24} color={c.text} />
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
          <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={c.ink} />
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
          <MaterialCommunityIcons name="weather-night" size={20} color={c.ink} />
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
          <Ionicons name="swap-horizontal" size={20} color={c.ink} />
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
          <Ionicons name="speedometer-outline" size={20} color={c.ink} />
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

      {/* Equalizer: Selah plays music as recorded; the phone's own equalizer shapes the sound */}
      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="options-outline" size={20} color={c.ink} />
          <Text style={styles.cardTitle}>Equalizer</Text>
        </View>
        <Text style={styles.cardSub}>
          {Platform.OS === 'android'
            ? "Selah plays your music exactly as it was recorded. To boost the bass or the voices, use your phone's own equalizer."
            : "Selah plays your music exactly as it was recorded. iPhone doesn't let music apps change the sound, but many headphones have their own app with an equalizer."}
        </Text>
        {Platform.OS === 'android' && (
          <TouchableOpacity
            style={styles.eqButton}
            onPress={openPhoneEqualizer}
            activeOpacity={0.85}
            testID="open-phone-equalizer"
          >
            <Ionicons name="open-outline" size={16} color="#FFFFFF" />
            <Text style={styles.eqButtonText}>Open phone equalizer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Plain facts about privacy and YouTube */}
      <View style={styles.complianceCard}>
        <View style={styles.complianceHeader}>
          <Ionicons name="shield-checkmark" size={18} color="#10B981" />
          <Text style={styles.complianceTitle}>Good to know</Text>
        </View>

        <View style={styles.pointRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.pointText}>
            YouTube videos play in YouTube's own player. Selah never downloads them.
          </Text>
        </View>

        <View style={styles.pointRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.pointText}>
            Your songs stay on your phone. Selah never uploads them.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg
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
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  title: {
    color: c.text,
    fontSize: 20,
    fontWeight: '800'
  },
  subtitle: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 20
  },
  settingCard: {
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: c.border,
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
    color: c.text,
    flex: 1
  },
  cardSub: {
    fontSize: 12,
    color: c.textMuted,
    marginBottom: 14
  },
  timerBadge: {
    backgroundColor: c.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border
  },
  timerBadgeText: {
    color: c.ink,
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
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border
  },
  miniPillActive: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  miniPillText: {
    color: c.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  miniPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  eqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.inverse,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 4
  },
  eqButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  },
  complianceCard: {
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: c.border,
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
    color: c.text,
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
    color: c.textMuted,
    fontSize: 12,
    lineHeight: 17,
    flex: 1
  },
  actionCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.inverse,
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
