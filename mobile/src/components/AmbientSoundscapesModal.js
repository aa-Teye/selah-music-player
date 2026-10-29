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
      color: '#E5A93C'
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
              <MaterialCommunityIcons name="weather-night" size={24} color="#E5A93C" />
              <View>
                <Text style={styles.title}>Bedtime Ambient Soundscapes</Text>
                <Text style={styles.subtitle}>Peaceful background layers for prayer & sleep</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
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
                  <View style={[styles.soundIconWrap, { backgroundColor: `${s.color}20` }]}>
                    <MaterialCommunityIcons name={s.icon} size={26} color={s.color} />
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
                <Ionicons name="volume-medium" size={16} color="#E5A93C" />
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
            <MaterialCommunityIcons name="moon-waning-crescent" size={16} color="#9CA3AF" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end'
  },
  modalBox: {
    backgroundColor: '#111622',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
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
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '800'
  },
  subtitle: {
    color: '#9CA3AF',
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
    backgroundColor: '#171D2C',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12
  },
  activeSoundCard: {
    borderColor: '#E5A93C',
    backgroundColor: 'rgba(229, 169, 60, 0.1)'
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
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700'
  },
  activeSoundName: {
    color: '#E5A93C'
  },
  soundDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeRadioCircle: {
    borderColor: '#E5A93C'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5A93C'
  },
  volumeCard: {
    backgroundColor: '#171D2C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  volumeTitle: {
    color: '#F3F4F6',
    fontSize: 12,
    fontWeight: '700',
    flex: 1
  },
  volumePercent: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '800'
  },
  volumeRow: {
    flexDirection: 'row',
    gap: 8
  },
  volPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0A0D14',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  activeVolPill: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C'
  },
  volPillText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700'
  },
  activeVolPillText: {
    color: '#0A0D14',
    fontWeight: '800'
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 11,
    flex: 1
  }
});
