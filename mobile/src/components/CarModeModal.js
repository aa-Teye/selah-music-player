import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

export default function CarModeModal({
  visible,
  onClose,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  isFavorite,
  onToggleFavorite
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  if (!currentTrack) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.modeBadge}>
            <MaterialCommunityIcons name="car" size={20} color="#FFFFFF" />
            <Text style={styles.modeText}>CAR & STAGE MODE</Text>
          </View>
          <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Giant Track Display */}
        <View style={styles.trackCard}>
          <Text style={styles.title} numberOfLines={2}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
          <Text style={styles.album} numberOfLines={1}>
            {currentTrack.album || 'Selah Worship'}
          </Text>
        </View>

        {/* Center Giant Action Row */}
        <View style={styles.controlsRow}>
          {/* Previous Track */}
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={onPrev}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-back" size={40} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Giant Play / Pause Button */}
          <TouchableOpacity 
            style={styles.giantPlayBtn} 
            onPress={onTogglePlay}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={58} 
              color={c.ink} 
            />
          </TouchableOpacity>

          {/* Next Track */}
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={onNext}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={40} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Utility Controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.favBtn} 
            onPress={() => onToggleFavorite && onToggleFavorite(currentTrack.id)}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={32} 
              color={isFavorite ? "#EF4444" : c.textSubtle} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.exitPill} onPress={onClose}>
            <Ionicons name="arrow-back" size={18} color={c.ink} />
            <Text style={styles.exitPillText}>Exit Car Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.inverse,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 36,
    justifyContent: 'space-between'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.inverse,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  modeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1
  },
  exitBtn: {
    padding: 8,
    backgroundColor: c.inverse,
    borderRadius: 24
  },
  trackCard: {
    alignItems: 'center',
    marginVertical: 20
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8
  },
  artist: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textSubtle,
    textAlign: 'center',
    marginBottom: 6
  },
  album: {
    fontSize: 15,
    fontWeight: '500',
    color: c.textMuted,
    textAlign: 'center'
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 30
  },
  secondaryBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: c.inverse
  },
  giantPlayBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  favBtn: {
    padding: 12,
    backgroundColor: c.inverse,
    borderRadius: 24
  },
  exitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.surface,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30
  },
  exitPillText: {
    color: c.ink,
    fontSize: 15,
    fontWeight: '800'
  }
});
