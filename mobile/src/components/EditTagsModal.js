import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Id3Service } from '../services/id3Service';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

export default function EditTagsModal({
  visible,
  track,
  onClose,
  onSaveTrack
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('worship');
  const [coverUrl, setCoverUrl] = useState('');

  useEffect(() => {
    if (track) {
      setTitle(track.title || '');
      setArtist(track.artist || '');
      setAlbum(track.album || '');
      setGenre(track.category || 'worship');
      setCoverUrl(track.coverUrl || '');
    }
  }, [track]);

  if (!track) return null;

  const genres = ['worship', 'praise', 'prayer', 'gospel', 'acoustic', 'sermon'];

  const handleRefreshArtwork = () => {
    const newArt = Id3Service.generateCuratedArtwork(title || track.title, artist || track.artist);
    setCoverUrl(newArt);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please provide a track title.");
      return;
    }

    const updatedTrack = {
      ...track,
      title: title.trim(),
      artist: artist.trim() || 'Selah Worship',
      album: album.trim() || 'Selah Music',
      category: genre,
      coverUrl: coverUrl || track.coverUrl
    };
    // You picked your own picture: scans will never replace it with the song's cover
    if (coverUrl && coverUrl !== track.coverUrl) {
      updatedTrack.customCover = true;
      delete updatedTrack.coverFile;
    }

    if (onSaveTrack) {
      onSaveTrack(updatedTrack);
    }
    Alert.alert("Tags Saved 🏷️", `"${title}" tags updated successfully!`);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="tag-text-outline" size={22} color={c.ink} />
              <View>
                <Text style={styles.title}>Edit Audio Tags</Text>
                <Text style={styles.subtitle}>Clean metadata on your device</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Artwork Preview & Refresh */}
          <View style={styles.artworkRow}>
            <Image
              source={{ uri: coverUrl || track.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }}
              style={styles.artworkThumb}
            />
            <View style={styles.artworkActions}>
              <Text style={styles.artworkLabel}>Cover Artwork</Text>
              <TouchableOpacity style={styles.refreshArtBtn} onPress={handleRefreshArtwork}>
                <Ionicons name="image" size={14} color="#FFFFFF" />
                <Text style={styles.refreshArtText}>Auto Match Art</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <Text style={styles.fieldLabel}>Song Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Goodness of God"
              placeholderTextColor={c.textSubtle}
            />

            <Text style={styles.fieldLabel}>Artist / Worship Leader</Text>
            <TextInput
              style={styles.input}
              value={artist}
              onChangeText={setArtist}
              placeholder="e.g. CeCe Winans"
              placeholderTextColor={c.textSubtle}
            />

            <Text style={styles.fieldLabel}>Album Name</Text>
            <TextInput
              style={styles.input}
              value={album}
              onChangeText={setAlbum}
              placeholder="e.g. Believe For It"
              placeholderTextColor={c.textSubtle}
            />

            <Text style={styles.fieldLabel}>Genre Category</Text>
            <View style={styles.genresRow}>
              {genres.map((g) => {
                const isSelected = genre === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genrePill, isSelected && styles.activeGenrePill]}
                    onPress={() => setGenre(g)}
                  >
                    <Text style={[styles.genreText, isSelected && styles.activeGenreText]}>
                      {g.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.saveText}>Save Tags</Text>
            </TouchableOpacity>
          </View>
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
  modalBox: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderTopWidth: 1,
    borderColor: c.border
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  title: {
    color: c.text,
    fontSize: 18,
    fontWeight: '800'
  },
  subtitle: {
    color: c.textMuted,
    fontSize: 12
  },
  closeBtn: {
    padding: 6
  },
  artworkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: c.surfaceAlt,
    padding: 12,
    borderRadius: 14,
    marginBottom: 16
  },
  artworkThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: c.surfaceStrong
  },
  artworkActions: {
    flex: 1
  },
  artworkLabel: {
    color: c.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6
  },
  refreshArtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: c.inverse,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  refreshArtText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  form: {
    marginBottom: 16
  },
  fieldLabel: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: c.text,
    fontSize: 13,
    marginBottom: 12
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  genrePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border
  },
  activeGenrePill: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  genreText: {
    color: c.textMuted,
    fontSize: 10,
    fontWeight: '700'
  },
  activeGenreText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10
  },
  cancelText: {
    color: c.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: c.inverse,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  }
});
