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
    id: "yt-nQWFzMvCfLE",
    title: "What A Beautiful Name - Hillsong Worship",
    artist: "Hillsong Worship",
    youtubeId: "nQWFzMvCfLE",
    duration: 338,
    durationFormatted: "5:38",
    sourceType: "youtube",
    coverUrl: "https://img.youtube.com/vi/nQWFzMvCfLE/hqdefault.jpg"
  },
  {
    id: "yt-8TkS5TdCr-I",
    title: "Powerful Worship Songs for Prayer",
    artist: "Nonstop Gospel Worship",
    youtubeId: "8TkS5TdCr-I",
    duration: 536,
    durationFormatted: "8:56",
    sourceType: "youtube",
    coverUrl: "https://img.youtube.com/vi/8TkS5TdCr-I/hqdefault.jpg"
  },
  {
    id: "yt-8YKJVx4qxcs",
    title: "Best Hillsong Worship Songs of All Time",
    artist: "Hillsong UNITED",
    youtubeId: "8YKJVx4qxcs",
    duration: 599,
    durationFormatted: "9:59",
    sourceType: "youtube",
    coverUrl: "https://img.youtube.com/vi/8YKJVx4qxcs/hqdefault.jpg"
  },
  {
    id: "yt-t9FnJSY_EsQ",
    title: "Oceans (Where Feet May Fail) - Worship Music",
    artist: "Christian Worship",
    youtubeId: "t9FnJSY_EsQ",
    duration: 536,
    durationFormatted: "8:56",
    sourceType: "youtube",
    coverUrl: "https://img.youtube.com/vi/t9FnJSY_EsQ/hqdefault.jpg"
  }
];

