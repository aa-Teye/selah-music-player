import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Image, 
  Dimensions, 
  Alert,
  ActivityIndicator,
  Keyboard,
  Share,
  Linking
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import YouTubeService, { extractVideoId, searchYouTube } from '../services/youtubeService';

const { width } = Dimensions.get('window');

const QUICK_SEARCH_CHIPS = [
  { id: 'curated', label: 'Curated Praise' },
  { id: 'brandon-lake', label: 'Brandon Lake', query: 'Brandon Lake Live Worship' },
  { id: 'cece-winans', label: 'CeCe Winans', query: 'CeCe Winans Goodness of God' },
  { id: 'maverick-city', label: 'Maverick City', query: 'Maverick City Music' },
  { id: 'dunsin-oyekan', label: 'Dunsin Oyekan', query: 'Dunsin Oyekan Worship' },
  { id: 'nathaniel-bassey', label: 'Nathaniel Bassey', query: 'Nathaniel Bassey Songs' },
  { id: 'hillsong', label: 'Hillsong', query: 'Hillsong Worship' },
  { id: 'elevation', label: 'Elevation Worship', query: 'Elevation Worship Live' },
  { id: 'instrumental-prayer', label: 'Prayer Piano', query: 'Instrumental Prayer Worship Piano' }
];

const DEFAULT_FEATURED = [
  {
    id: "yt-dQ3Cj8-7M3Y",
    title: "Gratitude (Live) - Brandon Lake",
    artist: "Brandon Lake",
    youtubeId: "dQ3Cj8-7M3Y",
    duration: 338,
    durationFormatted: "5:38",
    sourceType: "youtube",
    coverUrl: "https://img.youtube.com/vi/dQ3Cj8-7M3Y/hqdefault.jpg"
  },
  {
    id: "yt-6XX7d_jX6Z8",
    title: "Oceans (Where Feet May Fail) - Hillsong",
    artist: "Hillsong UNITED",
    youtubeId: "6XX7d_jX6Z8",
    duration: 536,
    durationFormatted: "8:56",
    sourceType: "youtube",
    coverUrl: "https://img.youtube.com/vi/6XX7d_jX6Z8/hqdefault.jpg"
  },
  {
    id: "yt-9sE5kEnitqE",
    title: "Goodness of God (Live) - CeCe Winans",
    artist: "CeCe Winans",
    youtubeId: "9sE5kEnitqE",
    duration: 298,
    durationFormatted: "4:58",
    sourceType: "youtube",
    coverUrl: "https://img.youtube.com/vi/9sE5kEnitqE/hqdefault.jpg"
  },
  {
    id: "yt-x0vQyN3jQbg",
    title: "House of the Lord - Phil Wickham",
    artist: "Phil Wickham",
    youtubeId: "x0vQyN3jQbg",
    duration: 255,
    durationFormatted: "4:15",
    sourceType: "youtube",
    coverUrl: "https://img.youtube.com/vi/x0vQyN3jQbg/hqdefault.jpg"
  },
  {
    id: "yt-1Xf_bT7qO_I",
    title: "Jireh - Elevation Worship & Maverick City",
    artist: "Elevation Worship",
    youtubeId: "1Xf_bT7qO_I",
    duration: 599,
    durationFormatted: "9:59",
    sourceType: "youtube",
    coverUrl: "https://img.youtube.com/vi/1Xf_bT7qO_I/hqdefault.jpg"
  }
];

