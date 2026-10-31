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
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import YouTubeService, { extractVideoId, searchYouTube } from '../services/youtubeService';

const { width } = Dimensions.get('window');

const QUICK_SEARCH_CHIPS = [
  { id: 'curated', label: 'Curated' },
  { id: 'brandon-lake', label: 'Brandon Lake', query: 'Brandon Lake Live Worship' },
  { id: 'cece-winans', label: 'CeCe Winans', query: 'CeCe Winans Goodness of God' },
  { id: 'dunsin-oyekan', label: 'Dunsin Oyekan', query: 'Dunsin Oyekan Worship' },
  { id: 'nathaniel-bassey', label: 'Nathaniel Bassey', query: 'Nathaniel Bassey Songs' },
  { id: 'maverick-city', label: 'Maverick City', query: 'Maverick City Music' },
  { id: 'hillsong', label: 'Hillsong', query: 'Hillsong Worship' },
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
  }
];

export default function YouTubeWatchScreen({
  currentTrack,
  isPlaying,
  searchQuery = '',
  onPlayTrack,
  onAddYouTubeTrack
}) {
  const [inputUrl, setInputUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [activeChip, setActiveChip] = useState('curated');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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

  // Play a YouTube item
  const handleSelectVideo = (item) => {
    if (onAddYouTubeTrack) {
      onAddYouTubeTrack(item);
    }
    if (onPlayTrack) {
      onPlayTrack(item);
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
  };

  const currentYtId = currentTrack?.sourceType === 'youtube' && currentTrack?.youtubeId 
    ? currentTrack.youtubeId 
    : 'dQ3Cj8-7M3Y';

  // Video list to display: search results if searched, otherwise default featured
  const displayVideos = hasSearched ? searchResults : DEFAULT_FEATURED;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header & Compliance Badge */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="logo-youtube" size={24} color="#EF4444" />
          <Text style={styles.title}>YouTube Watch &amp; Stream</Text>
        </View>
        <View style={styles.complianceBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#10B981" />
          <Text style={styles.complianceText}>Play Store &amp; ToS Compliant</Text>
        </View>
      </View>

      {/* Embedded YouTube Player */}
      <View style={styles.playerWrapper}>
        <YoutubePlayer
          height={(width - 32) * (9 / 16)}
          play={isPlaying && currentTrack?.sourceType === 'youtube'}
          videoId={currentYtId}
          webViewProps={{
            allowsFullscreenVideo: true
          }}
        />
      </View>

      {/* Now Playing Title */}
      {currentTrack && currentTrack.sourceType === 'youtube' && (
        <View style={styles.trackDetailsCard}>
          <View style={styles.trackDetailsLeft}>
            <View style={styles.nowPlayingDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.trackTitleText} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.trackArtistText} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
          </View>
          <View style={styles.ytIdTag}>
            <Ionicons name="logo-youtube" size={12} color="#EF4444" />
            <Text style={styles.ytIdText}>{currentTrack.youtubeId}</Text>
          </View>
        </View>
      )}

      {/* Direct YouTube Live Search Bar */}
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Search YouTube Live</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            placeholder="Search any song, artist, praise or hymn on YouTube..."
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
            <ActivityIndicator size="small" color="#E5A93C" style={{ marginRight: 6 }} />
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
            <Ionicons name="arrow-forward" size={16} color="#0A0D14" />
          </TouchableOpacity>
        </View>

        {/* Quick Search Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {QUICK_SEARCH_CHIPS.map((chip) => {
            const isChipActive = activeChip === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.chipPill, isChipActive && styles.activeChipPill]}
                onPress={() => handleChipSelect(chip)}
              >
                <Text style={[styles.chipText, isChipActive && styles.activeChipText]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Custom Link / Video ID Section */}
      <View style={styles.inputCard}>
        <View style={styles.inputCardHeader}>
          <Ionicons name="link-outline" size={18} color="#E5A93C" />
          <Text style={styles.inputCardTitle}>Paste YouTube Link or Video ID</Text>
        </View>
        <TextInput
          placeholder="Paste URL (e.g. youtu.be/... or ID)"
          placeholderTextColor="#6B7280"
          value={inputUrl}
          onChangeText={setInputUrl}
          style={styles.textInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          placeholder="Optional Title (e.g. Sunday Service Worship)"
          placeholderTextColor="#6B7280"
          value={videoTitle}
          onChangeText={setVideoTitle}
          style={[styles.textInput, { marginTop: 8 }]}
        />
        <TouchableOpacity style={styles.watchNowBtn} onPress={handleLoadCustom}>
          <Ionicons name="play" size={16} color="#0A0D14" />
          <Text style={styles.watchNowText}>Play in Theatre</Text>
        </TouchableOpacity>
      </View>

      {/* Results Header */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.resultsHeading}>
            {hasSearched ? `YouTube Results for "${localSearch}"` : 'Curated Christian Worship'}
          </Text>
          <Text style={styles.resultsSubtitle}>
            {hasSearched ? `${displayVideos.length} videos found on YouTube` : 'Official licensed streams'}
          </Text>
        </View>
        {hasSearched && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.resetCuratedBtn}>
            <Text style={styles.resetCuratedText}>Show Curated</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading state indicator */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E5A93C" />
          <Text style={styles.loadingText}>Searching YouTube directly...</Text>
        </View>
      )}

      {/* Empty Search Results */}
      {!isSearching && hasSearched && displayVideos.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="film-outline" size={44} color="#6B7280" />
          <Text style={styles.emptyTitle}>No YouTube Videos Found</Text>
          <Text style={styles.emptyText}>Try searching with different keywords, artist name, or paste the link directly.</Text>
        </View>
      )}

      {/* Video Cards Grid */}
      {!isSearching && displayVideos.map((item) => {
        const isCurrent = currentTrack?.youtubeId === item.youtubeId;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.videoRow, isCurrent && styles.activeVideoRow]}
            onPress={() => handleSelectVideo(item)}
            activeOpacity={0.8}
          >
            {/* Thumbnail with duration badge */}
            <View style={styles.thumbWrapper}>
              <Image source={{ uri: item.coverUrl }} style={styles.videoThumb} />
              {item.durationFormatted ? (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{item.durationFormatted}</Text>
                </View>
              ) : null}
              <View style={styles.ytPill}>
                <Ionicons name="logo-youtube" size={10} color="#EF4444" />
              </View>
            </View>

            {/* Video Metadata */}
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.videoArtist} numberOfLines={1}>{item.artist}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="play-circle-outline" size={12} color="#E5A93C" />
                <Text style={styles.metaSubText}>Tap to stream in HD</Text>
              </View>
            </View>

            {/* Action Play Button */}
            <View style={[styles.videoPlayBtn, isCurrent && styles.activePlayBtn]}>
              <Ionicons 
                name={isCurrent && isPlaying ? "pause" : "play"} 
                size={14} 
                color="#0A0D14" 
              />
            </View>
          </TouchableOpacity>
        );
      })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    color: '#F3F4F6',
    fontSize: 17,
    fontWeight: '800'
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  complianceText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700'
  },
  playerWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12
  },
  trackDetailsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#171D2C',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.2)'
  },
  trackDetailsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8
  },
  nowPlayingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981'
  },
  trackTitleText: {
    color: '#F3F4F6',
    fontWeight: '700',
    fontSize: 14
  },
  trackArtistText: {
    color: '#E5A93C',
    fontSize: 12,
    marginTop: 2
  },
  ytIdTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  ytIdText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700'
  },
  searchSection: {
    marginBottom: 20
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 13,
    paddingVertical: 0
  },
  clearBtn: {
    padding: 6
  },
  searchGoBtn: {
    backgroundColor: '#E5A93C',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  chipsScroll: {
    marginTop: 10
  },
  chipPill: {
    backgroundColor: '#171D2C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  activeChipPill: {
    backgroundColor: 'rgba(229, 169, 60, 0.18)',
    borderColor: '#E5A93C'
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600'
  },
  activeChipText: {
    color: '#E5A93C',
    fontWeight: '700'
  },
  inputCard: {
    backgroundColor: '#111622',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  inputCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  inputCardTitle: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '700'
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    color: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13
  },
  watchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5A93C',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 6
  },
  watchNowText: {
    color: '#0A0D14',
    fontWeight: '800',
    fontSize: 13
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12
  },
  resultsHeading: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '800'
  },
  resultsSubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2
  },
  resetCuratedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  resetCuratedText: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '700'
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 13
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  emptyTitle: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111622',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12
  },
  activeVideoRow: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)'
  },
  thumbWrapper: {
    position: 'relative',
    width: 90,
    height: 58,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1A2234'
  },
  videoThumb: {
    width: '100%',
    height: '100%'
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700'
  },
  ytPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 2,
    borderRadius: 4
  },
  videoInfo: {
    flex: 1
  },
  videoTitle: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17
  },
  videoArtist: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 3
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4
  },
  metaSubText: {
    color: '#6B7280',
    fontSize: 10
  },
  videoPlayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5A93C',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activePlayBtn: {
    backgroundColor: '#EF4444'
  }
});
