import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StorageService } from '../services/storageService';

export default function SyncedLyricsView({
  currentTrack,
  currentPosition = 0,
  duration = 180,
  onSeek
}) {
  const [customLyrics, setCustomLyrics] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const scrollViewRef = useRef(null);

  // Load custom saved lyrics if any
  useEffect(() => {
    let isMounted = true;
    if (currentTrack?.id) {
      StorageService.getCustomLyrics(currentTrack.id).then((saved) => {
        if (isMounted) {
          setCustomLyrics(saved || null);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id]);

  const rawLyrics = customLyrics || currentTrack?.lyrics || defaultFallbackLyrics(currentTrack);

  // Parse LRC format: [00:15.30] lyrics text or fallback by lines
  const parsedLyrics = useMemo(() => {
    const lyricStr = typeof rawLyrics === 'string' ? rawLyrics : '';
    if (!lyricStr.trim()) return [];

    const lrcRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d+))?\](.*)/;
    const lines = lyricStr.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = [];

    let hasLrc = false;
    lines.forEach((line, idx) => {
      const match = line.match(lrcRegex);
      if (match) {
        hasLrc = true;
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const time = mins * 60 + secs;
        const text = match[4].trim();
        if (text) {
          parsed.push({ time, text, id: idx });
        }
      }
    });

    if (hasLrc && parsed.length > 0) {
      return parsed.sort((a, b) => a.time - b.time);
    }

    // Fallback: space plain lines evenly across track duration
    const trackDur = duration > 0 ? duration : 180;
    const interval = Math.max(4, Math.floor(trackDur / (lines.length || 1)));
    return lines.map((text, idx) => ({
      time: Math.min(trackDur, idx * interval),
      text,
      id: idx
    }));
  }, [rawLyrics, duration]);

  // Determine active lyric index based on currentPosition
  const activeIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    let index = 0;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentPosition >= parsedLyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [currentPosition, parsedLyrics]);

  // Auto-scroll to keep active line centered
  useEffect(() => {
    if (activeIndex >= 0 && scrollViewRef.current) {
      const estimatedLineHeight = 52;
      const targetY = Math.max(0, activeIndex * estimatedLineHeight - 160);
      scrollViewRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, [activeIndex]);

  const handleOpenEdit = () => {
    setEditText(rawLyrics || '');
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (currentTrack?.id) {
      await StorageService.saveCustomLyrics(currentTrack.id, editText.trim());
      setCustomLyrics(editText.trim());
    }
    setIsEditModalVisible(false);
    Alert.alert("Lyrics Saved 🎶", "Your custom synchronized lyrics have been saved!");
  };

  return (
    <View style={styles.container}>
      {/* Header controls for lyrics */}
      <View style={styles.headerBar}>
        <View style={styles.badgeWrap}>
          <MaterialCommunityIcons name="microphone-variant" size={14} color="#E5A93C" />
          <Text style={styles.badgeText}>REAL-TIME SYNCED LYRICS</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={handleOpenEdit}>
          <Ionicons name="pencil" size={13} color="#E5A93C" />
          <Text style={styles.editBtnText}>Edit Lyrics</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollArea} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {parsedLyrics.length > 0 ? (
          parsedLyrics.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.lineBox, isActive && styles.activeLineBox]}
                onPress={() => onSeek && onSeek(item.time)}
                activeOpacity={0.7}
              >
                <Text style={[styles.lineText, isActive && styles.activeLineText]}>
                  {item.text}
                </Text>
                {isActive && (
                  <View style={styles.activeDot} />
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="music-note-off" size={32} color="#6B7280" />
            <Text style={styles.emptyText}>No lyrics found for this song</Text>
            <TouchableOpacity style={styles.addLyricsBtn} onPress={handleOpenEdit}>
              <Text style={styles.addLyricsBtnText}>+ Add Lyrics Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Lyrics Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Lyrics</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Paste lines or synced LRC tags [00:15.00] for {currentTrack?.title}
            </Text>

            <TextInput
              style={styles.textInput}
              multiline
              value={editText}
              onChangeText={setEditText}
              placeholder="Paste devotion lyrics here..."
              placeholderTextColor="#6B7280"
              textAlignVertical="top"
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelModalBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveModalBtn}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveModalText}>Save Lyrics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function defaultFallbackLyrics(track) {
  if (!track) return '';
  return `[00:05.00] Praise the Lord, O my soul
[00:15.00] All my inmost being, praise His holy name
[00:28.00] Praise the Lord and forget not all His benefits
[00:42.00] Who forgives all your sins and heals all your diseases
[00:58.00] Who redeems your life from the pit
[01:12.00] And crowns you with love and compassion
[01:28.00] The Lord is compassionate and gracious
[01:45.00] Slow to anger, abounding in steadfast love
[02:00.00] For as high as the heavens are above the earth
[02:18.00] So great is His love for those who fear Him
[02:35.00] Hallelujah, praise the Lord forevermore.`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  editBtnText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '700'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    paddingVertical: 40,
    paddingHorizontal: 10
  },
  lineBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  activeLineBox: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#E5A93C'
  },
  lineText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#9CA3AF',
    fontWeight: '500',
    flex: 1
  },
  activeLineText: {
    fontSize: 19,
    lineHeight: 28,
    color: '#FCD34D',
    fontWeight: '800'
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5A93C',
    marginLeft: 8
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14
  },
  addLyricsBtn: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5A93C'
  },
  addLyricsBtnText: {
    color: '#E5A93C',
    fontWeight: '700',
    fontSize: 13
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalBox: {
    backgroundColor: '#111622',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800'
  },
  modalSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16
  },
  textInput: {
    backgroundColor: '#0A0D14',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    height: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 14,
    lineHeight: 20
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16
  },
  cancelModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12
  },
  cancelModalText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600'
  },
  saveModalBtn: {
    backgroundColor: '#E5A93C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  saveModalText: {
    color: '#0A0D14',
    fontSize: 14,
    fontWeight: '800'
  }
});
