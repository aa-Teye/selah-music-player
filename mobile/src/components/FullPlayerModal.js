import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Easing, 
  ScrollView 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SyncedLyricsView from './SyncedLyricsView';

export default function FullPlayerModal({
  visible,
  onClose,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  isFavorite,
  onToggleFavorite,
  currentPosition,
  duration,
  onSeek,
  playbackSpeed = 1.0,
  onSetSpeed,
  sleepTimerRemaining,
  onSetSleepTimer,
  onOpenAddToPlaylist,
  onOpenSetRingtone,
  onOpenAudioTrimmer,
  onOpenCarMode
}) {
  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'lyrics'
  const [showSleepModal, setShowSleepModal] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scrubberWidthRef = useRef(0);

  useEffect(() => {
    let anim;
    if (isPlaying) {
      anim = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      anim.start();
    } else {
      spinAnim.stopAnimation();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [isPlaying, spinAnim]);

  if (!currentTrack) return null;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const progressPercent = duration > 0 ? Math.min(100, (currentPosition / duration) * 100) : 0;

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle tap on scrubber
  const handleScrubberPress = (event) => {
    if (!onSeek || duration <= 0 || scrubberWidthRef.current <= 0) return;
    const { locationX } = event.nativeEvent;
    const ratio = Math.max(0, Math.min(1, locationX / scrubberWidthRef.current));
    const targetSeconds = Math.round(ratio * duration);
    onSeek(targetSeconds);
  };

  // Cycle speed presets
  const handleCycleSpeed = () => {
    if (!onSetSpeed) return;
    const speeds = [1.0, 1.25, 1.5, 0.75];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    onSetSpeed(nextSpeed);
  };

  const sleepPresets = [
    { label: 'Off', minutes: null },
    { label: '15 Min', minutes: 15 },
    { label: '30 Min', minutes: 30 },
    { label: '45 Min', minutes: 45 },
    { label: '60 Min', minutes: 60 }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="chevron-down" size={26} color="#F3F4F6" />
          </TouchableOpacity>

          <View style={styles.headerTabs}>
            <TouchableOpacity 
              style={[styles.headerTabPill, activeTab === 'player' && styles.activeTabPill]}
              onPress={() => setActiveTab('player')}
            >
              <Text style={[styles.headerTabText, activeTab === 'player' && styles.activeTabText]}>Player</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.headerTabPill, activeTab === 'lyrics' && styles.activeTabPill]}
              onPress={() => setActiveTab('lyrics')}
            >
              <Text style={[styles.headerTabText, activeTab === 'lyrics' && styles.activeTabText]}>Lyrics</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {onOpenCarMode && (
              <TouchableOpacity onPress={onOpenCarMode} style={styles.iconBtn}>
                <MaterialCommunityIcons name="car" size={22} color="#E5A93C" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onToggleFavorite(currentTrack.id)} style={styles.iconBtn}>
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#E5A93C" : "#9CA3AF"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Body */}
        {activeTab === 'player' ? (
          <View style={styles.playerContent}>
            {/* Vinyl Record */}
            <View style={styles.vinylWrapper}>
              <Animated.View style={[styles.largeDisc, { transform: [{ rotate: isPlaying ? spin : '0deg' }] }]}>
                <Image
                  source={{ uri: currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80' }}
                  style={styles.largeCoverArt}
                />
                <View style={styles.largeDiscHole} />
              </Animated.View>
            </View>

            {/* Waveform Visualizer simulation */}
            <View style={styles.waveformContainer}>
              {[18, 32, 22, 45, 28, 50, 36, 24, 48, 30, 16, 42, 26, 38].map((h, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.waveformBar, 
                    { 
                      height: isPlaying ? h * (0.8 + (i % 3) * 0.2) : 6,
                      backgroundColor: isPlaying ? '#E5A93C' : '#374151' 
                    }
                  ]} 
                />
              ))}
            </View>

            {/* Track Info */}
            <View style={styles.trackDetails}>
              <Text style={styles.fullTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.fullArtist} numberOfLines={1}>{currentTrack.artist}</Text>
              <Text style={styles.fullAlbum} numberOfLines={1}>{currentTrack.album || 'Selah Music Release'}</Text>
            </View>
          </View>
        ) : (
          <SyncedLyricsView
            currentTrack={currentTrack}
            currentPosition={currentPosition}
            duration={duration}
            onSeek={onSeek}
          />
        )}

        {/* Controls Section */}
        <View style={styles.controlsFooter}>
          {/* Scrubber Progress Bar with tap-to-seek */}
          <View style={styles.scrubberRow}>
            <Text style={styles.timeLabel}>{formatTime(currentPosition)}</Text>
            
            <TouchableOpacity 
              style={styles.scrubberTouchArea}
              activeOpacity={1}
              onPress={handleScrubberPress}
              onLayout={(e) => {
                scrubberWidthRef.current = e.nativeEvent.layout.width;
              }}
            >
              <View style={styles.scrubberTrack}>
                <View style={[styles.scrubberFill, { width: `${progressPercent}%` }]}>
                  <View style={styles.scrubberThumb} />
                </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
          </View>

          {/* Main Playback Buttons Row */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity onPress={onToggleShuffle}>
              <Ionicons 
                name="shuffle" 
                size={22} 
                color={isShuffle ? "#E5A93C" : "#9CA3AF"} 
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={onPrev}>
              <Ionicons name="play-skip-back" size={28} color="#F3F4F6" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainPlayBtn} onPress={onTogglePlay}>
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color="#0A0D14" 
                style={{ marginLeft: isPlaying ? 0 : 3 }}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={onNext}>
              <Ionicons name="play-skip-forward" size={28} color="#F3F4F6" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onToggleRepeat}>
              <Ionicons 
                name="repeat" 
                size={22} 
                color={isRepeat ? "#E5A93C" : "#9CA3AF"} 
              />
            </TouchableOpacity>
          </View>

          {/* Extra Utilities Bar (Speed, Sleep Timer, Playlist, Ringtone, Cutter) */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.utilityBarContent}
            style={styles.utilityBar}
          >
            {/* Speed Changer */}
            <TouchableOpacity style={styles.utilityPill} onPress={handleCycleSpeed}>
              <Ionicons name="speedometer-outline" size={15} color="#E5A93C" />
              <Text style={styles.utilityPillText}>{playbackSpeed}x Speed</Text>
            </TouchableOpacity>

            {/* Sleep Timer */}
            <TouchableOpacity 
              style={[styles.utilityPill, sleepTimerRemaining && styles.utilityPillActive]} 
              onPress={() => setShowSleepModal(true)}
            >
              <MaterialCommunityIcons 
                name="sleep" 
                size={16} 
                color={sleepTimerRemaining ? "#0A0D14" : "#E5A93C"} 
              />
              <Text style={[styles.utilityPillText, sleepTimerRemaining && styles.utilityPillTextActive]}>
                {sleepTimerRemaining ? `${formatTime(sleepTimerRemaining)}` : 'Sleep Timer'}
              </Text>
            </TouchableOpacity>

            {/* Add to Playlist */}
            {onOpenAddToPlaylist && (
              <TouchableOpacity 
                style={styles.utilityPill} 
                onPress={() => onOpenAddToPlaylist(currentTrack)}
              >
                <Ionicons name="bookmark-outline" size={15} color="#E5A93C" />
                <Text style={styles.utilityPillText}>+ Playlist</Text>
              </TouchableOpacity>
            )}

            {/* Set Ringtone / Caller Tune */}
            {onOpenSetRingtone && (
              <TouchableOpacity 
                style={styles.utilityPill} 
                onPress={() => onOpenSetRingtone(currentTrack)}
              >
                <MaterialCommunityIcons name="phone-incoming" size={15} color="#E5A93C" />
                <Text style={styles.utilityPillText}>Ringtone</Text>
              </TouchableOpacity>
            )}
            {/* Audio Trimmer & Ringtone Cutter */}
            {onOpenAudioTrimmer && (
              <TouchableOpacity 
                style={styles.utilityPill} 
                onPress={() => onOpenAudioTrimmer(currentTrack)}
              >
                <MaterialCommunityIcons name="content-cut" size={15} color="#E5A93C" />
                <Text style={styles.utilityPillText}>Cutter</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Sleep Timer Selection Modal */}
        <Modal 
          visible={showSleepModal} 
          transparent={true} 
          animationType="fade"
          onRequestClose={() => setShowSleepModal(false)}
        >
          <View style={styles.sleepModalOverlay}>
            <View style={styles.sleepModalBox}>
              <View style={styles.sleepModalHeader}>
                <MaterialCommunityIcons name="moon-waning-crescent" size={24} color="#E5A93C" />
                <Text style={styles.sleepModalTitle}>Bedtime Sleep Timer</Text>
              </View>
              <Text style={styles.sleepModalSub}>Music will pause gently after this timer</Text>

              <View style={styles.presetGrid}>
                {sleepPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={styles.presetBtn}
                    onPress={() => {
                      if (onSetSleepTimer) onSetSleepTimer(preset.minutes);
                      setShowSleepModal(false);
                    }}
                  >
                    <Text style={styles.presetBtnText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.closeSleepBtn}
                onPress={() => setShowSleepModal(false)}
              >
                <Text style={styles.closeSleepText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D14',
    paddingTop: 48,
    paddingHorizontal: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  iconBtn: {
    padding: 8
  },
  headerTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 3
  },
  headerTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16
  },
  activeTabPill: {
    backgroundColor: '#E5A93C'
  },
  headerTabText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700'
  },
  activeTabText: {
    color: '#0A0D14',
    fontWeight: '800'
  },
  playerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10
  },
  vinylWrapper: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#0F1522',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(229, 169, 60, 0.2)'
  },
  largeDisc: {
    width: 236,
    height: 236,
    borderRadius: 118,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#0A0D14'
  },
  largeCoverArt: {
    width: 140,
    height: 140,
    borderRadius: 70
  },
  largeDiscHole: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A0D14',
    borderWidth: 2,
    borderColor: 'rgba(229, 169, 60, 0.5)'
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 50,
    marginVertical: 10
  },
  waveformBar: {
    width: 4,
    borderRadius: 2
  },
  trackDetails: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20
  },
  fullTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 6
  },
  fullArtist: {
    fontSize: 15,
    color: '#E5A93C',
    fontWeight: '600',
    marginBottom: 4
  },
  fullAlbum: {
    fontSize: 12,
    color: '#6B7280'
  },
  lyricsScroll: {
    flex: 1,
    marginVertical: 10
  },
  lyricsContent: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  lyricsSongTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 4
  },
  lyricsSongArtist: {
    fontSize: 13,
    color: '#E5A93C',
    marginBottom: 16
  },
  lyricsDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(229, 169, 60, 0.3)',
    marginBottom: 16
  },
  lyricsText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#D1D5DB',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16
  },
  controlsFooter: {
    paddingBottom: 28,
    paddingTop: 10
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16
  },
  timeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    minWidth: 32
  },
  scrubberTouchArea: {
    flex: 1,
    paddingVertical: 10
  },
  scrubberTrack: {
    height: 5,
    backgroundColor: '#1F2937',
    borderRadius: 2.5,
    overflow: 'visible'
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#E5A93C',
    borderRadius: 2.5,
    position: 'relative',
    justifyContent: 'center'
  },
  scrubberThumb: {
    position: 'absolute',
    right: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5A93C'
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5A93C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6
  },
  utilityBar: {
    marginTop: 4,
    maxHeight: 44
  },
  utilityBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8
  },
  utilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 6
  },
  utilityPillActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C'
  },
  utilityPillText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '700'
  },
  utilityPillTextActive: {
    color: '#0A0D14',
    fontWeight: '800'
  },
  sleepModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  sleepModalBox: {
    backgroundColor: '#121824',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937'
  },
  sleepModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  sleepModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F9FAFB'
  },
  sleepModalSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20
  },
  presetGrid: {
    width: '100%',
    gap: 10,
    marginBottom: 16
  },
  presetBtn: {
    backgroundColor: '#1A2333',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#263346'
  },
  presetBtnText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '700'
  },
  closeSleepBtn: {
    paddingVertical: 8
  },
  closeSleepText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600'
  }
});
