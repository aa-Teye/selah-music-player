import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SyncedLyricsView, { LyricsPreview } from './SyncedLyricsView';
import PlaybackQueueView from './PlaybackQueueView';
import Scrubber from './Scrubber';
import AudioVisualizer from './AudioVisualizer';
import useTrackLyrics from '../hooks/useTrackLyrics';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

const SLEEP_PRESETS = [
  { label: 'Off', minutes: null },
  { label: '15 Min', minutes: 15 },
  { label: '30 Min', minutes: 30 },
  { label: '45 Min', minutes: 45 },
  { label: '60 Min', minutes: 60 }
];

const formatClock = (secs) => {
  if (!secs || isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

function formatBadge(track) {
  if (!track) return '';
  if (track.sourceType === 'youtube') return 'YouTube';
  const uri = String(track.uri || '').split('?')[0];
  const match = uri.match(/\.([a-z0-9]{2,5})$/i);
  const ext = match ? match[1].toUpperCase() : null;
  if (ext && ['MP3', 'M4A', 'WAV', 'FLAC', 'AAC', 'OGG', 'OPUS', 'WMA', 'AIFF'].includes(ext)) return ext;
  return track.sourceType === 'stream' ? 'STREAM' : 'AUDIO';
}

function Pill({ icon, label, onPress, active }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon}
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/**
 * The full player: Now Playing / Lyrics / Up Next, with one set of controls at the bottom.
 * Shown inside the Player tab.
 */
export default function PlayerPanel({
  view = 'now',
  onChangeView,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  isShuffle,
  onToggleShuffle,
  repeatMode = 'off',
  onToggleRepeat,
  isFavorite,
  onToggleFavorite,
  currentPosition = 0,
  duration = 0,
  onSeek,
  playbackSpeed = 1.0,
  onSetSpeed,
  sleepTimerRemaining,
  onSetSleepTimer,
  onOpenAddToPlaylist,
  onOpenSetRingtone,
  onOpenAudioTrimmer,
  onOpenCarMode,
  onOpenEqualizer,
  queue = [],
  onPlayTrack,
  onPlayQueueTrack,
  onRemoveFromQueue,
  onClearQueue,
  onOpenPrayerBookmarks,
  onOpenAmbientSoundscapes,
  activeSoundscape,
  bookmarksCount = 0
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const lyrics = useTrackLyrics(currentTrack, { duration });
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Spin the record while playing; keep its angle when paused
  useEffect(() => {
    let cancelled = false;
    const run = (from) => {
      spinAnim.setValue(from);
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 12000 * (1 - from),
        easing: Easing.linear,
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished && !cancelled) run(0);
      });
    };
    if (isPlaying) {
      spinAnim.stopAnimation((value) => {
        if (!cancelled) run(value % 1);
      });
    } else {
      spinAnim.stopAnimation();
    }
    return () => {
      cancelled = true;
      spinAnim.stopAnimation();
    };
  }, [isPlaying, spinAnim]);

  if (!currentTrack) return null;

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const vinylSize = bodyHeight > 0 ? Math.max(140, Math.min(250, bodyHeight - 300)) : 200;
  const discSize = vinylSize - 14;
  const coverSize = Math.round(vinylSize * 0.6);

  const cycleSpeed = () => {
    if (!onSetSpeed) return;
    const idx = SPEEDS.indexOf(playbackSpeed);
    onSetSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const skipBy = (seconds) => {
    if (!onSeek) return;
    const target = Math.max(0, Math.min(duration > 0 ? duration : Infinity, currentPosition + seconds));
    onSeek(Math.round(target));
  };

  const renderNow = () => (
    <ScrollView
      style={styles.nowScroll}
      contentContainerStyle={styles.nowContent}
      showsVerticalScrollIndicator={false}
      onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}
    >
      <View
        style={[
          styles.vinylWrap,
          { width: vinylSize, height: vinylSize, borderRadius: vinylSize / 2 }
        ]}
      >
        <Animated.View
          style={[
            styles.disc,
            {
              width: discSize,
              height: discSize,
              borderRadius: discSize / 2,
              transform: [{ rotate: spin }]
            }
          ]}
        >
          <Image
            source={{ uri: currentTrack.coverUrl || FALLBACK_COVER }}
            style={{ width: coverSize, height: coverSize, borderRadius: coverSize / 2 }}
          />
          <View style={styles.discHole} />
        </Animated.View>
      </View>

      <AudioVisualizer playing={isPlaying} />

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist || 'Unknown Artist'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.album} numberOfLines={1}>
              {currentTrack.album || 'Selah'}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formatBadge(currentTrack)}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onToggleFavorite && onToggleFavorite(currentTrack.id)}
          style={styles.heartBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={isFavorite ? '#EF4444' : c.textMuted}
          />
        </TouchableOpacity>
      </View>

      <LyricsPreview
        lyrics={lyrics}
        currentPosition={currentPosition}
        onPress={() => onChangeView && onChangeView('lyrics')}
      />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        {view === 'lyrics' ? (
          <SyncedLyricsView
            lyrics={lyrics}
            track={currentTrack}
            currentPosition={currentPosition}
            onSeek={onSeek}
          />
        ) : view === 'queue' ? (
          <PlaybackQueueView
            queue={queue}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={onPlayQueueTrack || onPlayTrack}
            onRemoveFromQueue={onRemoveFromQueue}
            onClearQueue={onClearQueue}
          />
        ) : (
          renderNow()
        )}
      </View>

      {/* Controls */}
      <View style={styles.footer}>
        {view !== 'now' && (
          <TouchableOpacity
            style={styles.miniInfo}
            onPress={() => onChangeView && onChangeView('now')}
            activeOpacity={0.8}
          >
            <Image source={{ uri: currentTrack.coverUrl || FALLBACK_COVER }} style={styles.miniCover} />
            <View style={{ flex: 1 }}>
              <Text style={styles.miniTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.miniArtist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
            <Ionicons name="chevron-up" size={18} color={c.textSubtle} />
          </TouchableOpacity>
        )}

        <Scrubber position={currentPosition} duration={duration} onSeek={onSeek} />

        <View style={styles.transport}>
          <TouchableOpacity onPress={onToggleShuffle} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
            <Ionicons name="shuffle" size={22} color={isShuffle ? c.ink : c.textFaint} />
            {isShuffle && <View style={styles.activeDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={onPrev} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
            <Ionicons name="play-skip-back" size={28} color={c.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => skipBy(-10)} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="rewind-10" size={30} color={c.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={onTogglePlay} activeOpacity={0.85}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color="#FFFFFF"
              style={{ marginLeft: isPlaying ? 0 : 3 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => skipBy(10)} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="fast-forward-10" size={30} color={c.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
            <Ionicons name="play-skip-forward" size={28} color={c.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleRepeat}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            testID="repeat-button"
            accessibilityLabel={repeatMode === 'one' ? 'Repeat this song' : repeatMode === 'all' ? 'Repeat all songs' : 'Repeat off'}
          >
            <MaterialCommunityIcons
              name={repeatMode === 'one' ? 'repeat-once' : repeatMode === 'all' ? 'repeat' : 'repeat-off'}
              size={24}
              color={repeatMode !== 'off' ? c.ink : c.textFaint}
            />
            {repeatMode !== 'off' && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>

        {view === 'now' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillBar}
            contentContainerStyle={styles.pillBarContent}
          >
            <Pill
              icon={<Ionicons name="speedometer-outline" size={15} color={playbackSpeed !== 1 ? '#FFFFFF' : c.ink} />}
              label={`${playbackSpeed}x`}
              active={playbackSpeed !== 1}
              onPress={cycleSpeed}
            />
            <Pill
              icon={<MaterialCommunityIcons name="sleep" size={16} color={sleepTimerRemaining ? '#FFFFFF' : c.ink} />}
              label={sleepTimerRemaining ? formatClock(sleepTimerRemaining) : 'Sleep'}
              active={Boolean(sleepTimerRemaining)}
              onPress={() => setShowSleepModal(true)}
            />
            {onOpenAddToPlaylist && (
              <Pill
                icon={<Ionicons name="bookmark-outline" size={15} color={c.ink} />}
                label="Playlist"
                onPress={() => onOpenAddToPlaylist(currentTrack)}
              />
            )}
            {onOpenAmbientSoundscapes && (
              <Pill
                icon={<MaterialCommunityIcons name="weather-night" size={15} color={activeSoundscape ? '#FFFFFF' : c.ink} />}
                label={activeSoundscape ? activeSoundscape : 'Ambience'}
                active={Boolean(activeSoundscape)}
                onPress={onOpenAmbientSoundscapes}
              />
            )}
            {onOpenPrayerBookmarks && (
              <Pill
                icon={<MaterialCommunityIcons name="book-cross" size={15} color={bookmarksCount > 0 ? '#FFFFFF' : c.ink} />}
                label={bookmarksCount > 0 ? `${bookmarksCount} Pins` : 'Prayer pin'}
                active={bookmarksCount > 0}
                onPress={onOpenPrayerBookmarks}
              />
            )}
            {onOpenEqualizer && (
              <Pill
                icon={<MaterialCommunityIcons name="tune-vertical" size={15} color={c.ink} />}
                label="Sound"
                onPress={onOpenEqualizer}
              />
            )}
            {onOpenCarMode && (
              <Pill
                icon={<MaterialCommunityIcons name="car" size={16} color={c.ink} />}
                label="Car mode"
                onPress={onOpenCarMode}
              />
            )}
            {onOpenSetRingtone && (
              <Pill
                icon={<MaterialCommunityIcons name="phone-incoming" size={15} color={c.ink} />}
                label="Ringtone"
                onPress={() => onOpenSetRingtone(currentTrack)}
              />
            )}
            {onOpenAudioTrimmer && (
              <Pill
                icon={<MaterialCommunityIcons name="content-cut" size={15} color={c.ink} />}
                label="Cutter"
                onPress={() => onOpenAudioTrimmer(currentTrack)}
              />
            )}
          </ScrollView>
        )}
      </View>

      {/* Sleep timer picker */}
      <Modal
        visible={showSleepModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSleepModal(false)}
      >
        <View style={styles.sleepOverlay}>
          <View style={styles.sleepBox}>
            <View style={styles.sleepHeader}>
              <MaterialCommunityIcons name="moon-waning-crescent" size={24} color="#34D399" />
              <Text style={styles.sleepTitle}>Bedtime Sleep Timer</Text>
            </View>
            <Text style={styles.sleepSub}>Music fades out and pauses when the timer ends</Text>
            <View style={styles.presetGrid}>
              {SLEEP_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={styles.presetBtn}
                  onPress={() => {
                    if (onSetSleepTimer) onSetSleepTimer(preset.minutes);
                    setShowSleepModal(false);
                  }}
                >
                  <Text style={styles.presetText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.sleepCancel} onPress={() => setShowSleepModal(false)}>
              <Text style={styles.sleepCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  body: { flex: 1 },
  nowScroll: { flex: 1 },
  nowContent: { alignItems: 'center', gap: 14, paddingTop: 4, paddingBottom: 10 },

  vinylWrap: {
    backgroundColor: c.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: c.border
  },
  disc: {
    backgroundColor: c.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: c.border
  },
  discHole: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.bg,
    borderWidth: 2,
    borderColor: c.border
  },

  titleRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center' },
  title: { color: c.text, fontSize: 24, fontWeight: '900' },
  artist: { color: c.textSecondary, fontSize: 16, fontWeight: '600', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  album: { color: c.textSubtle, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  badge: { backgroundColor: c.surfaceAlt, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: c.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  heartBtn: { paddingLeft: 12 },

  footer: { paddingTop: 6, paddingBottom: 8 },
  miniInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 8,
    marginBottom: 4
  },
  miniCover: { width: 38, height: 38, borderRadius: 8, backgroundColor: c.surfaceAlt },
  miniTitle: { color: c.text, fontSize: 14, fontWeight: '800' },
  miniArtist: { color: c.textMuted, fontSize: 12, marginTop: 1 },

  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 6,
    marginBottom: 12
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6
  },
  activeDot: {
    alignSelf: 'center',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.inverse,
    marginTop: 3
  },

  pillBar: { flexGrow: 0 },
  pillBarContent: { gap: 8, paddingRight: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: c.surfaceAlt,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18
  },
  pillActive: { backgroundColor: c.inverse },
  pillText: { color: c.ink, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  pillTextActive: { color: '#FFFFFF' },

  sleepOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  sleepBox: { width: '100%', backgroundColor: c.surface, borderRadius: 24, padding: 22 },
  sleepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sleepTitle: { color: c.text, fontSize: 18, fontWeight: '800' },
  sleepSub: { color: c.textMuted, fontSize: 13, marginTop: 6, marginBottom: 16 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetBtn: {
    backgroundColor: c.surfaceAlt,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16
  },
  presetText: { color: c.ink, fontWeight: '800', fontSize: 14 },
  sleepCancel: { alignSelf: 'center', marginTop: 18, padding: 8 },
  sleepCancelText: { color: c.textMuted, fontWeight: '700', fontSize: 14 }
});
