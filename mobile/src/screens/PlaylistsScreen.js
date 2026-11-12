import React, { useMemo, useState } from 'react';
import ShowMoreButton from '../components/ShowMoreButton';
import SongThumb from '../components/SongThumb';
import { buildSmartPlaylists, playsOf } from '../services/smartPlaylists';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

function PlaylistsScreen({
  tracks = [],
  favorites = [],
  onPlayTrack,
  currentTrack,
  isPlaying,
  playlists = [],
  onCreatePlaylist,
  onDeletePlaylist,
  onPlayPlaylist,
  onToggleTrackInPlaylist,
  playCounts = {}
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [isAddSongsVisible, setIsAddSongsVisible] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [pickerLimit, setPickerLimit] = useState(80);

  // Favorite tracks list
  const favoriteTracks = tracks.filter((t) => favorites.includes(t.id));

  // Playlists that fill themselves (most played, recently added, ...)
  const smartLists = useMemo(() => buildSmartPlaylists(tracks, playCounts), [tracks, playCounts]);

  // Find currently selected playlist (yours or a smart one)
  const selectedPlaylist =
    playlists.find((p) => p.id === selectedPlaylistId) || smartLists.find((p) => p.id === selectedPlaylistId);
  const isSmart = Boolean(selectedPlaylist && selectedPlaylist.smart);

  // Get tracks inside selected playlist
  const selectedPlaylistTracks = selectedPlaylist
    ? isSmart
      ? selectedPlaylist.tracks
      : tracks.filter((t) => (selectedPlaylist.trackIds || []).includes(t.id))
    : [];

  // Tracks available for adding
  const filteredAvailableTracks = tracks.filter((t) => {
    if (!songSearchQuery.trim()) return true;
    const q = songSearchQuery.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q))
    );
  });

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
          <Ionicons name="arrow-back" size={20} color="#34D399" />
          <Text style={styles.backText}>All Playlists</Text>
        </TouchableOpacity>

        {/* Playlist Hero Banner */}
        <View style={styles.detailHero}>
          <View style={styles.detailIconBox}>
            {isSmart ? (
              <Ionicons name={selectedPlaylist.icon} size={32} color="#34D399" />
            ) : (
              <MaterialCommunityIcons name="playlist-music" size={36} color="#34D399" />
            )}
          </View>
          <View style={styles.detailHeroInfo}>
            <Text style={styles.detailTitle}>{selectedPlaylist.name}</Text>
            <Text style={styles.detailSubtitle}>
              {selectedPlaylistTracks.length} song{selectedPlaylistTracks.length === 1 ? '' : 's'} •{' '}
              {isSmart ? 'Updates by itself' : 'Custom Collection'}
            </Text>
          </View>

          {!isSmart && (
            <TouchableOpacity
              style={styles.detailDeleteBtn}
              onPress={() => confirmDeletePlaylist(selectedPlaylist)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Actions Row */}
        <View style={styles.detailActionRow}>
          {selectedPlaylistTracks.length > 0 && (
            <TouchableOpacity
              style={styles.playAllBtn}
              onPress={() => handlePlayAll(selectedPlaylistTracks)}
              activeOpacity={0.8}
              testID="playlist-play-all"
            >
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Text style={styles.playAllBtnText}>Play All Songs</Text>
            </TouchableOpacity>
          )}

          {!isSmart && (
            <TouchableOpacity
              style={[styles.addSongsPillBtn, selectedPlaylistTracks.length === 0 && styles.addSongsPillBtnFull]}
              onPress={() => setIsAddSongsVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={c.ink} />
              <Text style={styles.addSongsPillBtnText}>Add Songs</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Songs in this playlist */}
        <View style={styles.tracksSection}>
          <Text style={styles.sectionHeader}>{isSmart ? 'Songs' : 'Tracks in this Playlist'}</Text>

          {selectedPlaylistTracks.length > 0 ? (
            selectedPlaylistTracks.map((item, idx) => {
              const isCurrent = currentTrack?.id === item.id;
              const plays = playsOf(playCounts, item.id);
              return (
                <View key={item.id || idx} style={[styles.trackRow, isCurrent && styles.trackRowActive]}>
                  <TouchableOpacity
                    style={styles.trackPlayTouch}
                    onPress={() => onPlayTrack(item)}
                  >
                    <SongThumb track={item} isCurrent={isCurrent} isPlaying={isPlaying} size={36} />
                    <View style={styles.trackInfo}>
                      <Text style={[styles.trackTitle, isCurrent && styles.trackTitleActive]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {item.artist || 'Device Track'}
                        {selectedPlaylist.id === 'smart-most' ? ` • ${plays} play${plays === 1 ? '' : 's'}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Remove from playlist button */}
                  {!isSmart && (
                    <TouchableOpacity
                      style={styles.removeTrackBtn}
                      onPress={() => onToggleTrackInPlaylist && onToggleTrackInPlaylist(selectedPlaylist.id, item.id)}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={c.textSubtle} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : isSmart ? (
            <View style={styles.emptyDetailBox}>
              <Ionicons name={selectedPlaylist.icon} size={40} color={c.textSecondary} />
              <Text style={styles.emptyDetailTitle}>Nothing here yet</Text>
              <Text style={styles.emptyDetailSub}>{selectedPlaylist.empty}</Text>
            </View>
          ) : (
            <View style={styles.emptyDetailBox}>
              <Ionicons name="musical-notes-outline" size={40} color={c.textSecondary} />
              <Text style={styles.emptyDetailTitle}>This playlist is empty</Text>
              <Text style={styles.emptyDetailSub}>
                Add songs from your device library, imported music, or curated devotions.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setIsAddSongsVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Select Songs to Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Add Songs Multi-Select Modal */}
        <Modal
          visible={isAddSongsVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsAddSongsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Add Songs to Playlist</Text>
                  <Text style={styles.modalSub}>{selectedPlaylist.name} • {selectedPlaylistTracks.length} song{selectedPlaylistTracks.length === 1 ? '' : 's'} included</Text>
                </View>
                <TouchableOpacity onPress={() => setIsAddSongsVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color={c.textSubtle} />
                </TouchableOpacity>
              </View>

              {/* Search Bar inside Modal */}
              <View style={styles.modalSearchBox}>
                <Ionicons name="search" size={16} color={c.textSubtle} />
                <TextInput
                  placeholder="Filter songs by title or artist..."
                  placeholderTextColor={c.textSecondary}
                  value={songSearchQuery}
                  onChangeText={setSongSearchQuery}
                  style={styles.modalSearchInput}
                />
                {songSearchQuery ? (
                  <TouchableOpacity onPress={() => setSongSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={c.textSubtle} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Songs List */}
              <ScrollView style={styles.modalSongsList}>
                {filteredAvailableTracks.length > 0 ? (
                  filteredAvailableTracks.slice(0, pickerLimit).map((item) => {
                    const isIn = (selectedPlaylist.trackIds || []).includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.modalSongRow, isIn && styles.modalSongRowActive]}
                        onPress={() => onToggleTrackInPlaylist && onToggleTrackInPlaylist(selectedPlaylist.id, item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.modalSongIcon, isIn && styles.modalSongIconActive]}>
                          <Ionicons 
                            name={isIn ? "musical-notes" : "musical-note-outline"} 
                            size={18} 
                            color={isIn ? "#34D399" : c.textSubtle} 
                          />
                        </View>
                        <View style={styles.modalSongInfo}>
                          <Text style={[styles.modalSongTitle, isIn && styles.modalSongTitleActive]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.modalSongArtist} numberOfLines={1}>
                            {item.artist || 'Device Track'}
                          </Text>
                        </View>
                        <View style={[styles.modalCheckbox, isIn && styles.modalCheckboxActive]}>
                          {isIn && <Ionicons name="checkmark" size={16} color={c.text} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: c.textSubtle, fontSize: 13 }}>No songs matching search.</Text>
                  </View>
                )}
                <ShowMoreButton remaining={filteredAvailableTracks.length - pickerLimit} onPress={() => setPickerLimit((n) => n + 80)} />
              </ScrollView>

              <TouchableOpacity 
                style={styles.modalDoneBtn}
                onPress={() => setIsAddSongsVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDoneBtnText}>Done ({selectedPlaylistTracks.length} Songs in Playlist)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
          <Text style={styles.subtitle}>Your playlists, loved songs & smart lists</Text>
        </View>

        <TouchableOpacity 
          style={styles.createBtn} 
          onPress={() => setIsCreating(!isCreating)}
        >
          <Ionicons name={isCreating ? "close" : "add"} size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>{isCreating ? "Cancel" : "New Playlist"}</Text>
        </TouchableOpacity>
      </View>

      {/* Create Playlist Input Box */}
      {isCreating && (
        <View style={styles.createBox}>
          <TextInput
            style={styles.createInput}
            placeholder="Name your playlist (e.g. Sunday Morning)..."
            placeholderTextColor={c.textSecondary}
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
          <Ionicons name="heart" size={28} color="#EF4444" />
        </View>
        <View style={styles.favDetails}>
          <Text style={styles.favTitle}>Loved Tracks</Text>
          <Text style={styles.favSubtitle}>
            {favoriteTracks.length} song{favoriteTracks.length === 1 ? '' : 's'} favorited
          </Text>
        </View>
        {favoriteTracks.length > 0 && (
          <View style={styles.favPlayBtn}>
            <Ionicons name="play" size={18} color="#FFFFFF" />
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
                  <MaterialCommunityIcons name="folder-music-outline" size={24} color={c.ink} />
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
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.userPlDelete}
                    onPress={(e) => {
                      e.stopPropagation();
                      confirmDeletePlaylist(pl);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={c.textMuted} />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={18} color={c.textSubtle} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyPlaylistsCard}>
          <MaterialCommunityIcons name="playlist-plus" size={32} color={c.ink} />
          <Text style={styles.emptyPlaylistsTitle}>No Custom Playlists Yet</Text>
          <Text style={styles.emptyPlaylistsSub}>
            Create your own playlists for study, morning prayer, or offline road trips.
          </Text>
          <TouchableOpacity 
            style={styles.emptyCreateBtn}
            onPress={() => setIsCreating(true)}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.emptyCreateBtnText}>Create First Playlist</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Smart playlists: fill themselves from how you listen */}
      <View style={styles.curatedSection}>
        <Text style={styles.sectionHeader}>Smart playlists</Text>
        {smartLists.map((pl) => {
          const count = pl.tracks.length;
          return (
            <TouchableOpacity
              key={pl.id}
              style={styles.playlistCard}
              onPress={() => setSelectedPlaylistId(pl.id)}
              activeOpacity={0.8}
              testID={pl.id}
            >
              <View style={styles.plIconCircle}>
                <Ionicons name={pl.icon} size={22} color={c.ink} />
              </View>
              <View style={styles.plDetails}>
                <Text style={styles.plTitle}>{pl.name}</Text>
                <Text style={styles.plDesc}>
                  {count > 0 ? `${count} song${count === 1 ? '' : 's'} • ${pl.description}` : pl.description}
                </Text>
              </View>
              {count > 0 ? (
                <TouchableOpacity
                  style={styles.plPlayArrow}
                  onPress={() => handlePlayAll(pl.tracks)}
                  accessibilityLabel={`Play ${pl.name}`}
                >
                  <Ionicons name="play" size={14} color={c.ink} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={c.textSubtle} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg
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
    color: c.text
  },
  subtitle: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inverse,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  createBox: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    padding: 10,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: c.border,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  createInput: {
    flex: 1,
    color: c.text,
    fontSize: 14,
    paddingHorizontal: 8
  },
  saveBtn: {
    backgroundColor: c.inverse,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center'
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  favIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  favDetails: {
    flex: 1
  },
  favTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text
  },
  favSubtitle: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  favPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.inverse,
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
    color: c.text,
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
    backgroundColor: c.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  userPlIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  userPlInfo: {
    flex: 1
  },
  userPlTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text
  },
  userPlSubtitle: {
    fontSize: 12,
    color: c.textMuted,
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
    backgroundColor: c.inverse,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 1
  },
  userPlDelete: {
    padding: 4
  },
  emptyPlaylistsCard: {
    backgroundColor: c.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    marginBottom: 24
  },
  emptyPlaylistsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
    marginTop: 8
  },
  emptyPlaylistsSub: {
    fontSize: 12,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 14
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inverse,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
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
    backgroundColor: c.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  plIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  plDetails: {
    flex: 1
  },
  plTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text
  },
  plDesc: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2
  },
  plPlayArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },

  // Detail View Styles
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6
  },
  backText: {
    color: c.ink,
    fontWeight: '700',
    fontSize: 14
  },
  detailHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  detailIconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  detailHeroInfo: {
    flex: 1
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: c.text
  },
  detailSubtitle: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  detailDeleteBtn: {
    padding: 8
  },
  detailActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.inverse,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  playAllBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  },
  addSongsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surfaceAlt,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    gap: 6
  },
  addSongsPillBtnFull: {
    flex: 1
  },
  addSongsPillBtnText: {
    color: c.text,
    fontWeight: '700',
    fontSize: 13
  },
  tracksSection: {
    gap: 8
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  trackRowActive: {
    borderColor: c.inverse,
    backgroundColor: c.surfaceAlt
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
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  trackInfo: {
    flex: 1
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text
  },
  trackTitleActive: {
    color: c.text,
    fontWeight: '800'
  },
  trackArtist: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  removeTrackBtn: {
    padding: 6
  },
  emptyDetailBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    marginTop: 10
  },
  emptyDetailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
    marginTop: 12
  },
  emptyDetailSub: {
    fontSize: 12,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inverse,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 6,
    marginTop: 14
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.45)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '82%',
    borderTopWidth: 1,
    borderColor: c.border
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: c.text
  },
  modalSub: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  modalCloseBtn: {
    padding: 4
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: c.border
  },
  modalSearchInput: {
    flex: 1,
    color: c.text,
    fontSize: 13
  },
  modalSongsList: {
    maxHeight: 320,
    marginBottom: 14
  },
  modalSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.bg,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: c.border,
    gap: 10
  },
  modalSongRowActive: {
    borderColor: c.inverse,
    backgroundColor: c.surfaceAlt
  },
  modalSongIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalSongIconActive: {
    backgroundColor: c.surfaceStrong
  },
  modalSongInfo: {
    flex: 1
  },
  modalSongTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text
  },
  modalSongTitleActive: {
    color: c.text,
    fontWeight: '800'
  },
  modalSongArtist: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  modalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8A919E',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCheckboxActive: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  modalDoneBtn: {
    backgroundColor: c.inverse,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  }
});

export default React.memo(PlaylistsScreen);
