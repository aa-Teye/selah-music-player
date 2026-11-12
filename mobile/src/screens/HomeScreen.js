import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScanStatusBanner from '../components/ScanStatusBanner';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

const HOME_SONG_LIMIT = 30;
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80';

/** "23 min left" / "1 h 5 min left" */
export function timeLeft(position, length) {
  const mins = Math.max(1, Math.round(Math.max(0, length - position) / 60));
  if (mins < 60) return `${mins} min left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min left` : `${h} h left`;
}

function HomeScreen({
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
  onOpenDigitalLibraries,
  onOpenLibrary,
  playlists = [],
  onPlayPlaylist,
  onOpenPlaylists,
  scanStatus,
  continueListening = []
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const filteredTracks = activeMood === 'all' 
    ? tracks 
    : tracks.filter(t => t.category === activeMood);

  // Songs most recently added to the phone
  const recentlyAdded = React.useMemo(
    () =>
      tracks
        .filter((t) => t.sourceType === 'local')
        .slice()
        .sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0))
        .slice(0, 12),
    [tracks]
  );

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
            <Ionicons name="library-outline" size={15} color={c.ink} />
            <Text style={styles.quickBarText}>Libraries</Text>
          </TouchableOpacity>
        )}

        {onOpenStats && (
          <TouchableOpacity 
            style={styles.quickBarBtn} 
            onPress={onOpenStats}
            activeOpacity={0.8}
          >
            <Ionicons name="stats-chart-outline" size={15} color={c.ink} />
            <Text style={styles.quickBarText}>My Devotion</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScanStatusBanner status={scanStatus} />

      {/* Continue listening: long songs and sermons you stopped part-way */}
      {continueListening.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue listening</Text>
            <Text style={styles.sectionSubtitle}>Pick up where you stopped</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {continueListening.map(({ track, position, length }) => {
              const isCurrent = currentTrack?.id === track.id;
              const progress = Math.min(1, Math.max(0, position / length));
              return (
                <TouchableOpacity
                  key={`continue-${track.id}`}
                  testID={`continue-${track.id}`}
                  style={styles.continueCard}
                  onPress={() => onPlayTrack(track)}
                  activeOpacity={0.8}
                  accessibilityLabel={`Continue ${track.title}, ${timeLeft(position, length)}`}
                >
                  <View>
                    <Image source={{ uri: track.coverUrl || FALLBACK_COVER }} style={styles.continueCover} />
                    <View style={styles.continuePlay}>
                      <Ionicons name={isCurrent && isPlaying ? 'volume-high' : 'play'} size={14} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.recentTitle} numberOfLines={1}>{track.title}</Text>
                  <Text style={styles.recentArtist} numberOfLines={1}>{timeLeft(position, length)}</Text>
                  <View style={styles.continueBar}>
                    <View style={[styles.continueBarFill, { width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
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

      {/* Your Playlists */}
      <View style={{ marginBottom: 20 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Playlists</Text>
          {onOpenPlaylists && (
            <TouchableOpacity onPress={onOpenPlaylists}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {playlists.map((pl) => {
            const count = (pl.trackIds || []).length;
            return (
              <TouchableOpacity
                key={`pl-${pl.id}`}
                style={styles.playlistCard}
                onPress={() => {
                  const plTracks = tracks.filter((t) => (pl.trackIds || []).includes(t.id));
                  if (plTracks.length > 0 && onPlayPlaylist) onPlayPlaylist(plTracks);
                  else if (onOpenPlaylists) onOpenPlaylists();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.playlistIcon}>
                  <Ionicons name="musical-notes" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.playlistName} numberOfLines={1}>{pl.name}</Text>
                <Text style={styles.playlistCount}>{count} song{count === 1 ? '' : 's'}</Text>
              </TouchableOpacity>
            );
          })}
          {onOpenPlaylists && (
            <TouchableOpacity style={[styles.playlistCard, styles.playlistNewCard]} onPress={onOpenPlaylists} activeOpacity={0.8}>
              <View style={[styles.playlistIcon, styles.playlistNewIcon]}>
                <Ionicons name="add" size={24} color={c.ink} />
              </View>
              <Text style={styles.playlistName} numberOfLines={2}>
                {playlists.length > 0 ? 'New playlist' : 'Create your first playlist'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Recently Added from the phone */}
      {recentlyAdded.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <Text style={styles.sectionSubtitle}>On your phone</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {recentlyAdded.map((item) => (
              <TouchableOpacity
                key={`added-${item.id}`}
                style={styles.recentItemCard}
                onPress={() => onPlayTrack(item)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }} style={styles.recentCover} />
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
          <Ionicons name="chevron-forward" size={18} color={c.ink} />
        </TouchableOpacity>
      ) : null}

      {/* Featured Tracks */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Your Songs'}
        </Text>
        <Text style={styles.sectionSubtitle}>{filteredTracks.length} available</Text>
      </View>

      {/* No local results empty state */}
      {tracks.length === 0 && !searchQuery ? (
        <View style={styles.noResultsBox}>
          <Ionicons name="musical-notes-outline" size={38} color={c.textFaint} />
          <Text style={styles.noResultsTitle}>No songs yet</Text>
          <Text style={styles.noResultsSub}>
            {Platform.OS === 'android'
              ? 'Selah finds all the music on your phone. Open My Songs to scan.'
              : 'Import songs from the Files app, or copy music into Files › On My iPhone › Selah.'}
          </Text>
          {onOpenLibrary && (
            <TouchableOpacity style={styles.searchYtBannerBtn} onPress={onOpenLibrary}>
              <Ionicons name="folder-open-outline" size={18} color={c.ink} />
              <Text style={styles.searchYtBannerBtnText}>Open My Songs</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : filteredTracks.length === 0 && searchQuery ? (
        <View style={styles.noResultsBox}>
          <Ionicons name="search-outline" size={38} color={c.textFaint} />
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
          {filteredTracks.slice(0, HOME_SONG_LIMIT).map((track) => {
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
                      <Ionicons name="bookmark-outline" size={13} color={c.ink} />
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
      {filteredTracks.length > HOME_SONG_LIMIT && onOpenLibrary && (
        <TouchableOpacity style={styles.seeAllBtn} onPress={onOpenLibrary} activeOpacity={0.8}>
          <Text style={styles.seeAllText}>See all {filteredTracks.length} in My Songs</Text>
        </TouchableOpacity>
      )}
      <View style={{ marginTop: 8 }}>
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
                    <Ionicons name="play-circle" size={13} color={c.ink} />
                    <Text style={styles.artistRecPlayText}>Listen</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  sectionLink: { color: c.ink, fontSize: 13, fontWeight: '800' },
  playlistCard: {
    width: 130,
    marginRight: 12,
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: 12
  },
  playlistNewCard: { backgroundColor: c.surfaceAlt, borderStyle: 'dashed' },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  playlistNewIcon: { backgroundColor: c.surfaceStrong },
  playlistName: { color: c.text, fontSize: 14, fontWeight: '800' },
  playlistCount: { color: c.textMuted, fontSize: 12, marginTop: 2 },
  seeAllBtn: {
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
    marginBottom: 24
  },
  seeAllText: { color: c.ink, fontWeight: '800', fontSize: 14 },
  container: {
    flex: 1,
    backgroundColor: c.bg
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
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
    color: c.text,
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
    color: c.text,
    fontSize: 17,
    fontWeight: '800',
    flexShrink: 0
  },
  sectionSubtitle: {
    color: c.textMuted,
    fontSize: 12,
    flexShrink: 1,
    marginLeft: 10,
    textAlign: 'right'
  },
  moodScroll: {
    marginBottom: 24
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6
  },
  activeMoodPill: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  moodText: {
    color: c.textMuted,
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
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  activeTrackCard: {
    borderColor: c.inverse,
    backgroundColor: c.surfaceAlt
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
    backgroundColor: c.inverse,
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
    color: c.text,
    fontSize: 13,
    fontWeight: '700'
  },
  cardArtist: {
    color: c.textMuted,
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
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  recentItemCard: {
    width: 110,
    marginRight: 12,
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: c.border,
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
  continueCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: c.border
  },
  continueCover: {
    width: '100%',
    height: 84,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: c.surfaceAlt
  },
  continuePlay: {
    position: 'absolute',
    right: 6,
    bottom: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  continueBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: c.surfaceStrong,
    overflow: 'hidden',
    marginTop: 6
  },
  continueBarFill: {
    height: '100%',
    backgroundColor: c.text
  },
  recentTitle: {
    color: c.text,
    fontSize: 12,
    fontWeight: '700'
  },
  recentArtist: {
    color: c.textMuted,
    fontSize: 10,
    marginTop: 2
  },
  searchYtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.border,
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
    color: c.text,
    fontSize: 13,
    fontWeight: '700'
  },
  searchYtCardSub: {
    color: c.textMuted,
    fontSize: 11,
    marginTop: 2
  },
  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 24,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: c.border
  },
  noResultsTitle: {
    color: c.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center'
  },
  noResultsSub: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 16
  },
  searchYtBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inverse,
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
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
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
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: c.border
  },
  artistRecInitial: {
    color: c.ink,
    fontSize: 17,
    fontWeight: '800'
  },
  artistRecName: {
    color: c.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6
  },
  artistRecPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4
  },
  artistRecPlayText: {
    color: c.ink,
    fontSize: 10,
    fontWeight: '800'
  }
});

export default React.memo(HomeScreen);
