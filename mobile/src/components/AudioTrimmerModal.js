import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function AudioTrimmerModal({
  visible,
  track,
  duration = 180,
  onClose,
  onPlayPreview,
  onApplyRingtone
}) {
  const [startTime, setStartTime] = useState(0);
  const [trimDuration, setTrimDuration] = useState(30); // 30s standard ringtone
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewTimeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setStartTime(0);
      setTrimDuration(Math.min(30, Math.floor(duration || 180)));
      setIsPreviewing(false);
    }
    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, [visible, duration]);

  if (!track) return null;

  const maxDuration = Math.floor(duration || 180);
  const endTime = Math.min(maxDuration, startTime + trimDuration);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const adjustStart = (delta) => {
    setStartTime((prev) => {
      const next = Math.max(0, Math.min(prev + delta, maxDuration - 10));
      return next;
    });
  };

  const adjustLength = (newLen) => {
    setTrimDuration(newLen);
  };

  const handleTogglePreview = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    if (isPreviewing) {
      setIsPreviewing(false);
    } else {
      setIsPreviewing(true);
      if (onPlayPreview) {
        onPlayPreview(startTime, endTime);
      }
      previewTimeoutRef.current = setTimeout(() => {
        setIsPreviewing(false);
      }, trimDuration * 1000);
    }
  };

  const handleSaveCut = () => {
    Alert.alert(
      "Ringtone Cut Ready ✂️",
      `Clip from ${formatTime(startTime)} to ${formatTime(endTime)} (${trimDuration}s) created for "${track.title}".\n\nApply as phone ringtone?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Set as Ringtone", 
          onPress: () => {
            if (onApplyRingtone) onApplyRingtone(track, startTime, endTime);
            onClose();
          }
        }
      ]
    );
  };

  // Waveform bar visual simulation
  const bars = [16, 28, 40, 24, 52, 38, 20, 44, 30, 48, 26, 36, 50, 32, 22, 42, 28, 46, 34, 20];

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
              <MaterialCommunityIcons name="content-cut" size={22} color="#E5A93C" />
              <Text style={styles.title}>Audio Trimmer & Ringtone Cutter</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Track Name */}
          <View style={styles.trackCard}>
            <Ionicons name="musical-note" size={20} color="#E5A93C" />
            <View style={{ flex: 1 }}>
              <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{track.artist || 'Local Track'}</Text>
            </View>
            <Text style={styles.totalLengthBadge}>{formatTime(maxDuration)}</Text>
          </View>

          {/* Interactive Visual Waveform Trimmer */}
          <View style={styles.waveformBox}>
            <View style={styles.waveformRow}>
              {bars.map((h, i) => {
                const barTime = (i / bars.length) * maxDuration;
                const isInCut = barTime >= startTime && barTime <= endTime;
                return (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      { height: h },
                      isInCut ? styles.waveBarActive : styles.waveBarDim
                    ]}
                  />
                );
              })}
            </View>

            {/* Time Marker Range Indicator */}
            <View style={styles.rangeRow}>
              <View style={styles.timeFlag}>
                <Text style={styles.flagLabel}>START</Text>
                <Text style={styles.flagTime}>{formatTime(startTime)}</Text>
              </View>
              <View style={styles.clipDurationBadge}>
                <Ionicons name="time-outline" size={12} color="#E5A93C" />
                <Text style={styles.clipDurationText}>{trimDuration}s clip</Text>
              </View>
              <View style={styles.timeFlag}>
                <Text style={styles.flagLabel}>END</Text>
                <Text style={styles.flagTime}>{formatTime(endTime)}</Text>
              </View>
            </View>
          </View>

          {/* Fine Adjustment Controls */}
          <Text style={styles.sectionLabel}>Fine-tune Start Position:</Text>
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustStart(-5)}>
              <Text style={styles.adjustBtnText}>-5s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustStart(-1)}>
              <Text style={styles.adjustBtnText}>-1s</Text>
            </TouchableOpacity>
            <View style={styles.currentStartBox}>
              <Text style={styles.currentStartText}>{formatTime(startTime)}</Text>
            </View>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustStart(1)}>
              <Text style={styles.adjustBtnText}>+1s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustStart(5)}>
              <Text style={styles.adjustBtnText}>+5s</Text>
            </TouchableOpacity>
          </View>

          {/* Preset Clip Lengths */}
          <Text style={styles.sectionLabel}>Clip Duration:</Text>
          <View style={styles.lengthRow}>
            {[15, 30, 45, 60].map((len) => {
              const isSelected = trimDuration === len;
              return (
                <TouchableOpacity
                  key={len}
                  style={[styles.lengthPill, isSelected && styles.lengthPillActive]}
                  onPress={() => adjustLength(len)}
                >
                  <Text style={[styles.lengthText, isSelected && styles.lengthTextActive]}>
                    {len} seconds
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.previewBtn, isPreviewing && styles.previewBtnActive]} 
              onPress={handleTogglePreview}
            >
              <Ionicons 
                name={isPreviewing ? "stop" : "play"} 
                size={18} 
                color={isPreviewing ? "#0A0D14" : "#E5A93C"} 
              />
              <Text style={[styles.previewBtnText, isPreviewing && styles.previewBtnTextActive]}>
                {isPreviewing ? "Stop Preview" : "Preview Clip"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveCutBtn} onPress={handleSaveCut}>
              <MaterialCommunityIcons name="content-cut" size={18} color="#0A0D14" />
              <Text style={styles.saveCutText}>Set as Ringtone</Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
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
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F3F4F6'
  },
  closeBtn: {
    padding: 4
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171E2E',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 16
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  trackArtist: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2
  },
  totalLengthBadge: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600'
  },
  waveformBox: {
    backgroundColor: '#0A0D14',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    marginBottom: 12
  },
  waveBar: {
    width: 8,
    borderRadius: 4
  },
  waveBarActive: {
    backgroundColor: '#E5A93C'
  },
  waveBarDim: {
    backgroundColor: '#374151'
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10
  },
  timeFlag: {
    alignItems: 'center'
  },
  flagLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  flagTime: {
    color: '#FCD34D',
    fontSize: 14,
    fontWeight: '800'
  },
  clipDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  clipDurationText: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800'
  },
  sectionLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  adjustBtn: {
    backgroundColor: '#1E2638',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  adjustBtnText: {
    color: '#F3F4F6',
    fontSize: 12,
    fontWeight: '700'
  },
  currentStartBox: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5A93C'
  },
  currentStartText: {
    color: '#FCD34D',
    fontSize: 15,
    fontWeight: '800'
  },
  lengthRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20
  },
  lengthPill: {
    flex: 1,
    backgroundColor: '#171E2E',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  lengthPillActive: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
    borderColor: '#E5A93C'
  },
  lengthText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600'
  },
  lengthTextActive: {
    color: '#FCD34D',
    fontWeight: '800'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E5A93C',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8
  },
  previewBtnActive: {
    backgroundColor: '#E5A93C'
  },
  previewBtnText: {
    color: '#E5A93C',
    fontSize: 14,
    fontWeight: '800'
  },
  previewBtnTextActive: {
    color: '#0A0D14'
  },
  saveCutBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5A93C',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8
  },
  saveCutText: {
    color: '#0A0D14',
    fontSize: 14,
    fontWeight: '800'
  }
});
