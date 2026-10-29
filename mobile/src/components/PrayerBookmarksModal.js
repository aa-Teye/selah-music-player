import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function PrayerBookmarksModal({
  visible,
  onClose,
  currentTrack,
  currentPosition = 0,
  bookmarks = [],
  onAddBookmark,
  onDeleteBookmark,
  onJumpToBookmark
}) {
  const [note, setNote] = useState('');
  const [scripture, setScripture] = useState('');
  const [filterMode, setFilterMode] = useState('current'); // 'current' | 'all'

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSavePin = () => {
    if (!currentTrack) {
      Alert.alert("No Track Playing", "Please play a song before dropping a prayer pin.");
      return;
    }

    if (!note.trim() && !scripture.trim()) {
      Alert.alert("Note Required", "Please enter a prayer thought, reflection, or scripture verse.");
      return;
    }

    if (onAddBookmark) {
      onAddBookmark({
        trackId: currentTrack.id,
        trackTitle: currentTrack.title,
        trackArtist: currentTrack.artist,
        timestamp: currentPosition,
        note: note.trim(),
        scripture: scripture.trim()
      });
    }

    setNote('');
    setScripture('');
    Alert.alert("Prayer Moment Saved 🕊️", `Pinned at ${formatTime(currentPosition)} in "${currentTrack.title}".`);
  };

  const displayedBookmarks = filterMode === 'current' && currentTrack
    ? bookmarks.filter((b) => b.trackId === currentTrack.id)
    : bookmarks;

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
              <MaterialCommunityIcons name="book-cross" size={24} color="#E5A93C" />
              <View>
                <Text style={styles.title}>Prayer & Scripture Pins</Text>
                <Text style={styles.subtitle}>Devotional Audio Moments</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* New Pin Input Card */}
          {currentTrack && (
            <View style={styles.newPinCard}>
              <View style={styles.pinTimeHeader}>
                <View style={styles.timeBadge}>
                  <Ionicons name="time" size={13} color="#0A0D14" />
                  <Text style={styles.timeBadgeText}>Pin at {formatTime(currentPosition)}</Text>
                </View>
                <Text style={styles.trackLabel} numberOfLines={1}>
                  {currentTrack.title}
                </Text>
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="Scripture reference (e.g. Psalm 23:4, Phil 4:7)"
                placeholderTextColor="#6B7280"
                value={scripture}
                onChangeText={setScripture}
              />

              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="What did God place on your heart during this moment?"
                placeholderTextColor="#6B7280"
                value={note}
                onChangeText={setNote}
                multiline
              />

              <TouchableOpacity style={styles.savePinBtn} onPress={handleSavePin}>
                <Ionicons name="bookmark" size={16} color="#0A0D14" />
                <Text style={styles.savePinBtnText}>Save Prayer Moment</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, filterMode === 'current' && styles.filterPillActive]}
              onPress={() => setFilterMode('current')}
            >
              <Text style={[styles.filterPillText, filterMode === 'current' && styles.filterPillTextActive]}>
                This Song ({currentTrack ? bookmarks.filter(b => b.trackId === currentTrack.id).length : 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filterMode === 'all' && styles.filterPillActive]}
              onPress={() => setFilterMode('all')}
            >
              <Text style={[styles.filterPillText, filterMode === 'all' && styles.filterPillTextActive]}>
                All Journal ({bookmarks.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Saved Bookmarks List */}
          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
            {displayedBookmarks.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={40} color="#4B5563" />
                <Text style={styles.emptyText}>No prayer moments recorded yet</Text>
                <Text style={styles.emptySub}>
                  Drop a pin while listening to remember where God spoke to you.
                </Text>
              </View>
            ) : (
              displayedBookmarks.map((bm) => (
                <TouchableOpacity
                  key={bm.id}
                  style={styles.bookmarkCard}
                  onPress={() => {
                    if (onJumpToBookmark) onJumpToBookmark(bm);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.bmHeader}>
                    <View style={styles.bmTimePill}>
                      <Ionicons name="play" size={10} color="#0A0D14" />
                      <Text style={styles.bmTimeText}>{formatTime(bm.timestamp)}</Text>
                    </View>
                    <Text style={styles.bmTrackTitle} numberOfLines={1}>
                      {bm.trackTitle}
                    </Text>
                    {onDeleteBookmark && (
                      <TouchableOpacity
                        style={styles.deleteBmBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          onDeleteBookmark(bm.id);
                        }}
                      >
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {bm.scripture ? (
                    <Text style={styles.bmScripture}>📖 {bm.scripture}</Text>
                  ) : null}

                  {bm.note ? (
                    <Text style={styles.bmNote}>"{bm.note}"</Text>
                  ) : null}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end'
  },
  modalBox: {
    backgroundColor: '#111622',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
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
    color: '#F3F4F6',
    fontSize: 17,
    fontWeight: '800'
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12
  },
  closeBtn: {
    padding: 6
  },
  newPinCard: {
    backgroundColor: '#171D2C',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)',
    marginBottom: 14
  },
  pinTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5A93C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  timeBadgeText: {
    color: '#0A0D14',
    fontSize: 11,
    fontWeight: '800'
  },
  trackLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8
  },
  textInput: {
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 8
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top'
  },
  savePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E5A93C',
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 4
  },
  savePinBtnText: {
    color: '#0A0D14',
    fontWeight: '800',
    fontSize: 13
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  filterPillActive: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderColor: '#E5A93C'
  },
  filterPillText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600'
  },
  filterPillTextActive: {
    color: '#E5A93C',
    fontWeight: '800'
  },
  scrollList: {
    maxHeight: 260
  },
  scrollContent: {
    paddingBottom: 20
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36
  },
  emptyText: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8
  },
  emptySub: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240
  },
  bookmarkCard: {
    backgroundColor: '#171D2C',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  bmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  bmTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E5A93C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  bmTimeText: {
    color: '#0A0D14',
    fontSize: 10,
    fontWeight: '800'
  },
  bmTrackTitle: {
    color: '#F3F4F6',
    fontSize: 12,
    fontWeight: '700',
    flex: 1
  },
  deleteBmBtn: {
    padding: 4
  },
  bmScripture: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2
  },
  bmNote: {
    color: '#D1D5DB',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16
  }
});
