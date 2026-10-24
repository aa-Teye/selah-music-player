import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen({
  devotion,
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  activeMood,
  setActiveMood,
  moodTags,
  onOpenAi
}) {
  const filteredTracks = activeMood === 'all' 
    ? tracks 
    : tracks.filter(t => t.category === activeMood);

  const featuredTrack = tracks[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* YouVersion Verse of the Day Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.badgeRow}>
          <View style={styles.verseBadge}>
            <Ionicons name="book-outline" size={13} color="#E5A93C" />
            <Text style={styles.verseBadgeText}>VERSE OF THE DAY</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={14} color="#F97316" />
            <Text style={styles.streakBadgeText}>Day {devotion.streakDays}</Text>
          </View>
        </View>

        <Text style={styles.verseQuote}>{devotion.verse}</Text>
        <Text style={styles.verseRef}>— {devotion.reference}</Text>
        <Text style={styles.verseReflection}>{devotion.reflection}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.playAnthemBtn}
            onPress={() => onPlayTrack(featuredTrack)}
          >
            <Ionicons name="play" size={18} color="#0A0D14" />
            <Text style={styles.playAnthemText}>Play Devotional Anthem</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mood Filter Pills */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mood & Atmosphere</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
        {moodTags.map((tag) => {
          const isActive = activeMood === tag.id;
          return (
            <TouchableOpacity
              key={tag.id}
              style={[styles.moodPill, isActive && styles.activeMoodPill]}
              onPress={() => setActiveMood(tag.id)}
            >
              <Text style={[styles.moodText, isActive && styles.activeMoodText]}>
                {tag.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured Tracks */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Melodies</Text>
        <Text style={styles.sectionSubtitle}>{filteredTracks.length} available</Text>
      </View>

      <View style={styles.tracksGrid}>
        {filteredTracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={track.id}
              style={[styles.trackCard, isCurrent && styles.activeTrackCard]}
              onPress={() => onPlayTrack(track)}
              activeOpacity={0.8}
            >
              <View style={styles.cardCoverWrap}>
                <Image source={{ uri: track.coverUrl }} style={styles.cardCover} />
                <View style={styles.cardPlayBadge}>
                  <Ionicons 
                    name={isCurrent && isPlaying ? "pause" : "play"} 
                    size={14} 
                    color="#0A0D14" 
                  />
                </View>
                {track.sourceType === 'youtube' && (
                  <View style={styles.cardYtTag}>
                    <Text style={styles.cardYtText}>YouTube</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardTitle} numberOfLines={1}>{track.title}</Text>
              <Text style={styles.cardArtist} numberOfLines={1}>{track.artist}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D14'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  heroCard: {
    backgroundColor: '#171D2C',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.35)',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  verseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  verseBadgeText: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4
  },
  streakBadgeText: {
    color: '#FDBA74',
    fontSize: 11,
    fontWeight: '700'
  },
  verseQuote: {
    color: '#FFFBEB',
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: 8,
    fontWeight: '600'
  },
  verseRef: {
    color: '#E5A93C',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  verseReflection: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  playAnthemBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5A93C',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6
  },
  playAnthemText: {
    color: '#0A0D14',
    fontWeight: '800',
    fontSize: 13
  },
  aiPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4
  },
  aiPromptText: {
    color: '#F3F4F6',
    fontWeight: '600',
    fontSize: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 17,
    fontWeight: '800'
  },
  sectionSubtitle: {
    color: '#6B7280',
    fontSize: 12
  },
  moodScroll: {
    marginBottom: 24
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6
  },
  activeMoodPill: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
    borderColor: '#E5A93C'
  },
  moodIcon: {
    fontSize: 14
  },
  moodText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600'
  },
  activeMoodText: {
    color: '#FCD34D'
  },
  tracksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  trackCard: {
    width: '48%',
    backgroundColor: '#111622',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  activeTrackCard: {
    borderColor: '#E5A93C',
    backgroundColor: 'rgba(229, 169, 60, 0.1)'
  },
  cardCoverWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative'
  },
  cardCover: {
    width: '100%',
    height: '100%'
  },
  cardPlayBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5A93C',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardYtTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4
  },
  cardYtText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800'
  },
  cardTitle: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '700'
  },
  cardArtist: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2
  }
});
