import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({
  devotion,
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  activeMood,
  setActiveMood,
  moodTags,
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
      {/* Sleek Ceramic Quick Access Bar */}
      <View style={styles.quickBarRow}>
        {onOpenDigitalLibraries && (
          <TouchableOpacity 
            style={styles.quickBarBtn} 
            onPress={onOpenDigitalLibraries}
            activeOpacity={0.8}
          >
            <Ionicons name="library-outline" size={15} color="#12141A" />
            <Text style={styles.quickBarText}>Libraries</Text>
          </TouchableOpacity>
        )}

        {onOpenStats && (
          <TouchableOpacity 
            style={styles.quickBarBtn} 
            onPress={onOpenStats}
            activeOpacity={0.8}
          >
            <Ionicons name="stats-chart-outline" size={15} color="#12141A" />
            <Text style={styles.quickBarText}>My Devotion</Text>
          </TouchableOpacity>
        )}
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
                  <Text style={styles.artistRecInitial}>{artistName ? artistName.charAt(0) : 'W'}</Text>
                </View>
                <Text style={styles.artistRecName} numberOfLines={1}>{artistName}</Text>
                <View style={styles.artistRecPlayRow}>
                  <Ionicons name="play-circle" size={13} color="#12141A" />
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
          <Ionicons name="chevron-forward" size={18} color="#12141A" />
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
          <Ionicons name="search-outline" size={38} color="#9AA0AC" />
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
                      color="#FFFFFF" 
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
                      <Ionicons name="bookmark-outline" size={13} color="#12141A" />
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
    backgroundColor: '#F8F9FA'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  quickBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20
  },
  quickBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  quickBarText: {
    color: '#0F1115',
    fontSize: 12,
    fontWeight: '700'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12
  },
  sectionTitle: {
    color: '#0F1115',
    fontSize: 17,
    fontWeight: '800'
  },
  sectionSubtitle: {
    color: '#717886',
    fontSize: 12
  },
  moodScroll: {
    marginBottom: 24
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0F4',
    borderWidth: 1,
    borderColor: '#E2E6EC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6
  },
  activeMoodPill: {
    backgroundColor: '#12141A',
    borderColor: '#12141A'
  },
  moodText: {
    color: '#717886',
    fontSize: 12,
    fontWeight: '600'
  },
  activeMoodText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  tracksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  trackCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  activeTrackCard: {
    borderColor: '#12141A',
    backgroundColor: '#F1F3F7'
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
    backgroundColor: '#12141A',
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
    color: '#0F1115',
    fontSize: 13,
    fontWeight: '700'
  },
  cardArtist: {
    color: '#717886',
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
    backgroundColor: '#EEF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  recentItemCard: {
    width: 110,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  recentCover: {
    width: '100%',
    height: 94,
    borderRadius: 8,
    marginBottom: 6
  },
  recentTitle: {
    color: '#0F1115',
    fontSize: 12,
    fontWeight: '700'
  },
  recentArtist: {
    color: '#717886',
    fontSize: 10,
    marginTop: 2
  },
  searchYtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
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
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.20)'
  },
  searchYtCardTitle: {
    color: '#0F1115',
    fontSize: 13,
    fontWeight: '700'
  },
  searchYtCardSub: {
    color: '#717886',
    fontSize: 11,
    marginTop: 2
  },
  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  noResultsTitle: {
    color: '#0F1115',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center'
  },
  noResultsSub: {
    color: '#717886',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 16
  },
  searchYtBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8
  },
  searchYtBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  recommendedSection: {
    marginBottom: 20
  },
  artistRecCard: {
    width: 104,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  artistRecAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  artistRecInitial: {
    color: '#12141A',
    fontSize: 17,
    fontWeight: '800'
  },
  artistRecName: {
    color: '#0F1115',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6
  },
  artistRecPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0F4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4
  },
  artistRecPlayText: {
    color: '#12141A',
    fontSize: 10,
    fontWeight: '800'
  }
});
