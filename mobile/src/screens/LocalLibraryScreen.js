import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { Id3Service } from '../services/id3Service';

export default function LocalLibraryScreen({
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
  onOpenEditTags
}) {
  const [activeSubTab, setActiveSubTab] = useState('tracks'); // 'tracks' | 'folders' | 'artists'
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Auto-scan phone storage across all Android versions
  const handleAutoScanDevice = async () => {
    try {
      setIsScanning(true);

      // Check existing permission first across Android 10-15
      let perm = await MediaLibrary.getPermissionsAsync();
      if (!perm.granted) {
        try {
          perm = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
        } catch (_) {
          perm = await MediaLibrary.requestPermissionsAsync();
        }
      }

      if (!perm.granted) {
        // Fallback request
        try {
          perm = await MediaLibrary.requestPermissionsAsync();
        } catch (_) {}
      }

      if (!perm.granted) {
        Alert.alert(
          "Audio Permission Needed",
          "Selah needs permission to read music files on your phone. Please grant 'Music and audio' permission in your device Settings -> Apps -> Selah Music Player -> Permissions.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings && Linking.openSettings() }
          ]
        );
        setIsScanning(false);
        return;
      }

      // Fetch audio assets from phone storage (safe across all phone manufacturers)
      const allDiscovered = [];
      let hasNextPage = true;
      let after = undefined;
      let pageCount = 0;

      while (hasNextPage && pageCount < 10) {
        pageCount++;
        const options = {
          mediaType: [MediaLibrary.MediaType.audio],
          first: 100
        };
        if (after) {
          options.after = String(after);
        }

        const media = await MediaLibrary.getAssetsAsync(options);

        if (media && media.assets && media.assets.length > 0) {
          for (const asset of media.assets) {
            allDiscovered.push(Id3Service.enrichAsset(asset));
          }
        }

        hasNextPage = Boolean(media.hasNextPage && media.endCursor && media.endCursor !== after);
        after = media.endCursor;
        if (!media.assets || media.assets.length === 0) break;
      }

      // If audio query returned 0 files, check general media assets for audio extensions
      if (allDiscovered.length === 0) {
        try {
          const fallback = await MediaLibrary.getAssetsAsync({ first: 200 });
          if (fallback && fallback.assets) {
            for (const asset of fallback.assets) {
              const fname = (asset.filename || asset.uri || '').toLowerCase();
              if (
                fname.endsWith('.mp3') ||
                fname.endsWith('.m4a') ||
                fname.endsWith('.wav') ||
                fname.endsWith('.aac') ||
                fname.endsWith('.flac') ||
                fname.endsWith('.ogg')
              ) {
                allDiscovered.push(Id3Service.enrichAsset(asset));
              }
            }
          }
        } catch (fallbackErr) {
          console.log('Secondary media scan fallback notice:', fallbackErr);
        }
      }

      if (allDiscovered.length > 0) {
        if (onBatchAddLocalTracks) {
          onBatchAddLocalTracks(allDiscovered);
        }
        Alert.alert(
          "Scan Complete! 🎵", 
          `Found and added ${allDiscovered.length} actual music file${allDiscovered.length === 1 ? '' : 's'} from your phone.`
        );
      } else {
        Alert.alert(
          "No Audio Files Found", 
          "No music files were detected in standard Android media folders. You can tap 'Import' to select your audio files directly from any folder."
        );
      }
    } catch (err) {
      console.log('Error scanning media:', err);
      Alert.alert(
        "Scan Notice", 
        `Could not scan media: ${err?.message || 'Storage error'}.\n\nYou can use the "Import" button to pick music files directly.`
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Pick individual files or batch select via DocumentPicker with ID3 enrichment
  const handlePickAudio = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        multiple: true,
        copyToCacheDirectory: true
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const importedTracks = res.assets.map((file, idx) => {
          const rawName = file.name || 'Audio Track';
          const meta = Id3Service.parseFilenameMetadata(rawName);
          const cover = Id3Service.generateCuratedArtwork(meta.title, meta.artist);

          return {
            id: `local-${Date.now()}-${idx}`,
            title: meta.title,
            artist: meta.artist,
            album: meta.album,
            folder: 'Imported Files',
            duration: 180,
            category: "local",
            sourceType: "local",
            uri: file.uri,
            coverUrl: cover,
            lyrics: `[Local Audio Track: ${file.name}]\nPlaying from your phone storage.`
          };
        });

        if (importedTracks.length > 1) {
          if (onBatchAddLocalTracks) {
            onBatchAddLocalTracks(importedTracks);
          }
          Alert.alert("Songs Imported", `Imported ${importedTracks.length} songs into your local library!`);
        } else if (importedTracks.length === 1) {
          const singleTrack = importedTracks[0];
          onAddLocalTrack(singleTrack);
          onPlayTrack(singleTrack);
          Alert.alert("Song Imported", `"${singleTrack.title}" added to your local library!`);
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
            onPress={handleAutoScanDevice}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#E5A93C" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#E5A93C" />
                <Text style={styles.scanBtnText}>Auto-Scan</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.importBtn} onPress={handlePickAudio}>
            <Ionicons name="add" size={16} color="#0A0D14" />
            <Text style={styles.importBtnText}>Import</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Auto-Scan Banner if Library is empty */}
      {localTracks.length === 0 && (
        <View style={styles.emptyCard}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="folder-music" size={32} color="#E5A93C" />
          </View>
          <Text style={styles.emptyTitle}>No Local Songs Found Yet</Text>
          <Text style={styles.emptySub}>
            Auto-scan your device storage to find all MP3 and music files, or import them directly.
          </Text>

          <TouchableOpacity 
            style={styles.heroScanBtn} 
            onPress={handleAutoScanDevice}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#0A0D14" />
            ) : (
              <>
                <Ionicons name="scan" size={18} color="#0A0D14" />
                <Text style={styles.heroScanBtnText}>Auto-Scan All Device Songs</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.heroImportBtn} onPress={handlePickAudio}>
            <Ionicons name="folder-open-outline" size={16} color="#E5A93C" />
            <Text style={styles.heroImportBtnText}>Pick from Files</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* If songs exist, show Search & Subtabs */}
      {localTracks.length > 0 && (
        <>
          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your phone library..."
              placeholderTextColor="#6B7280"
              value={filterQuery}
              onChangeText={setFilterQuery}
            />
            {filterQuery ? (
              <TouchableOpacity onPress={() => setFilterQuery('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
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
              {filteredTracks.map((item) => {
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
                        color={isCurrent ? "#E5A93C" : "#9CA3AF"} 
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
                          <MaterialCommunityIcons name="tag-outline" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}

                      {/* Set as Ringtone / Caller Tune */}
                      {onOpenSetRingtone && (
                        <TouchableOpacity 
                          style={styles.actionIconBtn}
                          onPress={() => onOpenSetRingtone(item)}
                        >
                          <Ionicons name="notifications-outline" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}

                      {/* Add to Playlist */}
                      {onOpenAddToPlaylist && (
                        <TouchableOpacity 
                          style={styles.actionIconBtn}
                          onPress={() => onOpenAddToPlaylist(item)}
                        >
                          <Ionicons name="bookmark-outline" size={18} color="#E5A93C" />
                        </TouchableOpacity>
                      )}

                      {/* Delete */}
                      <TouchableOpacity 
                        style={styles.actionIconBtn}
                        onPress={() => onDeleteTrack && onDeleteTrack(item.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
                    <Ionicons name="arrow-back" size={18} color="#E5A93C" />
                    <Text style={styles.folderBackText}>All Folders</Text>
                  </TouchableOpacity>

                  <View style={styles.folderHeaderCard}>
                    <Ionicons name="folder-open" size={28} color="#E5A93C" />
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
                      <Ionicons name="play" size={16} color="#0A0D14" />
                      <Text style={styles.playFolderText}>Play Folder</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.songsList}>
                    {(foldersMap[selectedFolder] || []).map((item) => {
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
                              color={isCurrent ? "#E5A93C" : "#9CA3AF"} 
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
                                <MaterialCommunityIcons name="tag-outline" size={18} color="#9CA3AF" />
                              </TouchableOpacity>
                            )}
                            {onOpenSetRingtone && (
                              <TouchableOpacity style={styles.actionIconBtn} onPress={() => onOpenSetRingtone(item)}>
                                <Ionicons name="notifications-outline" size={18} color="#9CA3AF" />
                              </TouchableOpacity>
                            )}
                            {onOpenAddToPlaylist && (
                              <TouchableOpacity style={styles.actionIconBtn} onPress={() => onOpenAddToPlaylist(item)}>
                                <Ionicons name="bookmark-outline" size={18} color="#E5A93C" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
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
                        onPress={() => setSelectedFolder(folderName)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.folderIconBox}>
                          <Ionicons name="folder" size={26} color="#E5A93C" />
                        </View>
                        <View style={styles.folderDetails}>
                          <Text style={styles.folderName} numberOfLines={1}>{folderName}</Text>
                          <Text style={styles.folderCount}>{count} track{count === 1 ? '' : 's'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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
              {Object.keys(artistsMap).map((artistName) => (
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
                    <Ionicons name="play" size={16} color="#E5A93C" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </>
      )}
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
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5A93C',
    gap: 5
  },
  btnDisabled: {
    opacity: 0.6
  },
  scanBtnText: {
    color: '#E5A93C',
    fontWeight: '700',
    fontSize: 12
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5A93C',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4
  },
  importBtnText: {
    color: '#0A0D14',
    fontWeight: '800',
    fontSize: 12
  },
  emptyCard: {
    backgroundColor: '#121824',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
    marginTop: 10
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 6
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  heroScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5A93C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10
  },
  heroScanBtnText: {
    color: '#0A0D14',
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
    backgroundColor: '#1A2234',
    borderWidth: 1,
    borderColor: '#374151'
  },
  heroImportBtnText: {
    color: '#E5A93C',
    fontWeight: '700',
    fontSize: 13
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 8
  },
  searchInput: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 13
  },
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#121824',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9
  },
  subTabActive: {
    backgroundColor: '#E5A93C'
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF'
  },
  subTabTextActive: {
    color: '#0A0D14',
    fontWeight: '800'
  },
  songsList: {
    gap: 8
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 12
  },
  songCardActive: {
    borderColor: 'rgba(229, 169, 60, 0.5)',
    backgroundColor: 'rgba(229, 169, 60, 0.08)'
  },
  songIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1A2234',
    justifyContent: 'center',
    alignItems: 'center'
  },
  songInfo: {
    flex: 1
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB'
  },
  songTitleActive: {
    color: '#E5A93C'
  },
  songArtist: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
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
    backgroundColor: '#121824',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 12
  },
  folderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  folderDetails: {
    flex: 1
  },
  folderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB'
  },
  folderCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  folderBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  folderBackText: {
    color: '#E5A93C',
    fontWeight: '700',
    fontSize: 13
  },
  folderHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 12,
    gap: 12
  },
  folderHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB'
  },
  folderHeaderSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  playFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5A93C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4
  },
  playFolderText: {
    color: '#0A0D14',
    fontWeight: '700',
    fontSize: 12
  },
  artistsList: {
    gap: 8
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 12
  },
  artistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5A93C',
    justifyContent: 'center',
    alignItems: 'center'
  },
  artistInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A0D14'
  },
  artistDetails: {
    flex: 1
  },
  artistNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2
  },
  artistCountText: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  artistPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
