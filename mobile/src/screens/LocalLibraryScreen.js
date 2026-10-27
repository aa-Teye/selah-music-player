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

export default function LocalLibraryScreen({
  localTracks,
  onAddLocalTrack,
  onBatchAddLocalTracks,
  onPlayTrack,
  currentTrack,
  isPlaying,
  onDeleteTrack
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('tracks'); // tracks, artists, albums
  const [isScanning, setIsScanning] = useState(false);

  // Auto-scan entire phone storage with expo-media-library
  const handleAutoScanDevice = async () => {
    try {
      setIsScanning(true);

      // Check existing permission first with explicit 'audio' granular permission
      let perm = await MediaLibrary.getPermissionsAsync(false, ['audio']);
      if (!perm.granted) {
        perm = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      }

      if (!perm.granted) {
        if (!perm.canAskAgain) {
          Alert.alert(
            "Audio Permission Needed",
            "Selah needs permission to read music files on your phone. Please allow 'Music and audio' permission in your device Settings -> Apps -> Selah Music Player -> Permissions.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Permission Required", 
            "Please grant media permission so Selah can scan and list the music files on your device."
          );
        }
        setIsScanning(false);
        return;
      }

      // Fetch audio assets from phone storage
      // Use modificationTime instead of creationTime to prevent Android MediaStore DATE_TAKEN column errors
      const allDiscovered = [];
      let hasNextPage = true;
      let after = undefined;
      let pageCount = 0;

      while (hasNextPage && pageCount < 5) {
        pageCount++;
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 100,
          after,
          sortBy: [[MediaLibrary.SortBy.modificationTime, false]]
        });

        if (media.assets && media.assets.length > 0) {
          for (const asset of media.assets) {
            const rawName = asset.filename || 'Audio Track';
            const cleanTitle = rawName.replace(/\.[^/.]+$/, "");
            allDiscovered.push({
              id: `local-scan-${asset.id}`,
              title: cleanTitle,
              artist: "Device Storage",
              album: "My Audio Files",
              duration: Math.round(asset.duration || 180),
              category: "local",
              sourceType: "local",
              uri: asset.uri,
              coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80",
              lyrics: `[Device Audio: ${cleanTitle}]\nOffline audio from your phone.`
            });
          }
        }

        hasNextPage = Boolean(media.hasNextPage && media.endCursor);
        after = media.endCursor;
        if (!media.assets || media.assets.length === 0) break;
      }

      if (allDiscovered.length > 0) {
        if (onBatchAddLocalTracks) {
          onBatchAddLocalTracks(allDiscovered);
        }
        Alert.alert(
          "Scan Complete! 🎵", 
          `Found and added ${allDiscovered.length} audio file${allDiscovered.length === 1 ? '' : 's'} on your phone.`
        );
      } else {
        Alert.alert(
          "No Audio Files Found", 
          "No MP3 or audio files were detected in your device music folders. You can still use 'Import' to select files or folders directly."
        );
      }
    } catch (err) {
      console.log('Error scanning media, attempting fallback:', err);
      // Fallback query without custom sortBy if device ROM has non-standard MediaStore column layout
      try {
        const fallbackMedia = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 150
        });

        if (fallbackMedia.assets && fallbackMedia.assets.length > 0) {
          const fallbackTracks = fallbackMedia.assets.map((asset) => {
            const rawName = asset.filename || 'Audio Track';
            const cleanTitle = rawName.replace(/\.[^/.]+$/, "");
            return {
              id: `local-scan-${asset.id}`,
              title: cleanTitle,
              artist: "Device Storage",
              album: "My Audio Files",
              duration: Math.round(asset.duration || 180),
              category: "local",
              sourceType: "local",
              uri: asset.uri,
              coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80",
              lyrics: `[Device Audio: ${cleanTitle}]\nOffline audio from your phone.`
            };
          });

          if (onBatchAddLocalTracks) {
            onBatchAddLocalTracks(fallbackTracks);
          }
          Alert.alert(
            "Scan Complete! 🎵", 
            `Found ${fallbackTracks.length} audio file${fallbackTracks.length === 1 ? '' : 's'} on your phone.`
          );
          return;
        }
      } catch (fallbackErr) {
        console.log('Fallback scan failed:', fallbackErr);
      }

      Alert.alert(
        "Scan Notice", 
        `Could not scan media: ${err?.message || 'Storage permission or MediaStore query error'}.\n\nYou can use the "Import" button to pick music files directly.`
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Pick individual files or batch select via DocumentPicker
  const handlePickAudio = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        multiple: true,
        copyToCacheDirectory: true
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const importedTracks = res.assets.map((file, idx) => ({
          id: `local-${Date.now()}-${idx}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "My Phone Storage",
          album: "Local Library",
          duration: 180,
          category: "local",
          sourceType: "local",
          uri: file.uri,
          coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80",
          lyrics: `[Local Audio Track: ${file.name}]\nPlaying from your phone storage.`
        }));

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

  // Filter local tracks
  const filteredTracks = localTracks.filter(t => 
    t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(filterQuery.toLowerCase())
  );

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

          {/* Sub-tabs */}
          <View style={styles.subTabsRow}>
            <TouchableOpacity 
              style={[styles.subTab, activeSubTab === 'tracks' && styles.subTabActive]} 
              onPress={() => setActiveSubTab('tracks')}
            >
              <Text style={[styles.subTabText, activeSubTab === 'tracks' && styles.subTabTextActive]}>
                All Songs ({localTracks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.subTab, activeSubTab === 'artists' && styles.subTabActive]} 
              onPress={() => setActiveSubTab('artists')}
            >
              <Text style={[styles.subTabText, activeSubTab === 'artists' && styles.subTabTextActive]}>
                Artists ({Object.keys(artistsMap).length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tracks List */}
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

                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => onDeleteTrack && onDeleteTrack(item.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Artists List */}
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
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)',
    gap: 6
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
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4
  },
  importBtnText: {
    color: '#0A0D14',
    fontWeight: '700',
    fontSize: 12
  },
  emptyCard: {
    backgroundColor: '#121824',
    borderRadius: 20,
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
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12
  },
  heroScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5A93C',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10
  },
  heroScanBtnText: {
    color: '#0A0D14',
    fontWeight: '800',
    fontSize: 15
  },
  heroImportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 6,
    width: '100%',
    justifyContent: 'center'
  },
  heroImportBtnText: {
    color: '#E5A93C',
    fontWeight: '600',
    fontSize: 14
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 8
  },
  searchInput: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 14,
    padding: 0
  },
  subTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  subTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#121824',
    borderWidth: 1,
    borderColor: '#1F2937'
  },
  subTabActive: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderColor: '#E5A93C'
  },
  subTabText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600'
  },
  subTabTextActive: {
    color: '#E5A93C',
    fontWeight: '700'
  },
  songsList: {
    gap: 8
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 12
  },
  songCardActive: {
    borderColor: '#E5A93C',
    backgroundColor: 'rgba(229, 169, 60, 0.08)'
  },
  songIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#1A2333',
    justifyContent: 'center',
    alignItems: 'center'
  },
  songInfo: {
    flex: 1
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 3
  },
  songTitleActive: {
    color: '#E5A93C'
  },
  songArtist: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  deleteBtn: {
    padding: 6
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
