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
              <Ionicons name="musical-notes" size={20} color="#12141A" />
              <Text style={styles.title}>Add to Playlist</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#717886" />
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
                placeholderTextColor="#8A919E"
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
                <Ionicons name="close" size={18} color="#717886" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.createTriggerBtn} 
              onPress={() => setIsCreating(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#12141A" />
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
                        color={isInPlaylist ? "#12141A" : "#8A919E"} 
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
                      {isInPlaylist && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
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
    backgroundColor: 'rgba(15, 17, 21, 0.45)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: '#E5E7EB'
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
    color: '#0F1115'
  },
  closeBtn: {
    padding: 6
  },
  trackCard: {
    backgroundColor: '#EEF0F4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#12141A'
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F1115'
  },
  trackArtist: {
    fontSize: 12,
    color: '#717886',
    marginTop: 2
  },
  createTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0F4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  createTriggerText: {
    color: '#0F1115',
    fontWeight: '700',
    fontSize: 13
  },
  createBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0F4',
    borderRadius: 12,
    padding: 8,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#12141A',
    gap: 8
  },
  createInput: {
    flex: 1,
    color: '#0F1115',
    fontSize: 14,
    paddingHorizontal: 8
  },
  saveBtn: {
    backgroundColor: '#12141A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  cancelBtn: {
    padding: 6
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#717886',
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
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  playlistRowActive: {
    borderColor: '#12141A',
    backgroundColor: '#EEF0F4'
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
    color: '#0F1115'
  },
  plNameActive: {
    color: '#0F1115'
  },
  plSub: {
    fontSize: 11,
    color: '#717886',
    marginTop: 2
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxActive: {
    backgroundColor: '#12141A',
    borderColor: '#12141A'
  },
  emptyWrap: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: '#0F1115',
    fontSize: 13,
    fontWeight: '600'
  },
  emptySub: {
    color: '#717886',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4
  },
  doneBtn: {
    backgroundColor: '#12141A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  }
});
