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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function PlaylistsScreen({
  tracks = [],
  favorites = [],
  onPlayTrack,
  currentTrack,
  isPlaying,
  playlists = [],
  onCreatePlaylist,
  onDeletePlaylist,
  onPlayPlaylist,
  onToggleTrackInPlaylist
}) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  // Favorite tracks list
  const favoriteTracks = tracks.filter((t) => favorites.includes(t.id));

  // Find currently selected playlist
  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  // Get tracks inside selected playlist
  const selectedPlaylistTracks = selectedPlaylist
    ? tracks.filter((t) => (selectedPlaylist.trackIds || []).includes(t.id))
    : [];

  // Create playlist
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

  // Delete playlist with confirmation
  const confirmDeletePlaylist = (playlist) => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            if (selectedPlaylistId === playlist.id) {
              setSelectedPlaylistId(null);
            }
            if (onDeletePlaylist) onDeletePlaylist(playlist.id);
          }
        }
      ]
    );
  };

  // Play entire playlist
  const handlePlayAll = (playlistTracks) => {
    if (!playlistTracks || playlistTracks.length === 0) {
      Alert.alert("Empty Playlist", "Add some songs to this playlist first!");
      return;
    }
    if (onPlayPlaylist) {
      onPlayPlaylist(playlistTracks);
    } else if (onPlayTrack) {
      onPlayTrack(playlistTracks[0]);
    }
  };

  // ==================== DETAIL VIEW FOR A SPECIFIC PLAYLIST ====================
  if (selectedPlaylist) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Detail Top Header */}
        <TouchableOpacity 
          style={styles.backRow} 
          onPress={() => setSelectedPlaylistId(null)}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#E5A93C" />
          <Text style={styles.backText}>All Playlists</Text>
        </TouchableOpacity>

        {/* Playlist Hero Banner */}
        <View style={styles.detailHero}>
          <View style={styles.detailIconBox}>
            <MaterialCommunityIcons name="playlist-music" size={36} color="#E5A93C" />
          </View>
          <View style={styles.detailHeroInfo}>
            <Text style={styles.detailTitle}>{selectedPlaylist.name}</Text>
            <Text style={styles.detailSubtitle}>
              {selectedPlaylistTracks.length} song{selectedPlaylistTracks.length === 1 ? '' : 's'} • Custom Collection
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.detailDeleteBtn}
            onPress={() => confirmDeletePlaylist(selectedPlaylist)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Play All Button */}
        {selectedPlaylistTracks.length > 0 && (
          <TouchableOpacity 
            style={styles.playAllBtn}
            onPress={() => handlePlayAll(selectedPlaylistTracks)}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={18} color="#0A0D14" />
            <Text style={styles.playAllBtnText}>Play All Songs</Text>
          </TouchableOpacity>
        )}

        {/* Songs in this playlist */}
        <View style={styles.tracksSection}>
          <Text style={styles.sectionHeader}>Tracks in this Playlist</Text>

          {selectedPlaylistTracks.length > 0 ? (
            selectedPlaylistTracks.map((item, idx) => {
              const isCurrent = currentTrack?.id === item.id;
              return (
                <View key={item.id || idx} style={[styles.trackRow, isCurrent && styles.trackRowActive]}>
                  <TouchableOpacity 
                    style={styles.trackPlayTouch}
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
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {item.artist || 'Device Track'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Remove from playlist button */}
                  <TouchableOpacity 
                    style={styles.removeTrackBtn}
                    onPress={() => onToggleTrackInPlaylist && onToggleTrackInPlaylist(selectedPlaylist.id, item.id)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyDetailBox}>
              <Ionicons name="musical-notes-outline" size={40} color="#4B5563" />
              <Text style={styles.emptyDetailTitle}>This playlist is empty</Text>
              <Text style={styles.emptyDetailSub}>
                Tap the "+ Add to Playlist" button on any track in your Local Library or Home screen to add songs here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // ==================== MAIN ALL PLAYLISTS VIEW ====================
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Playlists</Text>
          <Text style={styles.subtitle}>Curated collections, devotions, & custom playlists</Text>
        </View>

        <TouchableOpacity 
          style={styles.createBtn} 
          onPress={() => setIsCreating(!isCreating)}
        >
          <Ionicons name={isCreating ? "close" : "add"} size={18} color="#0A0D14" />
          <Text style={styles.createBtnText}>{isCreating ? "Cancel" : "New Playlist"}</Text>
        </TouchableOpacity>
      </View>

      {/* Create Playlist Input Box */}
      {isCreating && (
        <View style={styles.createBox}>
          <TextInput
            style={styles.createInput}
            placeholder="Name your playlist (e.g. Sunday Morning)..."
            placeholderTextColor="#6B7280"
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
            autoFocus
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Favorites Banner Card */}
      <TouchableOpacity 
        style={styles.favCard}
        onPress={() => handlePlayAll(favoriteTracks)}
        activeOpacity={0.8}
      >
        <View style={styles.favIconBox}>
          <Ionicons name="heart" size={28} color="#E5A93C" />
        </View>
        <View style={styles.favDetails}>
          <Text style={styles.favTitle}>Loved Tracks</Text>
          <Text style={styles.favSubtitle}>
            {favoriteTracks.length} song{favoriteTracks.length === 1 ? '' : 's'} favorited
          </Text>
        </View>
        {favoriteTracks.length > 0 && (
          <View style={styles.favPlayBtn}>
            <Ionicons name="play" size={18} color="#0A0D14" />
          </View>
        )}
      </TouchableOpacity>

      {/* My Custom Playlists Section */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionHeader}>My Playlists ({playlists.length})</Text>
      </View>

      {playlists.length > 0 ? (
        <View style={styles.userPlaylistsGrid}>
          {playlists.map((pl) => {
            const count = (pl.trackIds || []).length;
            const plTracks = tracks.filter((t) => (pl.trackIds || []).includes(t.id));
            return (
              <TouchableOpacity
                key={pl.id}
                style={styles.userPlaylistCard}
                onPress={() => setSelectedPlaylistId(pl.id)}
                activeOpacity={0.8}
              >
                <View style={styles.userPlIconCircle}>
                  <MaterialCommunityIcons name="folder-music-outline" size={24} color="#E5A93C" />
                </View>

                <View style={styles.userPlInfo}>
                  <Text style={styles.userPlTitle} numberOfLines={1}>{pl.name}</Text>
                  <Text style={styles.userPlSubtitle}>
                    {count} track{count === 1 ? '' : 's'}
                  </Text>
                </View>

                {/* Quick Play & Options */}
                <View style={styles.userPlActions}>
                  {count > 0 && (
                    <TouchableOpacity 
                      style={styles.userPlMiniPlay}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePlayAll(plTracks);
                      }}
                    >
                      <Ionicons name="play" size={14} color="#0A0D14" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.userPlDelete}
                    onPress={(e) => {
                      e.stopPropagation();
                      confirmDeletePlaylist(pl);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#6B7280" />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyPlaylistsCard}>
          <MaterialCommunityIcons name="playlist-plus" size={32} color="#E5A93C" />
          <Text style={styles.emptyPlaylistsTitle}>No Custom Playlists Yet</Text>
          <Text style={styles.emptyPlaylistsSub}>
            Create your own playlists for study, morning prayer, or offline road trips.
          </Text>
          <TouchableOpacity 
            style={styles.emptyCreateBtn}
            onPress={() => setIsCreating(true)}
          >
            <Ionicons name="add" size={16} color="#0A0D14" />
            <Text style={styles.emptyCreateBtnText}>Create First Playlist</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Preset Curated Playlists */}
      <View style={styles.curatedSection}>
        <Text style={styles.sectionHeader}>Curated Praise & Devotion</Text>
        {[
          { title: "Morning Devotions", desc: "Praise & Thanksgiving to start your day", filter: "worship", icon: "sunny-outline" },
          { title: "Peace & Meditation", desc: "Gentle acoustic strings & inner stillness", filter: "peace", icon: "leaf-outline" },
          { title: "Deep Focus & Study", desc: "Scripture-inspired lo-fi & peaceful rhythms", filter: "lofi", icon: "book-outline" }
        ].map((pl, idx) => {
          const matching = tracks.filter((t) => t.category === pl.filter);
          return (
            <TouchableOpacity 
              key={idx} 
              style={styles.playlistCard}
              onPress={() => handlePlayAll(matching.length > 0 ? matching : tracks)}
              activeOpacity={0.8}
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
    paddingBottom: 130
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
    fontSize: 12,
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
    borderColor: '#E5A93C',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB'
  },
  favSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  favPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5A93C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2
  },
  sectionHeaderWrap: {
    marginBottom: 10
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F3F4F6',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  userPlaylistsGrid: {
    marginBottom: 24,
    gap: 10
  },
  userPlaylistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 12
  },
  userPlIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userPlInfo: {
    flex: 1
  },
  userPlTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB'
  },
  userPlSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  userPlActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  userPlMiniPlay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5A93C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 1
  },
  userPlDelete: {
    padding: 4
  },
  emptyPlaylistsCard: {
    backgroundColor: '#121824',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    alignItems: 'center',
    marginBottom: 24
  },
  emptyPlaylistsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F3F4F6',
    marginTop: 8
  },
  emptyPlaylistsSub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 14
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5A93C',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6
  },
  emptyCreateBtnText: {
    color: '#0A0D14',
    fontWeight: '700',
    fontSize: 12
  },
  curatedSection: {
    marginBottom: 20,
    gap: 10
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 12,
    marginTop: 8
  },
  plIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 169, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  plDetails: {
    flex: 1
  },
  plTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB'
  },
  plDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2
  },
  plPlayArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Detail View Styles
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6
  },
  backText: {
    color: '#E5A93C',
    fontWeight: '700',
    fontSize: 14
  },
  detailHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 16,
    gap: 14
  },
  detailIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  detailHeroInfo: {
    flex: 1
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F9FAFB'
  },
  detailSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  detailDeleteBtn: {
    padding: 8
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5A93C',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8
  },
  playAllBtnText: {
    color: '#0A0D14',
    fontWeight: '800',
    fontSize: 14
  },
  tracksSection: {
    gap: 8
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937'
  },
  trackRowActive: {
    borderColor: 'rgba(229, 169, 60, 0.5)',
    backgroundColor: 'rgba(229, 169, 60, 0.08)'
  },
  trackPlayTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  trackIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1A2234',
    justifyContent: 'center',
    alignItems: 'center'
  },
  trackInfo: {
    flex: 1
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB'
  },
  trackTitleActive: {
    color: '#E5A93C'
  },
  trackArtist: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  removeTrackBtn: {
    padding: 6
  },
  emptyDetailBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#121824',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginTop: 10
  },
  emptyDetailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F3F4F6',
    marginTop: 12
  },
  emptyDetailSub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  }
});