export default function YouTubeWatchScreen({
  currentTrack,
  isPlaying,
  searchQuery = '',
  onPlayTrack,
  onTogglePlayPause,
  onAddYouTubeTrack,
  onOpenAddToPlaylist,
  isShuffle = false,
  onToggleShuffle,
  isRepeat = false,
  onToggleRepeat,
  onPrevTrack,
  onNextTrack
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
  const [repeatMode, setRepeatMode] = useState(isRepeat ? 'all' : 'off'); // 'off' | 'all' | 'one'
  const [selectedYtVideo, setSelectedYtVideo] = useState(
    currentTrack?.sourceType === 'youtube' && currentTrack?.youtubeId 
      ? currentTrack 
      : DEFAULT_FEATURED[0]
  );
  const [isYtPlaying, setIsYtPlaying] = useState(false);

  // Synchronize when currentTrack prop updates to a YouTube track
  useEffect(() => {
    if (currentTrack?.sourceType === 'youtube' && currentTrack?.youtubeId) {
      setSelectedYtVideo(currentTrack);
      setIsYtPlaying(isPlaying);
    }
  }, [currentTrack]);

  // Synchronize when parent isPlaying prop changes
  useEffect(() => {
    setIsYtPlaying(isPlaying);
  }, [isPlaying]);

  const scrollRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const playerRef = useRef(null);

  // Sync external repeat prop with local repeat mode
  useEffect(() => {
    if (isRepeat && repeatMode === 'off') {
      setRepeatMode('all');
    } else if (!isRepeat && repeatMode !== 'off') {
      setRepeatMode('off');
    }
  }, [isRepeat]);

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      let next = 'off';
      if (prev === 'off') next = 'all';
      else if (prev === 'all') next = 'one';
      else next = 'off';

      if (onToggleRepeat) {
        if (next !== 'off' && !isRepeat) onToggleRepeat();
        else if (next === 'off' && isRepeat) onToggleRepeat();
      }
      return next;
    });
  };

  const toggleShuffleMode = () => {
    if (onToggleShuffle) {
      onToggleShuffle();
    }
  };

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
    setSelectedYtVideo(item);
    setIsYtPlaying(true);
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
      message: `Listen to "${item.title}" on Selah: https://www.youtube.com/watch?v=${item.youtubeId}`
    });
  };

  // Next video in list
  const handleNextVideo = (allowWrap = true) => {
    if (displayVideos.length === 0) return;
    if (isShuffle) {
      handlePlayRandomVideo();
      return;
    }
    const curIdx = displayVideos.findIndex(v => (v.youtubeId || v.id) === currentYtId);
    if (curIdx !== -1 && curIdx < displayVideos.length - 1) {
      handleSelectVideo(displayVideos[curIdx + 1]);
    } else if (allowWrap && displayVideos.length > 0) {
      handleSelectVideo(displayVideos[0]);
    }
  };

  // Previous video in list
  const handlePrevVideo = () => {
    if (displayVideos.length === 0) return;
    const curIdx = displayVideos.findIndex(v => (v.youtubeId || v.id) === currentYtId);
    if (curIdx > 0) {
      handleSelectVideo(displayVideos[curIdx - 1]);
    } else if (displayVideos.length > 0) {
      handleSelectVideo(displayVideos[displayVideos.length - 1]);
    }
  };

  // Play random video for shuffle mode
  const handlePlayRandomVideo = () => {
    if (displayVideos.length === 0) return;
    if (displayVideos.length === 1) {
      handleSelectVideo(displayVideos[0]);
      return;
    }
    let randIdx = Math.floor(Math.random() * displayVideos.length);
    const curIdx = displayVideos.findIndex(v => (v.youtubeId || v.id) === currentYtId);
    if (randIdx === curIdx) {
      randIdx = (randIdx + 1) % displayVideos.length;
    }
    handleSelectVideo(displayVideos[randIdx]);
  };

  // Replay current video for single-track loop mode
  const handleReplayCurrent = () => {
    try {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(0, true);
      }
    } catch (_) {}
    setIsYtPlaying(true);
    if (onTogglePlayPause) {
      onTogglePlayPause(true);
    }
  };

  // Direct toggle play/pause for master button
  const handleTogglePlayBtn = () => {
    setIsYtPlaying((prev) => {
      const next = !prev;
      if (onTogglePlayPause) {
        onTogglePlayPause(next);
      }
      return next;
    });
  };

  // Callback when YouTube player state changes inside the iframe
  const handlePlayerStateChange = (state) => {
    if (state === 'playing') {
      setIsYtPlaying(true);
      if (onTogglePlayPause && !isPlaying) {
        onTogglePlayPause(true);
      }
    } else if (state === 'paused') {
      setIsYtPlaying(false);
      if (onTogglePlayPause && isPlaying) {
        onTogglePlayPause(false);
      }
    } else if (state === 'ended') {
      setIsYtPlaying(false);
      if (onTogglePlayPause && isPlaying) {
        onTogglePlayPause(false);
      }
      if (repeatMode === 'one') {
        handleReplayCurrent();
      } else if (isShuffle) {
        handlePlayRandomVideo();
      } else if (repeatMode === 'all') {
        const curIdx = displayVideos.findIndex(v => (v.youtubeId || v.id) === currentYtId);
        if (curIdx !== -1 && curIdx < displayVideos.length - 1) {
          handleSelectVideo(displayVideos[curIdx + 1]);
        } else if (displayVideos.length > 0) {
          handleSelectVideo(displayVideos[0]);
        }
      } else {
        const curIdx = displayVideos.findIndex(v => (v.youtubeId || v.id) === currentYtId);
        if (curIdx !== -1 && curIdx < displayVideos.length - 1) {
          handleSelectVideo(displayVideos[curIdx + 1]);
        }
      }
    }
  };

  // Determine current active YouTube ID
  const currentYtId = selectedYtVideo?.youtubeId || (DEFAULT_FEATURED[0]?.youtubeId || '9sE5kEnitqE');

  // Video list to display: search results if searched, otherwise default featured
  const displayVideos = hasSearched ? searchResults : DEFAULT_FEATURED;

  const activeVideoTitle = selectedYtVideo?.title || DEFAULT_FEATURED[0].title;
  const activeVideoArtist = selectedYtVideo?.artist || DEFAULT_FEATURED[0].artist;

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
                color={playMode === 'video' ? '#08090C' : '#9CA3AF'} 
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
                color={playMode === 'mp3' ? '#08090C' : '#9CA3AF'} 
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
          {/* Main YouTube Iframe Player (always kept mounted with full 16:9 dimensions so audio stream is never paused by OS) */}
          <View style={styles.videoPlayerCard}>
            <YoutubePlayer
              ref={playerRef}
              height={(width - 32) * (9 / 16)}
              play={isYtPlaying}
              videoId={currentYtId}
              onChangeState={handlePlayerStateChange}
              webViewProps={{
                allowsFullscreenVideo: true,
                androidLayerType: 'hardware',
                scrollEnabled: false
              }}
            />
          </View>

          {/* MP3 Audio Stream Visualizer (displayed in Play as MP3 mode without interrupting playback) */}
          {playMode === 'mp3' && (
            <View style={styles.mp3PlayerOverlay}>
              <View style={styles.mp3DiscWrap}>
                <Image 
                  source={{ uri: selectedYtVideo?.coverUrl || `https://img.youtube.com/vi/${currentYtId}/hqdefault.jpg` }} 
                  style={styles.mp3DiscImage}
                />
                <View style={styles.mp3CenterSpindle} />
              </View>

              <View style={styles.mp3Info}>
                <View style={styles.mp3Badge}>
                  <Ionicons name="radio" size={13} color="#34D399" />
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
                <Ionicons name="bookmark-outline" size={18} color="#34D399" />
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

        {/* Playback Controls Row: Shuffle, Prev, Master Play/Pause, Next, Loop */}
        <View style={styles.controlsRow}>
          {/* Shuffle Toggle */}
          <TouchableOpacity 
            style={[styles.ctrlBtn, isShuffle && styles.ctrlBtnActive]}
            onPress={toggleShuffleMode}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="shuffle" 
              size={20} 
              color={isShuffle ? "#34D399" : "#9CA3AF"} 
            />
            {isShuffle && <View style={styles.ctrlActiveDot} />}
          </TouchableOpacity>

          {/* Prev Track */}
          <TouchableOpacity 
            style={styles.ctrlSkipBtn}
            onPress={handlePrevVideo}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Master Play/Pause */}
          <TouchableOpacity 
            style={styles.ctrlPlayBtn}
            onPress={handleTogglePlayBtn}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isYtPlaying ? "pause" : "play"} 
              size={22} 
              color="#08090C" 
              style={!isYtPlaying ? { marginLeft: 2 } : null}
            />
          </TouchableOpacity>

          {/* Next Track */}
          <TouchableOpacity 
            style={styles.ctrlSkipBtn}
            onPress={() => handleNextVideo(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Loop/Repeat Mode Toggle */}
          <TouchableOpacity 
            style={[styles.ctrlBtn, repeatMode !== 'off' && styles.ctrlBtnActive]}
            onPress={cycleRepeatMode}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={repeatMode === 'one' ? "repeat-once" : "repeat"} 
              size={22} 
              color={repeatMode !== 'off' ? "#34D399" : "#9CA3AF"} 
            />
            {repeatMode !== 'off' && (
              <View style={styles.repeatBadge}>
                <Text style={styles.repeatBadgeText}>
                  {repeatMode === 'one' ? '1' : 'ALL'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
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
            <ActivityIndicator size="small" color="#34D399" style={{ marginRight: 6 }} />
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
            <Ionicons name="arrow-forward" size={16} color="#08090C" />
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
            <ActivityIndicator size="large" color="#34D399" />
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
                        <Ionicons name="volume-high" size={20} color="#34D399" />
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
                      color={isSelected ? "#34D399" : "#6B7280"} 
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
            <Ionicons name="link-outline" size={18} color="#34D399" />
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
              <Ionicons name="play" size={16} color="#08090C" />
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
    backgroundColor: '#08090C'
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
    backgroundColor: '#34D399'
  },
  modeTabText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700'
  },
  modeTabTextActive: {
    color: '#08090C'
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
    borderColor: 'rgba(52, 211, 153, 0.22)',
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
  mp3PlayerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121318',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10
  },
  mp3PlayerCard: {
    height: (width - 32) * (9 / 16),
    backgroundColor: '#121318',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.22)',
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
    backgroundColor: '#08090C',
    borderWidth: 2,
    borderColor: '#34D399',
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
    backgroundColor: '#08090C',
    borderWidth: 2,
    borderColor: '#34D399'
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
    color: '#34D399',
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
    backgroundColor: '#1A1C23',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121318',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  ctrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1C23',
    position: 'relative'
  },
  ctrlBtnActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)'
  },
  ctrlActiveDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399'
  },
  ctrlSkipBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center'
  },
  ctrlPlayBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4
  },
  repeatBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#34D399',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1
  },
  repeatBadgeText: {
    color: '#08090C',
    fontSize: 8,
    fontWeight: '900'
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
    backgroundColor: '#121318',
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
    backgroundColor: '#34D399',
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
    borderColor: '#34D399'
  },
  chipText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#34D399',
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
    backgroundColor: '#121318',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  videoCardSelected: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.06)'
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
    color: '#34D399'
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
    backgroundColor: '#121318',
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
    backgroundColor: '#16171E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  loadBtn: {
    backgroundColor: '#34D399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6
  },
  loadBtnText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800'
  },
  btnDisabled: {
    opacity: 0.5
  }
});
