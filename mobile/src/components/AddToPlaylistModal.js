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
import { useColors, useThemedStyles } from '../theme/ThemeContext';

export default function AddToPlaylistModal({
  visible,
  track,
  playlists = [],
  onClose,
  onToggleTrackInPlaylist,
  onCreatePlaylist
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
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
              <Ionicons name="musical-notes" size={20} color={c.ink} />
              <Text style={styles.title}>Add to Playlist</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={c.textMuted} />
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
                placeholderTextColor={c.textSubtle}
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
                <Ionicons name="close" size={18} color={c.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.createTriggerBtn} 
              onPress={() => setIsCreating(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={c.ink} />
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
                        color={isInPlaylist ? c.ink : c.textSubtle} 
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

const makeStyles = (c) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.45)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: c.border
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
    color: c.text
  },
  closeBtn: {
    padding: 6
  },
  trackCard: {
    backgroundColor: c.surfaceAlt,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: c.inverse
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text
  },
  trackArtist: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2
  },
  createTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: c.border
  },
  createTriggerText: {
    color: c.text,
    fontWeight: '700',
    fontSize: 13
  },
  createBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
    padding: 8,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: c.inverse,
    gap: 8
  },
  createInput: {
    flex: 1,
    color: c.text,
    fontSize: 14,
    paddingHorizontal: 8
  },
  saveBtn: {
    backgroundColor: c.inverse,
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
    color: c.textMuted,
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
    backgroundColor: c.bg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: c.border
  },
  playlistRowActive: {
    borderColor: c.inverse,
    backgroundColor: c.surfaceAlt
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
    color: c.text
  },
  plNameActive: {
    color: c.text
  },
  plSub: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: c.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxActive: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  emptyWrap: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: c.text,
    fontSize: 13,
    fontWeight: '600'
  },
  emptySub: {
    color: c.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4
  },
  doneBtn: {
    backgroundColor: c.inverse,
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
