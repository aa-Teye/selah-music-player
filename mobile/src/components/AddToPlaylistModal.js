import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddToPlaylistModal({
  visible,
  track,
  playlists = [],
  onClose,
  onToggleTrackInPlaylist,
  onCreatePlaylist
}) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!track) return null;

  const handleCreate = () => {
    if (!newPlaylistName.trim()) {
      Alert.alert("Playlist Name", "Please enter a name for the new playlist.");
      return;
    }
    if (onCreatePlaylist) {
      onCreatePlaylist(newPlaylistName.trim(), track.id);
    }
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="musical-notes" size={20} color="#E5A93C" />
              <Text style={styles.title}>Add to Playlist</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Track Summary */}
          <View style={styles.trackCard}>
            <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>{track.artist || 'Unknown Artist'}</Text>
          </View>

          {/* Quick Create Playlist Input */}
          {isCreating ? (
            <View style={styles.createBox}>
              <TextInput
                style={styles.createInput}
                placeholder="New playlist name..."
                placeholderTextColor="#6B7280"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsCreating(false)}
              >
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.createTriggerBtn} 
              onPress={() => setIsCreating(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#E5A93C" />
              <Text style={styles.createTriggerText}>Create New Playlist</Text>
            </TouchableOpacity>
          )}

          {/* Playlists List */}
          <Text style={styles.sectionHeader}>Choose Playlist</Text>
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
            {playlists.length > 0 ? (
              playlists.map((pl) => {
                const isInPlaylist = pl.trackIds && pl.trackIds.includes(track.id);
                return (
                  <TouchableOpacity
                    key={pl.id}
                    style={[styles.playlistRow, isInPlaylist && styles.playlistRowActive]}
                    onPress={() => onToggleTrackInPlaylist(pl.id, track.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.plInfo}>
                      <Ionicons 
                        name={isInPlaylist ? "folder" : "folder-outline"} 
                        size={22} 
                        color={isInPlaylist ? "#E5A93C" : "#9CA3AF"} 
                      />
                      <View style={styles.plTextWrap}>
                        <Text style={[styles.plName, isInPlaylist && styles.plNameActive]} numberOfLines={1}>
                          {pl.name}
                        </Text>
                        <Text style={styles.plSub}>
                          {(pl.trackIds || []).length} track{(pl.trackIds || []).length === 1 ? '' : 's'}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.checkbox, isInPlaylist && styles.checkboxActive]}>
                      {isInPlaylist && <Ionicons name="checkmark" size={16} color="#0A0D14" />}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No custom playlists created yet.</Text>
                <Text style={styles.emptySub}>Tap "Create New Playlist" above to make your first one!</Text>
              </View>
            )}
          </ScrollView>

          {/* Done Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#121824',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F9FAFB'
  },
  closeBtn: {
    padding: 4
  },
  trackCard: {
    backgroundColor: '#1A2234',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#E5A93C'
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F3F4F6'
  },
  trackArtist: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  createTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)'
  },
  createTriggerText: {
    color: '#E5A93C',
    fontWeight: '700',
    fontSize: 13
  },
  createBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2234',
    borderRadius: 12,
    padding: 8,
    marginBottom: 14,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  saveBtnText: {
    color: '#0A0D14',
    fontWeight: '700',
    fontSize: 12
  },
  cancelBtn: {
    padding: 6
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  listScroll: {
    maxHeight: 240
  },
  listContent: {
    paddingBottom: 10
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A2234',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#263147'
  },
  playlistRowActive: {
    borderColor: 'rgba(229, 169, 60, 0.5)',
    backgroundColor: 'rgba(229, 169, 60, 0.08)'
  },
  plInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  plTextWrap: {
    flex: 1
  },
  plName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB'
  },
  plNameActive: {
    color: '#E5A93C'
  },
  plSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C'
  },
  emptyWrap: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600'
  },
  emptySub: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4
  },
  doneBtn: {
    backgroundColor: '#E5A93C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  doneBtnText: {
    color: '#0A0D14',
    fontWeight: '800',
    fontSize: 14
  }
});
