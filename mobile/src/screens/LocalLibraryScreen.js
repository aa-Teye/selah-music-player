import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { ScannerService } from '../services/scannerService';
import ScanStatusBanner from '../components/ScanStatusBanner';
import ShowMoreButton from '../components/ShowMoreButton';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

function LocalLibraryScreen({
  localTracks = [],
  searchQuery = '',
  onAddLocalTrack,
  onBatchAddLocalTracks,
  onPlayTrack,
  currentTrack,
  isPlaying,
  onDeleteTrack,
  onOpenAddToPlaylist,
  onOpenSetRingtone,
  onOpenEditTags,
  scanStatus,
  onScan
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [activeSubTab, setActiveSubTab] = useState('tracks'); // 'tracks' | 'folders' | 'artists'
  const [selectedFolder, setSelectedFolder] = useState(null);
  const isScanning = scanStatus?.state === 'scanning';
  const [tracksLimit, setTracksLimit] = useState(60);
  const [folderLimit, setFolderLimit] = useState(60);
  const [artistsLimit, setArtistsLimit] = useState(80);
  const [filterQuery, setFilterQuery] = useState('');

  // Scan the phone (Android) or Selah's folder (iPhone). Progress shows live in the banner.
  const handleAutoScanDevice = async (silent = false) => {
    if (!onScan) return;
    const res = await onScan();
    if (!res || silent) return;

    if (res.success) {
      const count = res.tracks ? res.tracks.length : 0;
      if (count > 0) {
        Alert.alert(
          "Scan Complete! 🎵",
          `Found ${count} song${count === 1 ? '' : 's'} ${Platform.OS === 'android' ? 'on your phone' : "in Selah's folder"}.`
        );
      } else {
        Alert.alert(
          Platform.OS === 'android' ? "No Music Found" : "No Songs in Selah's Folder Yet",
          Platform.OS === 'android'
            ? "No audio files were found on this phone. You can pick music files directly from your Downloads or Files app."
            : "iPhone doesn't let apps scan the whole phone. Import songs from the Files app, or copy music into Files › On My iPhone › Selah, then scan again.",
          [
            { text: "Later", style: "cancel" },
            { text: "Select Files Directly", onPress: handlePickAudio }
          ]
        );
      }
    } else if (res.error === 'Permission not granted') {
      Alert.alert(
        "Audio Permission Needed",
        'Selah needs permission to read music files on your phone. Please allow "Music and audio" in Settings.',
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              Linking.openSettings?.()?.catch?.(() => {});
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Scan Notice",
        `Could not scan media: ${res.error || 'Storage error'}.\n\nYou can use the "Import" button to pick music files directly.`
      );
    }
  };

  // Auto-scan on component mount if no local tracks loaded yet
  React.useEffect(() => {
    if (Platform.OS === 'android' && localTracks.length === 0) {
      handleAutoScanDevice(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick individual files or batch select via DocumentPicker with ID3 enrichment
  const handlePickAudio = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', '*/*'],
        multiple: true,
        copyToCacheDirectory: true
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        // Filter out non-audio files if user selected via wildcard
        const audioAssets = res.assets.filter((file) => {
          const name = (file.name || '').toLowerCase();
          const mime = (file.mimeType || '').toLowerCase();
          return (
            mime.startsWith('audio/') || ScannerService.isAudioFileName(name)
          );
        });

        if (audioAssets.length === 0) {
          Alert.alert("No Audio Selected", "Please select music files (.mp3, .m4a, .wav, .flac, .aac, .ogg, etc.).");
          return;
        }

        // Copy the songs into Selah's own folder so they keep working later
        const importedTracks = await ScannerService.importPickedFiles(audioAssets);

        if (importedTracks.length > 1) {
          if (onBatchAddLocalTracks) {
            onBatchAddLocalTracks(importedTracks);
          }
          Alert.alert("Songs Imported! 🎵", `Imported ${importedTracks.length} songs into your local library!`);
        } else if (importedTracks.length === 1) {
          const singleTrack = importedTracks[0];
          onAddLocalTrack(singleTrack);
          onPlayTrack(singleTrack);
          Alert.alert("Song Imported! 🎵", `"${singleTrack.title}" added to your local library!`);
        }
      }
    } catch (err) {
      console.log('Error picking audio:', err);
    }
  };

  // Filter local tracks with global searchQuery
  const activeQuery = (searchQuery || '').trim().toLowerCase();
  const filteredTracks = localTracks.filter(t => {
    if (!activeQuery) return true;
    return (
      (t.title && t.title.toLowerCase().includes(activeQuery)) ||
      (t.artist && t.artist.toLowerCase().includes(activeQuery)) ||
      (t.album && t.album.toLowerCase().includes(activeQuery)) ||
      (t.folder && t.folder.toLowerCase().includes(activeQuery))
    );
  });

  // Group by folders
  const foldersMap = {};
  localTracks.forEach(t => {
    const folder = t.folder || "Music";
    if (!foldersMap[folder]) foldersMap[folder] = [];
    foldersMap[folder].push(t);
  });

  // Group by artists
  const artistsMap = {};
  localTracks.forEach(t => {
    const artist = t.artist || "Unknown Artist";
    if (!artistsMap[artist]) artistsMap[artist] = [];
    artistsMap[artist].push(t);
  });

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Local Music</Text>
          <Text style={styles.subtitle}>{localTracks.length} offline song{localTracks.length === 1 ? '' : 's'} on device</Text>
        </View>

        <View style={styles.actionBtns}>
          <TouchableOpacity 
            style={[styles.scanBtn, isScanning && styles.btnDisabled]} 
            onPress={() => handleAutoScanDevice(false)}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color={c.ink} />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color={c.ink} />
                <Text style={styles.scanBtnText}>Rescan</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.importBtn} onPress={handlePickAudio}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.importBtnText}>Import</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScanStatusBanner status={scanStatus} showDone />

      {/* Auto-Scan Banner if Library is empty */}
      {localTracks.length === 0 && (
        <View style={styles.emptyCard}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="folder-music" size={32} color={c.ink} />
          </View>
          <Text style={styles.emptyTitle}>No Local Songs Found Yet</Text>
          <Text style={styles.emptySub}>
            {Platform.OS === 'android'
              ? 'Scan your phone to find every song in every audio format, or import files directly.'
              : 'Import songs from the Files app, or copy music into Files › On My iPhone › Selah and scan.'}
          </Text>

          <TouchableOpacity 
            style={styles.heroScanBtn} 
            onPress={() => handleAutoScanDevice(false)}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="scan" size={18} color="#FFFFFF" />
                <Text style={styles.heroScanBtnText}>{Platform.OS === 'android' ? 'Scan My Phone for Music' : "Scan Selah's Folder"}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.heroImportBtn} onPress={handlePickAudio}>
            <Ionicons name="folder-open-outline" size={16} color={c.ink} />
            <Text style={styles.heroImportBtnText}>Import from Files</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* If songs exist, show Search & Subtabs */}
      {localTracks.length > 0 && (
        <>
          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={c.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your phone library..."
              placeholderTextColor={c.textSubtle}
              value={filterQuery}
              onChangeText={setFilterQuery}
            />
            {filterQuery ? (
              <TouchableOpacity onPress={() => setFilterQuery('')}>
                <Ionicons name="close-circle" size={16} color={c.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Sub-tabs: Songs, Folders, Artists */}
          <View style={styles.subTabsRow}>
            <TouchableOpacity 
              style={[styles.subTab, activeSubTab === 'tracks' && styles.subTabActive]} 
              onPress={() => { setActiveSubTab('tracks'); setSelectedFolder(null); }}
            >
              <Text style={[styles.subTabText, activeSubTab === 'tracks' && styles.subTabTextActive]}>
                All Songs ({localTracks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.subTab, activeSubTab === 'folders' && styles.subTabActive]} 
              onPress={() => setActiveSubTab('folders')}
            >
              <Text style={[styles.subTabText, activeSubTab === 'folders' && styles.subTabTextActive]}>
                Folders ({Object.keys(foldersMap).length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.subTab, activeSubTab === 'artists' && styles.subTabActive]} 
              onPress={() => { setActiveSubTab('artists'); setSelectedFolder(null); }}
            >
              <Text style={[styles.subTabText, activeSubTab === 'artists' && styles.subTabTextActive]}>
                Artists ({Object.keys(artistsMap).length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ==================== SUB-TAB 1: ALL TRACKS ==================== */}
          {activeSubTab === 'tracks' && (
            <View style={styles.songsList}>
              {filteredTracks.slice(0, tracksLimit).map((item) => {
                const isCurrent = currentTrack?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.songCard, isCurrent && styles.songCardActive]}
                    onPress={() => onPlayTrack(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.songIconBox}>
                      <Ionicons 
                        name={isCurrent && isPlaying ? "volume-high" : "musical-note"} 
                        size={20} 
                        color={isCurrent ? c.ink : c.textSubtle} 
                      />
                    </View>

                    <View style={styles.songInfo}>
                      <Text 
                        style={[styles.songTitle, isCurrent && styles.songTitleActive]} 
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.songArtist} numberOfLines={1}>
                        {item.artist} • {formatTime(item.duration)}
                      </Text>
                    </View>

                    <View style={styles.songActions}>
                      {/* Edit Tags */}
                      {onOpenEditTags && (
                        <TouchableOpacity 
                          style={styles.actionIconBtn}
                          onPress={() => onOpenEditTags(item)}
                        >
                          <MaterialCommunityIcons name="tag-outline" size={18} color={c.textMuted} />
                        </TouchableOpacity>
                      )}

                      {/* Set as Ringtone / Caller Tune */}
                      {onOpenSetRingtone && (
                        <TouchableOpacity 
                          style={styles.actionIconBtn}
                          onPress={() => onOpenSetRingtone(item)}
                        >
                          <Ionicons name="notifications-outline" size={18} color={c.textMuted} />
                        </TouchableOpacity>
                      )}

                      {/* Add to Playlist */}
                      {onOpenAddToPlaylist && (
                        <TouchableOpacity 
                          style={styles.actionIconBtn}
                          onPress={() => onOpenAddToPlaylist(item)}
                        >
                          <Ionicons name="bookmark-outline" size={18} color={c.ink} />
                        </TouchableOpacity>
                      )}

                      {/* Delete */}
                      <TouchableOpacity 
                        style={styles.actionIconBtn}
                        onPress={() => onDeleteTrack && onDeleteTrack(item.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color={c.textSubtle} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <ShowMoreButton remaining={filteredTracks.length - tracksLimit} onPress={() => setTracksLimit((n) => n + 60)} />
            </View>
          )}

          {/* ==================== SUB-TAB 2: FOLDER BROWSER ==================== */}
          {activeSubTab === 'folders' && (
            <View style={styles.folderContainer}>
              {selectedFolder ? (
                // Inside a specific folder
                <View>
                  <TouchableOpacity 
                    style={styles.folderBackBtn} 
                    onPress={() => setSelectedFolder(null)}
                  >
                    <Ionicons name="arrow-back" size={18} color={c.ink} />
                    <Text style={styles.folderBackText}>All Folders</Text>
                  </TouchableOpacity>

                  <View style={styles.folderHeaderCard}>
                    <Ionicons name="folder-open" size={28} color={c.ink} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.folderHeaderTitle}>{selectedFolder}</Text>
                      <Text style={styles.folderHeaderSub}>
                        {(foldersMap[selectedFolder] || []).length} audio tracks
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.playFolderBtn}
                      onPress={() => {
                        const tracksInFolder = foldersMap[selectedFolder];
                        if (tracksInFolder && tracksInFolder.length > 0) {
                          onPlayTrack(tracksInFolder[0]);
                        }
                      }}
                    >
                      <Ionicons name="play" size={16} color="#FFFFFF" />
                      <Text style={styles.playFolderText}>Play Folder</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.songsList}>
                    {(foldersMap[selectedFolder] || []).slice(0, folderLimit).map((item) => {
                      const isCurrent = currentTrack?.id === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.songCard, isCurrent && styles.songCardActive]}
                          onPress={() => onPlayTrack(item)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.songIconBox}>
                            <Ionicons 
                              name={isCurrent && isPlaying ? "volume-high" : "musical-note"} 
                              size={20} 
                              color={isCurrent ? c.ink : c.textSubtle} 
                            />
                          </View>
                          <View style={styles.songInfo}>
                            <Text style={[styles.songTitle, isCurrent && styles.songTitleActive]} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.songArtist} numberOfLines={1}>
                              {item.artist} • {formatTime(item.duration)}
                            </Text>
                          </View>
                          <View style={styles.cardActions}>
                            {onOpenEditTags && (
                              <TouchableOpacity style={styles.actionIconBtn} onPress={() => onOpenEditTags(item)}>
                                <MaterialCommunityIcons name="tag-outline" size={18} color={c.textMuted} />
                              </TouchableOpacity>
                            )}
                            {onOpenSetRingtone && (
                              <TouchableOpacity style={styles.actionIconBtn} onPress={() => onOpenSetRingtone(item)}>
                                <Ionicons name="notifications-outline" size={18} color={c.textMuted} />
                              </TouchableOpacity>
                            )}
                            {onOpenAddToPlaylist && (
                              <TouchableOpacity style={styles.actionIconBtn} onPress={() => onOpenAddToPlaylist(item)}>
                                <Ionicons name="bookmark-outline" size={18} color={c.ink} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <ShowMoreButton
                      remaining={(foldersMap[selectedFolder] || []).length - folderLimit}
                      onPress={() => setFolderLimit((n) => n + 60)}
                    />
                  </View>
                </View>
              ) : (
                // List of all folders
                <View style={styles.foldersGrid}>
                  {Object.keys(foldersMap).map((folderName) => {
                    const count = foldersMap[folderName].length;
                    return (
                      <TouchableOpacity
                        key={folderName}
                        style={styles.folderCard}
                        onPress={() => {
                          setSelectedFolder(folderName);
                          setFolderLimit(60);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.folderIconBox}>
                          <Ionicons name="folder" size={26} color={c.ink} />
                        </View>
                        <View style={styles.folderDetails}>
                          <Text style={styles.folderName} numberOfLines={1}>{folderName}</Text>
                          <Text style={styles.folderCount}>{count} track{count === 1 ? '' : 's'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={c.textSubtle} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ==================== SUB-TAB 3: ARTISTS ==================== */}
          {activeSubTab === 'artists' && (
            <View style={styles.artistsList}>
              {Object.keys(artistsMap).slice(0, artistsLimit).map((artistName) => (
                <View key={artistName} style={styles.artistCard}>
                  <View style={styles.artistAvatar}>
                    <Text style={styles.artistInitial}>{artistName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.artistDetails}>
                    <Text style={styles.artistNameText}>{artistName}</Text>
                    <Text style={styles.artistCountText}>
                      {artistsMap[artistName].length} track{artistsMap[artistName].length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.artistPlayBtn}
                    onPress={() => onPlayTrack(artistsMap[artistName][0])}
                  >
                    <Ionicons name="play" size={16} color={c.ink} />
                  </TouchableOpacity>
                </View>
              ))}
              <ShowMoreButton remaining={Object.keys(artistsMap).length - artistsLimit} onPress={() => setArtistsLimit((n) => n + 80)} />
            </View>
          )}
        </>
      )}
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
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    gap: 5
  },
  btnDisabled: {
    opacity: 0.6
  },
  scanBtnText: {
    color: c.ink,
    fontWeight: '700',
    fontSize: 12
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inverse,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4
  },
  importBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  emptyCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: c.border
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: c.text,
    marginBottom: 6
  },
  emptySub: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  heroScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inverse,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10
  },
  heroScanBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  },
  heroImportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border
  },
  heroImportBtnText: {
    color: c.ink,
    fontWeight: '700',
    fontSize: 13
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: c.border,
    gap: 8
  },
  searchInput: {
    flex: 1,
    color: c.text,
    fontSize: 13
  },
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: c.border
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9
  },
  subTabActive: {
    backgroundColor: c.inverse
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textMuted
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  songsList: {
    gap: 8
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  songCardActive: {
    borderColor: c.inverse,
    backgroundColor: c.surfaceAlt
  },
  songIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  songInfo: {
    flex: 1
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text
  },
  songTitleActive: {
    color: c.ink
  },
  songArtist: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionIconBtn: {
    padding: 6
  },
  folderContainer: {
    gap: 10
  },
  foldersGrid: {
    gap: 8
  },
  folderCard: {
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
    shadowRadius: 2,
    elevation: 1
  },
  folderIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  folderDetails: {
    flex: 1
  },
  folderName: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text
  },
  folderCount: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  folderBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  folderBackText: {
    color: c.ink,
    fontWeight: '700',
    fontSize: 13
  },
  folderHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  folderHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: c.text
  },
  folderHeaderSub: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  playFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inverse,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4
  },
  playFolderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  artistsList: {
    gap: 8
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  artistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  },
  artistInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: c.ink
  },
  artistDetails: {
    flex: 1
  },
  artistNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
    marginBottom: 2
  },
  artistCountText: {
    fontSize: 12,
    color: c.textMuted
  },
  artistPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border
  }
});

export default React.memo(LocalLibraryScreen);