export default function YouTubeWatchScreen({
  currentTrack,
  isPlaying,
  searchQuery = '',
  onPlayTrack,
  onAddYouTubeTrack,
  onOpenAddToPlaylist
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [activeChip, setActiveChip] = useState('curated');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [playMode, setPlayMode] = useState('video'); // 'video' | 'mp3'
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const scrollRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Synchronize when global searchQuery prop updates from TopHeader
  useEffect(() => {
    if (searchQuery && searchQuery.trim() !== localSearch) {
      setLocalSearch(searchQuery);
      performSearch(searchQuery);
    }
  }, [searchQuery]);

  // Execute direct YouTube Search
  const performSearch = async (term) => {
    const q = (term || '').trim();
    if (!q) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setHasSearched(true);
      const results = await searchYouTube(q, 20);
      setSearchResults(results);
    } catch (err) {
      console.error('YouTube search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    performSearch(localSearch);
  };

  const handleChipSelect = (chip) => {
    setActiveChip(chip.id);
    if (chip.id === 'curated') {
      setLocalSearch('');
      setSearchResults([]);
      setHasSearched(false);
    } else {
      setLocalSearch(chip.query);
      performSearch(chip.query);
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    setSearchResults([]);
    setHasSearched(false);
    setActiveChip('curated');
  };

  // Play a YouTube item and shift it to the TOP player
  const handleSelectVideo = (item) => {
    if (onAddYouTubeTrack) {
      onAddYouTubeTrack(item);
    }
    if (onPlayTrack) {
      onPlayTrack(item);
    }
    // Scroll directly up to the top player so user sees it playing immediately
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // Load custom URL or direct ID
  const handleLoadCustom = () => {
    const vidId = extractVideoId(inputUrl);
    if (!vidId) {
      Alert.alert("Invalid Link", "Please paste a valid YouTube video URL or 11-character video ID.");
      return;
    }

    const newTrack = {
      id: `yt-custom-${Date.now()}`,
      title: videoTitle.trim() || `YouTube Stream (${vidId})`,
      artist: "YouTube Video",
      album: "YouTube Watch",
      duration: 300,
      durationFormatted: "5:00",
      sourceType: "youtube",
      youtubeId: vidId,
      coverUrl: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
      lyrics: `[Streaming from YouTube: ${vidId}]`
    };

    handleSelectVideo(newTrack);
    setInputUrl('');
    setVideoTitle('');
    setIsCustomExpanded(false);
  };

  const handleShareVideo = (item) => {
    if (!item?.youtubeId) return;
    Share.share({
      message: `Listen to "${item.title}" on Selah Player: https://www.youtube.com/watch?v=${item.youtubeId}`
    });
  };

  // Determine current active YouTube ID
  const currentYtId = currentTrack?.sourceType === 'youtube' && currentTrack?.youtubeId 
    ? currentTrack.youtubeId 
    : (DEFAULT_FEATURED[0]?.youtubeId || 'dQ3Cj8-7M3Y');

  // Video list to display: search results if searched, otherwise default featured
  const displayVideos = hasSearched ? searchResults : DEFAULT_FEATURED;

  const activeVideoTitle = currentTrack?.sourceType === 'youtube' 
    ? currentTrack.title 
    : "Gratitude (Live) - Brandon Lake";
  const activeVideoArtist = currentTrack?.sourceType === 'youtube' 
    ? currentTrack.artist 
    : "Brandon Lake";

  return (
    <ScrollView 
      ref={scrollRef}
      style={styles.container} 
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. TOP HERO PLAYER AREA ─────────────────────────────────── */}
      <View style={styles.heroPlayerSection}>
        {/* Mode Switcher: Video vs MP3 Mode */}
        <View style={styles.modeSwitchRow}>
          <View style={styles.modeTabs}>
            <TouchableOpacity 
              style={[styles.modeTab, playMode === 'video' && styles.modeTabActive]}
              onPress={() => setPlayMode('video')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="videocam" 
                size={14} 
                color={playMode === 'video' ? '#0A0D14' : '#9CA3AF'} 
              />
              <Text style={[styles.modeTabText, playMode === 'video' && styles.modeTabTextActive]}>
                Video Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modeTab, playMode === 'mp3' && styles.modeTabActive]}
              onPress={() => setPlayMode('mp3')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="musical-notes" 
                size={14} 
                color={playMode === 'mp3' ? '#0A0D14' : '#9CA3AF'} 
              />
              <Text style={[styles.modeTabText, playMode === 'mp3' && styles.modeTabTextActive]}>
                Play as MP3
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.complianceBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#10B981" />
            <Text style={styles.complianceText}>Official YouTube Player</Text>
          </View>
        </View>

        {/* ── Single Persistent YouTube Player Container ── */}
        <View style={styles.playerContainer}>
          {/* Main YouTube Iframe Player (always kept mounted so audio stream is never interrupted when toggling modes) */}
          <View 
            style={
              playMode === 'video' 
                ? styles.videoPlayerCard 
                : styles.hiddenVideoCard
            }
          >
            <YoutubePlayer
              height={playMode === 'video' ? (width - 32) * (9 / 16) : 1}
              play={isPlaying && (currentTrack?.sourceType === 'youtube' || !currentTrack)}
              videoId={currentYtId}
              onChangeState={(state) => {
                if (state === 'ended') {
                  const curIdx = displayVideos.findIndex(v => (v.youtubeId || v.id) === currentYtId);
                  if (curIdx !== -1 && curIdx < displayVideos.length - 1) {
                    handleSelectVideo(displayVideos[curIdx + 1]);
                  } else if (displayVideos.length > 0) {
                    handleSelectVideo(displayVideos[0]);
                  }
                }
              }}
              webViewProps={{
                allowsFullscreenVideo: true,
                androidLayerType: 'hardware',
                scrollEnabled: false
              }}
            />
          </View>

          {/* MP3 Audio Stream Visualizer (displayed in Play as MP3 mode without interrupting playback) */}
          {playMode === 'mp3' && (
            <View style={styles.mp3PlayerCard}>
              <View style={styles.mp3DiscWrap}>
                <Image 
                  source={{ uri: currentTrack?.coverUrl || `https://img.youtube.com/vi/${currentYtId}/hqdefault.jpg` }} 
                  style={styles.mp3DiscImage}
                />
                <View style={styles.mp3CenterSpindle} />
              </View>

              <View style={styles.mp3Info}>
                <View style={styles.mp3Badge}>
                  <Ionicons name="radio" size={13} color="#E0B86C" />
                  <Text style={styles.mp3BadgeText}>STREAMING AS MP3 AUDIO</Text>
                </View>
                <Text style={styles.mp3Title} numberOfLines={1}>{activeVideoTitle}</Text>
                <Text style={styles.mp3Artist} numberOfLines={1}>{activeVideoArtist}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Now Playing Info Bar */}
        <View style={styles.playingBar}>
          <View style={styles.playingBarLeft}>
            <View style={styles.livePulseDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.playingTitle} numberOfLines={1}>{activeVideoTitle}</Text>
              <Text style={styles.playingArtist} numberOfLines={1}>{activeVideoArtist}</Text>
            </View>
          </View>

          <View style={styles.playingActions}>
            {onOpenAddToPlaylist && (
              <TouchableOpacity 
                style={styles.actionIconBtn}
                onPress={() => onOpenAddToPlaylist(currentTrack || DEFAULT_FEATURED[0])}
                title="Add to Playlist"
              >
                <Ionicons name="bookmark-outline" size={18} color="#E0B86C" />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.actionIconBtn}
              onPress={() => handleShareVideo(currentTrack || DEFAULT_FEATURED[0])}
              title="Share"
            >
              <Ionicons name="share-social-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionIconBtn}
              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${currentYtId}`)}
              title="Watch on YouTube App"
            >
              <Ionicons name="logo-youtube" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── 2. SEARCH BAR & QUICK CHIPS ─────────────────────────────── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            placeholder="Search YouTube worship, praise, songs..."
            placeholderTextColor="#6B7280"
            value={localSearch}
            onChangeText={(text) => {
              setLocalSearch(text);
              if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
              searchTimeoutRef.current = setTimeout(() => {
                if (text.trim().length >= 2) {
                  performSearch(text);
                } else if (!text.trim()) {
                  handleClearSearch();
                }
              }, 600);
            }}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color="#E0B86C" style={{ marginRight: 6 }} />
          ) : localSearch ? (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity 
            style={styles.searchGoBtn} 
            onPress={handleSearchSubmit}
            disabled={isSearching}
          >
            <Ionicons name="arrow-forward" size={16} color="#0C0D11" />
          </TouchableOpacity>
        </View>

        {/* Quick Search Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {QUICK_SEARCH_CHIPS.map((chip) => {
            const isChipActive = activeChip === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.chip, isChipActive && styles.chipActive]}
                onPress={() => handleChipSelect(chip)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isChipActive && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 3. RESULTS & UP NEXT SONGS (DIRECTLY BELOW PLAYING VIDEO) ─ */}
      <View style={styles.resultsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {hasSearched ? `Search Results (${displayVideos.length})` : 'Curated Songs & Up Next'}
          </Text>
          <Text style={styles.sectionSubtitle}>Tap any song to play at top</Text>
        </View>

        {isSearching && displayVideos.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#E0B86C" />
            <Text style={styles.loadingText}>Searching YouTube live...</Text>
          </View>
        ) : displayVideos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="musical-notes-outline" size={36} color="#6B7280" />
            <Text style={styles.emptyTitle}>No songs found for "{localSearch}"</Text>
            <Text style={styles.emptySub}>Try searching an artist like "Brandon Lake" or "CeCe Winans"</Text>
          </View>
        ) : (
          <View style={styles.videoList}>
            {displayVideos.map((video, idx) => {
              const isSelected = currentTrack?.youtubeId === video.youtubeId || (!currentTrack && idx === 0);
              return (
                <TouchableOpacity
                  key={`yt-${video.youtubeId || video.id}-${idx}`}
                  style={[styles.videoCard, isSelected && styles.videoCardSelected]}
                  onPress={() => handleSelectVideo(video)}
                  activeOpacity={0.8}
                >
                  {/* Thumbnail with duration badge */}
                  <View style={styles.thumbWrapper}>
                    <Image 
                      source={{ uri: video.coverUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg` }}
                      style={styles.thumbImage}
                    />
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{video.durationFormatted || 'Music'}</Text>
                    </View>
                    {isSelected && isPlaying && (
                      <View style={styles.playingOverlay}>
                        <Ionicons name="volume-high" size={20} color="#E0B86C" />
                      </View>
                    )}
                  </View>

                  {/* Video Details */}
                  <View style={styles.videoDetails}>
                    <Text style={[styles.videoTitle, isSelected && styles.videoTitleSelected]} numberOfLines={2}>
                      {video.title}
                    </Text>
                    <Text style={styles.videoArtist} numberOfLines={1}>
                      {video.artist || 'YouTube Music'}
                    </Text>
                    {isSelected && (
                      <View style={styles.nowPlayingTag}>
                        <View style={styles.greenPulse} />
                        <Text style={styles.nowPlayingTagText}>PLAYING AT TOP</Text>
                      </View>
                    )}
                  </View>

                  {/* Play Action Icon */}
                  <View style={styles.cardPlayBtn}>
                    <Ionicons 
                      name={isSelected && isPlaying ? "pause-circle" : "play-circle"} 
                      size={28} 
                      color={isSelected ? "#E0B86C" : "#6B7280"} 
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* ── 4. CUSTOM YOUTUBE LINK / ID COLLAPSIBLE ─────────────────── */}
      <View style={styles.customSection}>
        <TouchableOpacity 
          style={styles.customHeader}
          onPress={() => setIsCustomExpanded(!isCustomExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.customHeaderLeft}>
            <Ionicons name="link-outline" size={18} color="#E0B86C" />
            <Text style={styles.customHeaderText}>Paste Direct YouTube Link or ID</Text>
          </View>
          <Ionicons 
            name={isCustomExpanded ? "chevron-up" : "chevron-down"} 
            size={18} 
            color="#9CA3AF" 
          />
        </TouchableOpacity>

        {isCustomExpanded && (
          <View style={styles.customBody}>
            <TextInput
              style={styles.customInput}
              placeholder="e.g. https://www.youtube.com/watch?v=dQ3Cj8-7M3Y"
              placeholderTextColor="#6B7280"
              value={inputUrl}
              onChangeText={setInputUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.customInput}
              placeholder="Song title (optional)"
              placeholderTextColor="#6B7280"
              value={videoTitle}
              onChangeText={setVideoTitle}
            />
            <TouchableOpacity 
              style={[styles.loadBtn, !inputUrl.trim() && styles.btnDisabled]} 
              onPress={handleLoadCustom}
              disabled={!inputUrl.trim()}
            >
              <Ionicons name="play" size={16} color="#0C0D11" />
              <Text style={styles.loadBtnText}>Load &amp; Play at Top</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0D11'
  },
  content: {
    paddingBottom: 120
  },

  /* Hero Player */
  heroPlayerSection: {
    backgroundColor: '#101117',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)'
  },
  modeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#161822',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4
  },
  modeTabActive: {
    backgroundColor: '#E0B86C'
  },
  modeTabText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700'
  },
  modeTabTextActive: {
    color: '#0C0D11'
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  complianceText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600'
  },
  playerContainer: {
    position: 'relative',
    width: '100%'
  },
  videoPlayerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(224, 184, 108, 0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8
  },
  hiddenVideoCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0.01,
    overflow: 'hidden'
  },
  mp3PlayerCard: {
    height: (width - 32) * (9 / 16),
    backgroundColor: '#14161E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(224, 184, 108, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden'
  },
  hiddenPlayerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0.01,
    overflow: 'hidden'
  },
  mp3DiscWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0C0D11',
    borderWidth: 2,
    borderColor: '#E0B86C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  mp3DiscImage: {
    width: 80,
    height: 80,
    borderRadius: 40
  },
  mp3CenterSpindle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0C0D11',
    borderWidth: 2,
    borderColor: '#E0B86C'
  },
  mp3Info: {
    flex: 1
  },
  mp3Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6
  },
  mp3BadgeText: {
    fontSize: 9,
    color: '#E0B86C',
    fontWeight: '800',
    letterSpacing: 0.8
  },
  mp3Title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4
  },
  mp3Artist: {
    fontSize: 13,
    color: '#9CA3AF'
  },
  playingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10
  },
  playingBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  playingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  playingArtist: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  playingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1C1E28',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },

  /* Search & Chips */
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14161E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    height: 44
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    height: '100%'
  },
  clearBtn: {
    padding: 4
  },
  searchGoBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E0B86C',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6
  },
  chipsScroll: {
    marginTop: 10
  },
  chip: {
    backgroundColor: '#161822',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 8
  },
  chipActive: {
    backgroundColor: '#1E202C',
    borderColor: '#E0B86C'
  },
  chipText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#E0B86C',
    fontWeight: '800'
  },

  /* Results / Up Next */
  resultsSection: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#6B7280'
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 30
  },
  loadingText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 10
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 35
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D1D5DB',
    marginTop: 10
  },
  emptySub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
  videoList: {
    gap: 8
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14161E',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  videoCardSelected: {
    borderColor: '#E0B86C',
    backgroundColor: 'rgba(224, 184, 108, 0.06)'
  },
  thumbWrapper: {
    width: 90,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000'
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  durationBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4
  },
  durationText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700'
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  videoDetails: {
    flex: 1,
    paddingHorizontal: 10
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 17
  },
  videoTitleSelected: {
    color: '#E0B86C'
  },
  videoArtist: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3
  },
  nowPlayingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  nowPlayingTagText: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '800',
    letterSpacing: 0.5
  },
  cardPlayBtn: {
    paddingHorizontal: 4
  },

  /* Custom Link Section */
  customSection: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#14161E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden'
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14
  },
  customHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  customHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  customBody: {
    padding: 14,
    paddingTop: 0,
    gap: 10
  },
  customInput: {
    backgroundColor: '#181A23',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  loadBtn: {
    backgroundColor: '#E0B86C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6
  },
  loadBtnText: {
    color: '#0C0D11',
    fontSize: 13,
    fontWeight: '800'
  },
  btnDisabled: {
    opacity: 0.5
  }
});
