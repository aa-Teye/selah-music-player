import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function AmbientSoundscapesModal({
  visible,
  onClose,
  activeSoundscape, // null | 'rain' | 'cathedral' | 'river' | 'wind'
  onSelectSoundscape,
  ambientVolume = 0.5,
  onSetVolume,
  sleepTimerRemaining
}) {
  const soundscapes = [
    {
      id: 'rain',
      name: 'Gentle Rainfall',
      desc: 'Soft rain against the sanctuary windows',
      icon: 'weather-rainy',
      color: '#60A5FA'
    },
    {
      id: 'cathedral',
      name: 'Holy Cathedral Pad',
      desc: 'Warm, meditative synthesizer drone',
      icon: 'church',
      color: '#34D399'
    },
    {
      id: 'river',
      name: 'River of Life',
      desc: 'Flowing, crystalline stream of peace',
      icon: 'water',
      color: '#34D399'
    },
    {
      id: 'wind',
      name: 'Peaceful Night Wind',
      desc: 'Calm evening breeze under the stars',
      icon: 'weather-windy',
      color: '#A78BFA'
    }
  ];

  const volumes = [0.25, 0.5, 0.75, 1.0];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="weather-night" size={24} color="#12141A" />
              <View>
                <Text style={styles.title}>Bedtime Ambient Soundscapes</Text>
                <Text style={styles.subtitle}>Peaceful background layers for prayer & sleep</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#717886" />
            </TouchableOpacity>
          </View>

          {/* Soundscapes Grid */}
          <View style={styles.soundscapesGrid}>
            {soundscapes.map((s) => {
              const isActive = activeSoundscape === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.soundCard, isActive && styles.activeSoundCard]}
                  onPress={() => onSelectSoundscape && onSelectSoundscape(isActive ? null : s.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.soundIconWrap, { backgroundColor: '#EEF0F4' }]}>
                    <MaterialCommunityIcons name={s.icon} size={24} color="#12141A" />
                  </View>
                  <View style={styles.soundInfo}>
                    <Text style={[styles.soundName, isActive && styles.activeSoundName]}>
                      {s.name}
                    </Text>
                    <Text style={styles.soundDesc} numberOfLines={2}>
                      {s.desc}
                    </Text>
                  </View>
                  <View style={[styles.radioCircle, isActive && styles.activeRadioCircle]}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Volume Adjuster if active */}
          {activeSoundscape && (
            <View style={styles.volumeCard}>
              <View style={styles.volumeHeader}>
                <Ionicons name="volume-medium" size={16} color="#12141A" />
                <Text style={styles.volumeTitle}>Ambient Blend Level</Text>
                <Text style={styles.volumePercent}>{Math.round(ambientVolume * 100)}%</Text>
              </View>
              <View style={styles.volumeRow}>
                {volumes.map((vol) => {
                  const isSelected = Math.abs(ambientVolume - vol) < 0.05;
                  return (
                    <TouchableOpacity
                      key={vol}
                      style={[styles.volPill, isSelected && styles.activeVolPill]}
                      onPress={() => onSetVolume && onSetVolume(vol)}
                    >
                      <Text style={[styles.volPillText, isSelected && styles.activeVolPillText]}>
                        {Math.round(vol * 100)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Sleep Timer Notice */}
          <View style={styles.footerNote}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={16} color="#717886" />
            <Text style={styles.footerText}>
              {sleepTimerRemaining
                ? `Ambient sound fades with sleep timer (${Math.round(sleepTimerRemaining / 60)}m remaining).`
                : "Active soundscapes will fade automatically when bedtime sleep timer is set."}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.45)',
    justifyContent: 'flex-end'
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#E5E7EB'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  title: {
    color: '#0F1115',
    fontSize: 18,
    fontWeight: '800'
  },
  subtitle: {
    color: '#717886',
    fontSize: 12
  },
  closeBtn: {
    padding: 6
  },
  soundscapesGrid: {
    gap: 10,
    marginBottom: 16
  },
  soundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12
  },
  activeSoundCard: {
    borderColor: '#12141A',
    backgroundColor: '#EEF0F4'
  },
  soundIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  soundInfo: {
    flex: 1
  },
  soundName: {
    color: '#0F1115',
    fontSize: 14,
    fontWeight: '700'
  },
  activeSoundName: {
    color: '#0F1115'
  },
  soundDesc: {
    color: '#717886',
    fontSize: 11,
    marginTop: 2
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeRadioCircle: {
    borderColor: '#12141A'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#12141A'
  },
  volumeCard: {
    backgroundColor: '#EEF0F4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  volumeTitle: {
    color: '#0F1115',
    fontSize: 12,
    fontWeight: '700',
    flex: 1
  },
  volumePercent: {
    color: '#12141A',
    fontSize: 12,
    fontWeight: '800'
  },
  volumeRow: {
    flexDirection: 'row',
    gap: 8
  },
  volPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  activeVolPill: {
    backgroundColor: '#12141A',
    borderColor: '#12141A'
  },
  volPillText: {
    color: '#717886',
    fontSize: 12,
    fontWeight: '700'
  },
  activeVolPillText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6
  },
  footerText: {
    color: '#717886',
    fontSize: 11,
    flex: 1
  }
});
