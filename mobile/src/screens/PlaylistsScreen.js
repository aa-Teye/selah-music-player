import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlaylistsScreen({
  tracks,
  favorites,
  onPlayTrack,
  currentTrack,
  isPlaying,
  playlists = [],
  onCreatePlaylist
}) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Favorite tracks
  const favoriteTracks = tracks.filter((t) => favorites.includes(t.id));

  const handleCreate = () => {
    if (!newPlaylistName.trim()) {
      Alert.alert("Playlist Name", "Please enter a name for your playlist.");
      return;
    }
    if (onCreatePlaylist) {
      onCreatePlaylist(newPlaylistName.trim());
    }
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Playlists</Text>
          <Text style={styles.subtitle}>Your curated collections and favorites</Text>
        </View>

        <TouchableOpacity 
          style={styles.createBtn} 
          onPress={() => setIsCreating(!isCreating)}
        >
          <Ionicons name={isCreating ? "close" : "add"} size={18} color="#0A0D14" />
          <Text style={styles.createBtnText}>{isCreating ? "Cancel" : "New"}</Text>
        </TouchableOpacity>
      </View>

      {/* Create Playlist Input Box */}
      {isCreating && (
        <View style={styles.createBox}>
          <TextInput
            style={styles.createInput}
            placeholder="Playlist name (e.g. Quiet Morning)..."
            placeholderTextColor="#6B7280"
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
            autoFocus
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
            <Text style={styles.saveBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Favorites Banner Card */}
      <TouchableOpacity 
        style={styles.favCard}
        onPress={() => favoriteTracks.length > 0 && onPlayTrack(favoriteTracks[0])}
        activeOpacity={0.8}
      >
        <View style={styles.favIconBox}>
          <Ionicons name="heart" size={28} color="#E5A93C" />
        </View>
        <View style={styles.favDetails}>
          <Text style={styles.favTitle}>Loved Tracks</Text>
          <Text style={styles.favSubtitle}>{favoriteTracks.length} song{favoriteTracks.length === 1 ? '' : 's'} favorited</Text>
        </View>
        {favoriteTracks.length > 0 && (
          <View style={styles.favPlayBtn}>
            <Ionicons name="play" size={18} color="#0A0D14" />
          </View>
        )}
      </TouchableOpacity>

      {/* Favorited Songs List */}
      {favoriteTracks.length > 0 ? (
        <View style={styles.tracksSection}>
          <Text style={styles.sectionHeader}>Favorite Songs</Text>
          {favoriteTracks.map((item) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.trackRow, isCurrent && styles.trackRowActive]}
                onPress={() => onPlayTrack(item)}
              >
                <View style={styles.trackIconBox}>
                  <Ionicons 
                    name={isCurrent && isPlaying ? "volume-high" : "musical-note"} 
                    size={18} 
                    color={isCurrent ? "#E5A93C" : "#9CA3AF"} 
                  />
                </View>
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackTitle, isCurrent && styles.trackTitleActive]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <Ionicons name="heart" size={18} color="#E5A93C" />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyFavBox}>
          <Text style={styles.emptyFavText}>No favorite tracks yet.</Text>
          <Text style={styles.emptyFavSub}>Tap the heart icon on any song to add it here!</Text>
        </View>
      )}

      {/* Preset Curated Playlists */}
      <View style={styles.playlistsGrid}>
        <Text style={styles.sectionHeader}>Curated For You</Text>
        {[
          { title: "Morning Devotions", desc: "Praise & Thanksgiving to start your day", count: 4, icon: "sunny-outline" },
          { title: "Peace & Meditation", desc: "Gentle acoustic strings & calmness", count: 3, icon: "leaf-outline" },
          { title: "Deep Focus & Study", desc: "Instrumental worship & lo-fi chords", count: 2, icon: "book-outline" }
        ].map((pl, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.playlistCard}
            onPress={() => tracks.length > 0 && onPlayTrack(tracks[idx % tracks.length])}
          >
            <View style={styles.plIconCircle}>
              <Ionicons name={pl.icon} size={22} color="#E5A93C" />
            </View>
            <View style={styles.plDetails}>
              <Text style={styles.plTitle}>{pl.title}</Text>
              <Text style={styles.plDesc}>{pl.desc}</Text>
            </View>
            <View style={styles.plPlayArrow}>
              <Ionicons name="play" size={14} color="#E5A93C" />
            </View>
          </TouchableOpacity>
        ))}
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
    paddingBottom: 120
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F9FAFB'
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5A93C',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4
  },
  createBtnText: {
    color: '#0A0D14',
    fontWeight: '800',
    fontSize: 12
  },
  createBox: {
    flexDirection: 'row',
    backgroundColor: '#121824',
    padding: 10,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 8
  },
  createInput: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 14,
    paddingHorizontal: 8
  },
  saveBtn: {
    backgroundColor: '#E5A93C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center'
  },
  saveBtnText: {
    color: '#0A0D14',
    fontWeight: '700',
    fontSize: 13
  },
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 20,
    gap: 14
  },
  favIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  favDetails: {
    flex: 1
  },
  favTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 2
  },
  favSubtitle: {
    fontSize: 13,
    color: '#9CA3AF'
  },
  favPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5A93C',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tracksSection: {
    marginBottom: 20
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 10
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 12
  },
  trackRowActive: {
    borderColor: '#E5A93C',
    backgroundColor: 'rgba(229, 169, 60, 0.08)'
  },
  trackIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1A2333',
    justifyContent: 'center',
    alignItems: 'center'
  },
  trackInfo: {
    flex: 1
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2
  },
  trackTitleActive: {
    color: '#E5A93C'
  },
  trackArtist: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  emptyFavBox: {
    backgroundColor: '#121824',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 20
  },
  emptyFavText: {
    color: '#F9FAFB',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4
  },
  emptyFavSub: {
    color: '#9CA3AF',
    fontSize: 12
  },
  playlistsGrid: {
    gap: 10
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 14
  },
  plIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  plDetails: {
    flex: 1
  },
  plTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2
  },
  plDesc: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  plPlayArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
