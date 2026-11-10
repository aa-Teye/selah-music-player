import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function PlaybackQueueView({
  queue = [],
  currentTrack,
  isPlaying,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue
}) {
  const handleConfirmClear = () => {
    Alert.alert(
      "Clear Queue",
      "Do you want to clear all tracks from the playback queue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive", 
          onPress: () => onClearQueue && onClearQueue() 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Queue Header */}
      <View style={styles.headerBar}>
        <View style={styles.titleGroup}>
          <MaterialCommunityIcons name="playlist-play" size={20} color="#12141A" />
          <Text style={styles.headerTitle}>Playback Queue</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{queue.length} Tracks</Text>
          </View>
        </View>

        {queue.length > 1 && onClearQueue && (
          <TouchableOpacity 
            style={styles.clearBtn} 
            onPress={handleConfirmClear}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Queue Track List */}
      <ScrollView 
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {queue.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="music-box-multiple-outline" size={48} color="#8A919E" />
            <Text style={styles.emptyTitle}>Queue is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Select any song from Home, Local Library, or YouTube to start queuing.
            </Text>
          </View>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <TouchableOpacity
                key={track.id || `q-${idx}`}
                style={[styles.trackRow, isCurrent && styles.activeTrackRow]}
                onPress={() => onPlayTrack && onPlayTrack(track)}
                activeOpacity={0.75}
              >
                {/* Track Index or Playing Indicator */}
                <View style={styles.indexCol}>
                  {isCurrent ? (
                    <Ionicons 
                      name={isPlaying ? "volume-high" : "pause"} 
                      size={16} 
                      color="#12141A" 
                    />
                  ) : (
                    <Text style={styles.indexText}>{idx + 1}</Text>
                  )}
                </View>

                {/* Thumbnail Art */}
                <Image
                  source={{ uri: track.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80' }}
                  style={styles.trackThumb}
                />

                {/* Track Details */}
                <View style={styles.trackDetails}>
                  <Text 
                    style={[styles.trackTitle, isCurrent && styles.activeTrackTitle]} 
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <View style={styles.artistRow}>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist || 'Selah Worship'}
                    </Text>
                    {track.sourceType === 'youtube' ? (
                      <View style={styles.ytPill}>
                        <Text style={styles.ytPillText}>YT</Text>
                      </View>
                    ) : (
                      <View style={styles.localPill}>
                        <Text style={styles.localPillText}>MP3</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Remove from queue button */}
                {onRemoveFromQueue && queue.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      onRemoveFromQueue(track.id, idx);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color="#717886" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    color: '#0F1115',
    fontSize: 15,
    fontWeight: '800'
  },
  countBadge: {
    backgroundColor: '#EEF0F4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  countBadgeText: {
    color: '#12141A',
    fontSize: 11,
    fontWeight: '800'
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 24
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24
  },
  emptyTitle: {
    color: '#0F1115',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12
  },
  emptySubtitle: {
    color: '#717886',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12
  },
  activeTrackRow: {
    borderColor: '#12141A',
    backgroundColor: '#EEF0F4'
  },
  indexCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  indexText: {
    color: '#8A919E',
    fontSize: 12,
    fontWeight: '700'
  },
  trackThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EEF0F4'
  },
  trackDetails: {
    flex: 1
  },
  trackTitle: {
    color: '#0F1115',
    fontSize: 13,
    fontWeight: '700'
  },
  activeTrackTitle: {
    color: '#0F1115',
    fontWeight: '800'
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3
  },
  trackArtist: {
    color: '#717886',
    fontSize: 11
  },
  ytPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  ytPillText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800'
  },
  localPill: {
    backgroundColor: '#EEF0F4',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  localPillText: {
    color: '#12141A',
    fontSize: 9,
    fontWeight: '800'
  },
  removeBtn: {
    padding: 6
  }
});
