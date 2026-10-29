import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Image, 
  Dimensions, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

export default function YouTubeWatchScreen({
  currentTrack,
  isPlaying,
  searchQuery = '',
  onPlayTrack,
  onAddYouTubeTrack
}) {
  const [inputUrl, setInputUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const featuredVideos = [
    {
      id: "yt-1",
      title: "Gratitude (Live) - Brandon Lake",
      artist: "Brandon Lake",
      youtubeId: "dQ3Cj8-7M3Y",
      duration: 338,
      sourceType: "youtube",
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "yt-2",
      title: "Oceans (Where Feet May Fail) - Hillsong",
      artist: "Hillsong UNITED",
      youtubeId: "6XX7d_jX6Z8",
      duration: 536,
      sourceType: "youtube",
      coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "yt-4",
      title: "Goodness of God (Live) - CeCe Winans",
      artist: "CeCe Winans",
      youtubeId: "9sE5kEnitqE",
      duration: 298,
      sourceType: "youtube",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "yt-5",
      title: "House of the Lord - Phil Wickham",
      artist: "Phil Wickham",
      youtubeId: "x0vQyN3jQbg",
      duration: 255,
      sourceType: "youtube",
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80"
    }
  ];

  const extractVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : url.trim();
  };

  const handleLoadCustom = () => {
    const vidId = extractVideoId(inputUrl);
    if (!vidId) {
      Alert.alert("Invalid Link", "Please paste a valid YouTube video URL or ID.");
      return;
    }

    const newTrack = {
      id: `yt-custom-${Date.now()}`,
      title: videoTitle || `YouTube Stream (${vidId})`,
      artist: "YouTube Video",
      album: "YouTube Watch",
      duration: 300,
      sourceType: "youtube",
      youtubeId: vidId,
      coverUrl: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
      lyrics: `[Streaming from YouTube: ${vidId}]`
    };

    onAddYouTubeTrack(newTrack);
    onPlayTrack(newTrack);
    setInputUrl('');
    setVideoTitle('');
  };

  const currentYtId = currentTrack?.sourceType === 'youtube' ? currentTrack.youtubeId : 'dQ3Cj8-7M3Y';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header & Compliance Badge */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="logo-youtube" size={24} color="#EF4444" />
          <Text style={styles.title}>YouTube Watch Theatre</Text>
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
      {currentTrack && (
        <View style={styles.trackDetailsCard}>
          <Text style={styles.trackTitleText} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.trackArtistText} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
      )}

      {/* Custom URL Input */}
      <View style={styles.inputCard}>
        <Text style={styles.inputCardTitle}>Watch Any YouTube Video</Text>
        <TextInput
          placeholder="Paste YouTube Link or Video ID"
          placeholderTextColor="#6B7280"
          value={inputUrl}
          onChangeText={setInputUrl}
          style={styles.textInput}
        />
        <TextInput
          placeholder="Optional Title"
          placeholderTextColor="#6B7280"
          value={videoTitle}
          onChangeText={setVideoTitle}
          style={[styles.textInput, { marginTop: 8 }]}
        />
        <TouchableOpacity style={styles.watchNowBtn} onPress={handleLoadCustom}>
          <Ionicons name="play" size={16} color="#0A0D14" />
          <Text style={styles.watchNowText}>Watch Video</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Videos */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Curated Music Videos</Text>
      </View>

      {featuredVideos
        .filter(item => {
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return item.title.toLowerCase().includes(q) || item.artist.toLowerCase().includes(q);
        })
        .map((item) => {
        const isCurrent = currentTrack?.youtubeId === item.youtubeId;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.videoRow, isCurrent && styles.activeVideoRow]}
            onPress={() => onPlayTrack(item)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.coverUrl }} style={styles.videoThumb} />
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.videoArtist}>{item.artist}</Text>
            </View>
            <View style={styles.videoPlayBtn}>
              <Ionicons name="play" size={14} color="#0A0D14" />
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
    backgroundColor: '#171D2C',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16
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
  inputCard: {
    backgroundColor: '#111622',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  inputCardTitle: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10
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
    marginTop: 12,
    gap: 6
  },
  watchNowText: {
    color: '#0A0D14',
    fontWeight: '800',
    fontSize: 13
  },
  sectionHeader: {
    marginBottom: 12
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '800'
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  },
  videoThumb: {
    width: 80,
    height: 52,
    borderRadius: 8
  },
  videoInfo: {
    flex: 1
  },
  videoTitle: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '700'
  },
  videoArtist: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2
  },
  videoPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5A93C',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
