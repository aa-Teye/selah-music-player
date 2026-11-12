import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlayerPanel from '../components/PlayerPanel';

const { width } = Dimensions.get('window');

const PLAYER_CATEGORIES = [
  { id: 'suggested', label: 'Suggested', icon: 'star' },
  { id: 'songs', label: 'Songs', icon: 'musical-notes' },
  { id: 'albums', label: 'Albums', icon: 'disc' },
  { id: 'artists', label: 'Artists', icon: 'people' },
  { id: 'playlists', label: 'Playlists', icon: 'albums' },
  { id: 'folders', label: 'Folders', icon: 'folder' },
  { id: 'genres', label: 'Genres', icon: 'options' }
];

function LibraryBrowser({
  tracks = [],
  localTracks = [],
  recentTracks = [],
  favorites = [],
  playlists = [],
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenFullPlayer,
  onOpenAddToPlaylist
}) {
  const [activeCategory, setActiveCategory] = useState('suggested');

  // Combined tracks pool
  const allTracks = useMemo(() => {
    const map = new Map();
    tracks.forEach((t) => map.set(t.id, t));
    localTracks.forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [tracks, localTracks]);

  // Last Added tracks: sort by scan/added time or reverse order
  const lastAddedTracks = useMemo(() => {
    const list = [...allTracks];
    list.sort((a, b) => {
      const timeA = Number(a.scannedAt || a.addedAt || 0);
      const timeB = Number(b.scannedAt || b.addedAt || 0);
      if (timeA && timeB) return timeB - timeA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
    return list.slice(0, 20);
  }, [allTracks]);

  // Most Played: simulate/sort based on play count or listening stats
  const mostPlayedTracks = useMemo(() => {
    return [...allTracks]
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 15);
  }, [allTracks]);

  // Favorite tracks
  const favoriteTracks = useMemo(() => {
    return allTracks.filter((t) => favorites.includes(t.id));
  }, [allTracks, favorites]);

  // Grouped by Album
  const albums = useMemo(() => {
    const map = {};
    allTracks.forEach((t) => {
      const alb = t.album || 'Single & Worship Tracks';
      if (!map[alb]) map[alb] = [];
      map[alb].push(t);
    });
    return Object.entries(map).map(([name, items]) => ({
      name,
      count: items.length,
      coverUrl: items[0]?.coverUrl,
      tracks: items
    }));
  }, [allTracks]);

  // Grouped by Artist
  const artists = useMemo(() => {
    const map = {};
    allTracks.forEach((t) => {
      const art = t.artist || 'Unknown Artist';
      if (!map[art]) map[art] = [];
      map[art].push(t);
    });
    return Object.entries(map).map(([name, items]) => ({
      name,
      count: items.length,
      coverUrl: items[0]?.coverUrl,
      tracks: items
    }));
  }, [allTracks]);

  // Grouped by Folder
  const folders = useMemo(() => {
    const map = {};
    allTracks.forEach((t) => {
      const f = t.folder || 'Internal Audio';
      if (!map[f]) map[f] = [];
      map[f].push(t);
    });
    return Object.entries(map).map(([name, items]) => ({
      name,
      count: items.length,
      tracks: items
    }));
  }, [allTracks]);

  // Grouped by Genre / Category
  const genres = useMemo(() => {
    const map = {};
    allTracks.forEach((t) => {
      const g = t.category || 'Worship';
      if (!map[g]) map[g] = [];
      map[g].push(t);
    });
    return Object.entries(map).map(([name, items]) => ({
      name: name.toUpperCase(),
      count: items.length,
      coverUrl: items[0]?.coverUrl,
      tracks: items
    }));
  }, [allTracks]);

  // Helper track renderer
  const renderTrackItem = (track, index) => {
    const isCurrent = currentTrack?.id === track.id;
    return (
      <TouchableOpacity
        key={`${track.id}-${index}`}
        style={[styles.trackRow, isCurrent && styles.activeTrackRow]}
        onPress={() => onPlayTrack(track)}
        activeOpacity={0.75}
      >
        <Image
          source={{
            uri:
              track.coverUrl ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
          }}
          style={styles.trackThumb}
        />
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isCurrent && styles.activeTrackText]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {track.artist || 'Unknown Artist'} • {track.durationFormatted || '3:30'}
          </Text>
        </View>

        {track.sourceType === 'youtube' && (
          <View style={styles.ytBadge}>
            <Ionicons name="logo-youtube" size={12} color="#EF4444" />
          </View>
        )}

        <View style={styles.playIconCircle}>
          <Ionicons
            name={isCurrent && isPlaying ? 'pause' : 'play'}
            size={14}
            color="#FFFFFF"
          />
        </View>

        {onOpenAddToPlaylist && (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={(e) => {
              e.stopPropagation();
              onOpenAddToPlaylist(track);
            }}
          >
            <Ionicons name="bookmark-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Category Pills Header */}
      <View style={styles.categoryBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {PLAYER_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.activeCategoryPill]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isActive ? '#FFFFFF' : '#717886'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.categoryText, isActive && styles.activeCategoryText]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Now Playing Mini-Hero Card */}
        {currentTrack && (
          <TouchableOpacity
            style={styles.nowPlayingHero}
            onPress={onOpenFullPlayer}
            activeOpacity={0.9}
          >
            <Image
              source={{
                uri:
                  currentTrack.coverUrl ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'
              }}
              style={styles.heroCover}
            />
            <View style={styles.heroDetails}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.livePulse} />
                <Text style={styles.heroBadgeText}>NOW PLAYING</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.heroArtist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
              <Text style={styles.heroHint}>Tap to open full player &amp; lyrics ↗</Text>
            </View>

            <View style={styles.heroActionBtn}>
              <Ionicons
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={38}
                color="#12141A"
              />
            </View>
          </TouchableOpacity>
        )}

        {/* ── 1. SUGGESTED VIEW ────────────────────────────────────── */}
        {activeCategory === 'suggested' && (
          <View>
            {/* Recently Played */}
            {recentTracks && recentTracks.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recently Played</Text>
                  <Text style={styles.sectionCount}>{recentTracks.length} tracks</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {recentTracks.slice(0, 10).map((t) => (
                    <TouchableOpacity
                      key={`rec-${t.id}`}
                      style={styles.recentCard}
                      onPress={() => onPlayTrack(t)}
                    >
                      <Image source={{ uri: t.coverUrl }} style={styles.recentImg} />
                      <Text style={styles.recentCardTitle} numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text style={styles.recentCardArtist} numberOfLines={1}>
                        {t.artist}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Most Played */}
            {mostPlayedTracks.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Most Played</Text>
                  <Text style={styles.sectionCount}>Top frequency</Text>
                </View>
                {mostPlayedTracks.slice(0, 5).map((t, idx) => renderTrackItem(t, idx))}
              </View>
            )}

            {/* Favorites */}
            {favoriteTracks.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Favorites &amp; Bookmarks</Text>
                  <Text style={styles.sectionCount}>{favoriteTracks.length} saved</Text>
                </View>
                {favoriteTracks.slice(0, 5).map((t, idx) => renderTrackItem(t, idx))}
              </View>
            )}

            {/* Last Added */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Last Added</Text>
                <Text style={styles.sectionCount}>{lastAddedTracks.length} tracks</Text>
              </View>
              {lastAddedTracks.map((t, idx) => renderTrackItem(t, idx))}
            </View>
          </View>
        )}

        {/* ── 2. SONGS VIEW ────────────────────────────────────────── */}
        {activeCategory === 'songs' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Songs</Text>
              <Text style={styles.sectionCount}>{allTracks.length} tracks available</Text>
            </View>
            {allTracks.map((t, idx) => renderTrackItem(t, idx))}
          </View>
        )}

        {/* ── 3. ALBUMS VIEW ───────────────────────────────────────── */}
        {activeCategory === 'albums' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Albums</Text>
              <Text style={styles.sectionCount}>{albums.length} albums</Text>
            </View>
            <View style={styles.gridContainer}>
              {albums.map((alb) => (
                <TouchableOpacity
                  key={alb.name}
                  style={styles.gridCard}
                  onPress={() => alb.tracks[0] && onPlayTrack(alb.tracks[0])}
                >
                  <Image source={{ uri: alb.coverUrl }} style={styles.gridCover} />
                  <Text style={styles.gridTitle} numberOfLines={1}>
                    {alb.name}
                  </Text>
                  <Text style={styles.gridSub}>{alb.count} tracks</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── 4. ARTISTS VIEW ──────────────────────────────────────── */}
        {activeCategory === 'artists' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Artists</Text>
              <Text style={styles.sectionCount}>{artists.length} artists</Text>
            </View>
            {artists.map((art) => (
              <TouchableOpacity
                key={art.name}
                style={styles.artistRow}
                onPress={() => art.tracks[0] && onPlayTrack(art.tracks[0])}
              >
                <Image source={{ uri: art.coverUrl }} style={styles.artistAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.artistName}>{art.name}</Text>
                  <Text style={styles.artistSub}>{art.count} songs</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── 5. PLAYLISTS VIEW ────────────────────────────────────── */}
        {activeCategory === 'playlists' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Playlists</Text>
              <Text style={styles.sectionCount}>{playlists.length} custom playlists</Text>
            </View>
            {playlists.map((pl) => (
              <View key={pl.id} style={styles.playlistRow}>
                <View style={styles.playlistIcon}>
                  <Ionicons name="musical-notes" size={20} color="#12141A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playlistName}>{pl.name}</Text>
                  <Text style={styles.playlistCount}>
                    {(pl.trackIds || []).length} tracks • Created{' '}
                    {new Date(pl.createdAt || Date.now()).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── 6. FOLDERS VIEW ──────────────────────────────────────── */}
        {activeCategory === 'folders' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Storage Folders</Text>
              <Text style={styles.sectionCount}>{folders.length} folders</Text>
            </View>
            {folders.map((fld) => (
              <TouchableOpacity
                key={fld.name}
                style={styles.folderRow}
                onPress={() => fld.tracks[0] && onPlayTrack(fld.tracks[0])}
              >
                <Ionicons name="folder-outline" size={24} color="#12141A" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.folderName}>{fld.name}</Text>
                  <Text style={styles.folderCount}>{fld.count} audio tracks</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#717886" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── 7. GENRES VIEW ───────────────────────────────────────── */}
        {activeCategory === 'genres' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Genres &amp; Atmospheres</Text>
              <Text style={styles.sectionCount}>{genres.length} genres</Text>
            </View>
            <View style={styles.gridContainer}>
              {genres.map((gn) => (
                <TouchableOpacity
                  key={gn.name}
                  style={styles.gridCard}
                  onPress={() => gn.tracks[0] && onPlayTrack(gn.tracks[0])}
                >
                  <Image source={{ uri: gn.coverUrl }} style={styles.gridCover} />
                  <Text style={styles.gridTitle} numberOfLines={1}>
                    {gn.name}
                  </Text>
                  <Text style={styles.gridSub}>{gn.count} songs</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  categoryBarWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0F4',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  activeCategoryPill: {
    backgroundColor: '#12141A',
    borderColor: '#12141A'
  },
  categoryText: {
    color: '#717886',
    fontSize: 12,
    fontWeight: '700'
  },
  activeCategoryText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  scrollBody: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  nowPlayingHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  heroCover: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12
  },
  heroDetails: {
    flex: 1
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  heroBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  heroTitle: {
    color: '#0F1115',
    fontSize: 14,
    fontWeight: '800'
  },
  heroArtist: {
    color: '#717886',
    fontSize: 12,
    marginTop: 1
  },
  heroHint: {
    color: '#9AA0AC',
    fontSize: 10,
    marginTop: 3
  },
  heroActionBtn: {
    paddingLeft: 8
  },
  sectionWrap: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12
  },
  sectionTitle: {
    color: '#0F1115',
    fontSize: 16,
    fontWeight: '800'
  },
  sectionCount: {
    color: '#717886',
    fontSize: 12
  },
  recentCard: {
    width: 110,
    marginRight: 12
  },
  recentImg: {
    width: 110,
    height: 110,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#EEF0F4'
  },
  recentCardTitle: {
    color: '#0F1115',
    fontSize: 12,
    fontWeight: '700'
  },
  recentCardArtist: {
    color: '#717886',
    fontSize: 10,
    marginTop: 1
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  activeTrackRow: {
    borderColor: '#12141A',
    backgroundColor: '#F1F3F7'
  },
  trackThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#EEF0F4'
  },
  trackInfo: {
    flex: 1
  },
  trackTitle: {
    color: '#0F1115',
    fontSize: 13,
    fontWeight: '700'
  },
  activeTrackText: {
    color: '#0F1115',
    fontWeight: '800'
  },
  trackArtist: {
    color: '#717886',
    fontSize: 11,
    marginTop: 2
  },
  ytBadge: {
    marginRight: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 4,
    borderRadius: 6
  },
  playIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#12141A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  moreBtn: {
    padding: 6,
    marginLeft: 4
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  gridCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  gridCover: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#EEF0F4'
  },
  gridTitle: {
    color: '#0F1115',
    fontSize: 13,
    fontWeight: '700'
  },
  gridSub: {
    color: '#717886',
    fontSize: 11,
    marginTop: 2
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  artistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#EEF0F4',
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  artistName: {
    color: '#0F1115',
    fontSize: 14,
    fontWeight: '700'
  },
  artistSub: {
    color: '#717886',
    fontSize: 11,
    marginTop: 2
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  playlistIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EEF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  playlistName: {
    color: '#0F1115',
    fontSize: 14,
    fontWeight: '700'
  },
  playlistCount: {
    color: '#717886',
    fontSize: 11,
    marginTop: 2
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  folderName: {
    color: '#0F1115',
    fontSize: 14,
    fontWeight: '700'
  },
  folderCount: {
    color: '#717886',
    fontSize: 11,
    marginTop: 2
  }
});

const PLAYER_VIEWS = [
  { id: 'now', label: 'Now Playing', icon: 'disc' },
  { id: 'lyrics', label: 'Lyrics', icon: 'text' },
  { id: 'queue', label: 'Up Next', icon: 'list' },
  { id: 'library', label: 'Library', icon: 'library' }
];

/**
 * Player tab: Now Playing, Lyrics and Up Next (the full player) plus the Library browser.
 */
export default function PlayerScreen(props) {
  const { view = 'now', onChangeView } = props;
  return (
    <View style={viewStyles.container}>
      <View style={viewStyles.segmentWrap}>
        <View style={viewStyles.segments}>
          {PLAYER_VIEWS.map((v) => {
            const active = view === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                style={[viewStyles.segment, active && viewStyles.segmentActive]}
                onPress={() => onChangeView && onChangeView(v.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={v.icon} size={14} color={active ? '#FFFFFF' : '#717886'} />
                <Text style={[viewStyles.segmentText, active && viewStyles.segmentTextActive]} numberOfLines={1}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {view === 'library' ? (
        <LibraryBrowser {...props} onOpenFullPlayer={() => onChangeView && onChangeView('now')} />
      ) : (
        <PlayerPanel {...props} view={view} onChangeView={onChangeView} />
      )}
    </View>
  );
}

const viewStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  segmentWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  segments: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F4',
    borderRadius: 22,
    padding: 3
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 19
  },
  segmentActive: { backgroundColor: '#12141A' },
  segmentText: { color: '#717886', fontSize: 12, fontWeight: '800' },
  segmentTextActive: { color: '#FFFFFF' }
});
