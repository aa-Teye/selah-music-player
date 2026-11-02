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
  onOpenAi,
  onOpenAddToPlaylist,
  recentTracks = [],
  onOpenStats,
  searchQuery = '',
  onNavigateToYouTube,
  favoriteArtists = [],
  onNextDevotional,
  onOpenDigitalLibraries
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {onNextDevotional && (
              <TouchableOpacity style={styles.cycleBadge} onPress={onNextDevotional} activeOpacity={0.7}>
                <Ionicons name="sync" size={12} color="#E5A93C" />
                <Text style={styles.cycleBadgeText}>Next Verse</Text>
              </TouchableOpacity>
            )}
            {onOpenStats ? (
              <TouchableOpacity style={styles.streakBadge} onPress={onOpenStats}>
                <Ionicons name="flame" size={14} color="#F97316" />
                <Text style={styles.streakBadgeText}>Day {devotion.streakDays}</Text>
                <Ionicons name="chevron-forward" size={12} color="#F97316" />
              </TouchableOpacity>
            ) : (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={14} color="#F97316" />
                <Text style={styles.streakBadgeText}>Day {devotion.streakDays}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.verseQuote}>{devotion.verse}</Text>
        <Text style={styles.verseRef}>— {devotion.reference}</Text>
        <Text style={styles.verseReflection}>{devotion.reflection}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.playAnthemBtn}
            onPress={() => featuredTrack && onPlayTrack && onPlayTrack(featuredTrack)}
          >
            <Ionicons name="play" size={18} color="#080A0F" />
            <Text style={styles.playAnthemText}>Play Devotional Anthem</Text>
          </TouchableOpacity>

          {onOpenDigitalLibraries && (
            <TouchableOpacity 
              style={[styles.playAnthemBtn, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}
              onPress={onOpenDigitalLibraries}
            >
              <Ionicons name="library-outline" size={16} color="#E5A93C" />
              <Text style={[styles.playAnthemText, { color: '#E5A93C' }]}>Libraries</Text>
            </TouchableOpacity>
          )}

          {onOpenStats && (
            <TouchableOpacity 
              style={[styles.playAnthemBtn, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}
              onPress={onOpenStats}
            >
              <Ionicons name="stats-chart" size={16} color="#E5A93C" />
              <Text style={[styles.playAnthemText, { color: '#E5A93C' }]}>My Stats</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recommended For You Based on Favorite Artists */}
      {favoriteArtists && favoriteArtists.length > 0 && (
        <View style={styles.recommendedSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            <Text style={styles.sectionSubtitle}>Based on your chosen worship leaders</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {favoriteArtists.map((artistName, idx) => (
              <TouchableOpacity
                key={`fav-art-${idx}`}
                style={styles.artistRecCard}
                onPress={() => onNavigateToYouTube && onNavigateToYouTube(artistName)}
                activeOpacity={0.8}
              >
                <View style={styles.artistRecAvatar}>
                  <Ionicons name="person" size={20} color="#E5A93C" />
                </View>
                <Text style={styles.artistRecName} numberOfLines={1}>{artistName}</Text>
                <View style={styles.artistRecPlayRow}>
                  <Ionicons name="play-circle" size={14} color="#E5A93C" />
                  <Text style={styles.artistRecPlayText}>Listen</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recently Played Horizontal Rail */}
      {recentTracks && recentTracks.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            <Text style={styles.sectionSubtitle}>{recentTracks.length} tracks</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {recentTracks.map((item) => (
              <TouchableOpacity
                key={`recent-${item.id}`}
                style={styles.recentItemCard}
                onPress={() => onPlayTrack(item)}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: item.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }} 
                  style={styles.recentCover} 
                />
                <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.recentArtist} numberOfLines={1}>{item.artist}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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

      {/* YouTube Direct Search Suggestion Banner when Searching */}
      {searchQuery && onNavigateToYouTube ? (
        <TouchableOpacity 
          style={styles.searchYtCard}
          onPress={() => onNavigateToYouTube(searchQuery)}
          activeOpacity={0.85}
        >
          <View style={styles.searchYtCardLeft}>
            <View style={styles.ytIconWrap}>
              <Ionicons name="logo-youtube" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.searchYtCardTitle}>Search "{searchQuery}" on YouTube Live</Text>
              <Text style={styles.searchYtCardSub}>Tap to stream full video directly from YouTube</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#E5A93C" />
        </TouchableOpacity>
      ) : null}

      {/* Featured Tracks */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Melodies'}
        </Text>
        <Text style={styles.sectionSubtitle}>{filteredTracks.length} available</Text>
      </View>

      {/* No local results empty state */}
      {filteredTracks.length === 0 && searchQuery ? (
        <View style={styles.noResultsBox}>
          <Ionicons name="search-outline" size={38} color="#6B7280" />
          <Text style={styles.noResultsTitle}>No local tracks found for "{searchQuery}"</Text>
          <Text style={styles.noResultsSub}>Stream this song live from YouTube right now:</Text>
          {onNavigateToYouTube && (
            <TouchableOpacity 
              style={styles.searchYtBannerBtn}
              onPress={() => onNavigateToYouTube(searchQuery)}
            >
              <Ionicons name="logo-youtube" size={18} color="#EF4444" />
              <Text style={styles.searchYtBannerBtnText}>Search YouTube for "{searchQuery}"</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
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
                  {onOpenAddToPlaylist && (
                    <TouchableOpacity 
                      style={styles.cardAddPlBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        onOpenAddToPlaylist(track);
                      }}
                    >
                      <Ionicons name="bookmark-outline" size={13} color="#E5A93C" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.cardTitle} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.cardArtist} numberOfLines={1}>{track.artist}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A0F'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  heroCard: {
    backgroundColor: '#10141E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.22)',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
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
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.25)',
    gap: 4
  },
  streakBadgeText: {
    color: '#F5B74F',
    fontSize: 11,
    fontWeight: '700'
  },
  verseQuote: {
    color: '#FBFBFC',
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: 8,
    fontWeight: '600'
  },
  verseRef: {
    color: '#F5B74F',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  verseReflection: {
    color: '#A0A6B5',
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
    backgroundColor: '#151B28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4
  },
  aiPromptText: {
    color: '#FBFBFC',
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
    color: '#FBFBFC',
    fontSize: 17,
    fontWeight: '800'
  },
  sectionSubtitle: {
    color: '#687182',
    fontSize: 12
  },
  moodScroll: {
    marginBottom: 24
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151B28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6
  },
  activeMoodPill: {
    backgroundColor: 'rgba(229, 169, 60, 0.16)',
    borderColor: '#E5A93C'
  },
  moodIcon: {
    fontSize: 14
  },
  moodText: {
    color: '#A0A6B5',
    fontSize: 12,
    fontWeight: '600'
  },
  activeMoodText: {
    color: '#F5B74F',
    fontWeight: '800'
  },
  tracksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  trackCard: {
    width: '48%',
    backgroundColor: '#10141E',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  activeTrackCard: {
    borderColor: '#E5A93C',
    backgroundColor: 'rgba(229, 169, 60, 0.08)'
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
    color: '#FBFBFC',
    fontSize: 13,
    fontWeight: '700'
  },
  cardArtist: {
    color: '#A0A6B5',
    fontSize: 11,
    marginTop: 2
  },
  cardAddPlBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 13, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.4)'
  },
  recentItemCard: {
    width: 110,
    marginRight: 12,
    backgroundColor: '#10141E',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  recentCover: {
    width: '100%',
    height: 94,
    borderRadius: 8,
    marginBottom: 6
  },
  recentTitle: {
    color: '#FBFBFC',
    fontSize: 12,
    fontWeight: '700'
  },
  recentArtist: {
    color: '#A0A6B5',
    fontSize: 10,
    marginTop: 2
  },
  searchYtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10141E',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.22)'
  },
  searchYtCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8
  },
  ytIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)'
  },
  searchYtCardTitle: {
    color: '#FBFBFC',
    fontSize: 13,
    fontWeight: '700'
  },
  searchYtCardSub: {
    color: '#E5A93C',
    fontSize: 11,
    marginTop: 2
  },
  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10141E',
    borderRadius: 16,
    padding: 24,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  noResultsTitle: {
    color: '#FBFBFC',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center'
  },
  noResultsSub: {
    color: '#A0A6B5',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 16
  },
  searchYtBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151B28',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8
  },
  searchYtBannerBtnText: {
    color: '#FBFBFC',
    fontSize: 13,
    fontWeight: '700'
  },
  cycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4
  },
  cycleBadgeText: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '700'
  },
  recommendedSection: {
    marginBottom: 20
  },
  artistRecCard: {
    width: 104,
    marginRight: 12,
    backgroundColor: '#10141E',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.22)'
  },
  artistRecAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.28)'
  },
  artistRecName: {
    color: '#FBFBFC',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6
  },
  artistRecPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4
  },
  artistRecPlayText: {
    color: '#E5A93C',
    fontSize: 10,
    fontWeight: '800'
  }
});
