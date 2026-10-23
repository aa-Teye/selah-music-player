import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MiniPlayerBar({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onOpenFullPlayer,
  currentPosition,
  duration
}) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentTrack) return;
    let anim;
    if (isPlaying) {
      anim = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 8000,
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
  }, [isPlaying, currentTrack, spinAnim]);

  if (!currentTrack) return null;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const progressPercent = duration > 0 ? Math.min(100, (currentPosition / duration) * 100) : 0;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onOpenFullPlayer} 
      activeOpacity={0.9}
    >
      {/* Top Scrubber Progress Line */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.innerContent}>
        {/* Animated Vinyl Artwork */}
        <Animated.View style={[styles.discContainer, { transform: [{ rotate: isPlaying ? spin : '0deg' }] }]}>
          <Image
            source={{ uri: currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80' }}
            style={styles.discImage}
          />
          <View style={styles.discHole} />
        </Animated.View>

        {/* Track Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            {currentTrack.sourceType === 'youtube' ? (
              <View style={styles.ytBadge}>
                <Text style={styles.ytBadgeText}>YT</Text>
              </View>
            ) : (
              <View style={styles.localBadge}>
                <Text style={styles.localBadgeText}>MP3</Text>
              </View>
            )}
          </View>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.playBtn} 
            onPress={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={20} 
              color="#0A0D14" 
              style={{ marginLeft: isPlaying ? 0 : 2 }}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.nextBtn}
            onPress={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <Ionicons name="play-skip-forward" size={20} color="#F3F4F6" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#171D2C',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 5
  },
  progressBarBg: {
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E5A93C'
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  discContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5A93C'
  },
  discImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22
  },
  discHole: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A0D14',
    borderWidth: 1.5,
    borderColor: '#E5A93C'
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  trackTitle: {
    color: '#F3F4F6',
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1
  },
  ytBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4
  },
  ytBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800'
  },
  localBadge: {
    backgroundColor: 'rgba(229, 169, 60, 0.25)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4
  },
  localBadgeText: {
    color: '#E5A93C',
    fontSize: 9,
    fontWeight: '800'
  },
  trackArtist: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5A93C',
    alignItems: 'center',
    justifyContent: 'center'
  },
  nextBtn: {
    padding: 6
  }
});
