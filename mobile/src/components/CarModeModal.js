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
            <MaterialCommunityIcons name="car" size={20} color="#E5A93C" />
            <Text style={styles.modeText}>CAR &amp; STAGE MODE</Text>
          </View>
          <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
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
            <Ionicons name="play-skip-back" size={44} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Giant Play / Pause Button */}
          <TouchableOpacity 
            style={styles.giantPlayBtn} 
            onPress={onTogglePlay}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={64} 
              color="#000000" 
            />
          </TouchableOpacity>

          {/* Next Track */}
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={onNext}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={44} color="#FFFFFF" />
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
              size={36} 
              color={isFavorite ? "#E5A93C" : "#9CA3AF"} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.exitPill} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#000000" />
            <Text style={styles.exitPillText}>Exit Car Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  modeText: {
    color: '#E5A93C',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1
  },
  exitBtn: {
    padding: 8,
    backgroundColor: '#1C1C1E',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#E5A93C',
    textAlign: 'center',
    marginBottom: 6
  },
  album: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
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
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2C2C2E'
  },
  giantPlayBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5A93C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  favBtn: {
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 24
  },
  exitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E5A93C',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30
  },
  exitPillText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800'
  }
});
