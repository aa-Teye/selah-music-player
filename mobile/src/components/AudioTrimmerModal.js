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
import { useColors, useThemedStyles } from '../theme/ThemeContext';

export default function AudioTrimmerModal({
  visible,
  track,
  duration = 180,
  onClose,
  onPlayPreview,
  onApplyRingtone
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
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
      "Clip Selected ✂️",
      `You chose ${formatTime(startTime)} to ${formatTime(endTime)} (${trimDuration}s) of "${track.title}".\n\nSelah can't save a trimmed file yet, so you'll set the full track as your ringtone from Sound settings.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
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
              <MaterialCommunityIcons name="content-cut" size={22} color={c.ink} />
              <Text style={styles.title}>Audio Trimmer & Ringtone Cutter</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Track Name */}
          <View style={styles.trackCard}>
            <Ionicons name="musical-note" size={20} color={c.ink} />
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
                <Ionicons name="time-outline" size={12} color={c.ink} />
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
                color={isPreviewing ? "#FFFFFF" : c.ink} 
              />
              <Text style={[styles.previewBtnText, isPreviewing && styles.previewBtnTextActive]}>
                {isPreviewing ? "Stop Preview" : "Preview Clip"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveCutBtn} onPress={handleSaveCut}>
              <MaterialCommunityIcons name="content-cut" size={18} color="#FFFFFF" />
              <Text style={styles.saveCutText}>Set as Ringtone</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 16
  },
  trackTitle: {
    color: c.text,
    fontSize: 14,
    fontWeight: '700'
  },
  trackArtist: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 2
  },
  totalLengthBadge: {
    color: c.textSubtle,
    fontSize: 12,
    fontWeight: '600'
  },
  waveformBox: {
    backgroundColor: c.bg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: c.border
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
    backgroundColor: c.inverse
  },
  waveBarDim: {
    backgroundColor: c.surfaceStrong
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 10
  },
  timeFlag: {
    alignItems: 'center'
  },
  flagLabel: {
    color: c.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  flagTime: {
    color: c.text,
    fontSize: 14,
    fontWeight: '800'
  },
  clipDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  clipDurationText: {
    color: c.ink,
    fontSize: 11,
    fontWeight: '800'
  },
  sectionLabel: {
    color: c.textMuted,
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
    backgroundColor: c.surfaceAlt,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  adjustBtnText: {
    color: c.text,
    fontSize: 12,
    fontWeight: '700'
  },
  currentStartBox: {
    backgroundColor: c.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: c.inverse
  },
  currentStartText: {
    color: c.text,
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
    backgroundColor: c.surfaceAlt,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  lengthPillActive: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  lengthText: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '600'
  },
  lengthTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8
  },
  previewBtnActive: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  previewBtnText: {
    color: c.text,
    fontSize: 14,
    fontWeight: '800'
  },
  previewBtnTextActive: {
    color: '#FFFFFF'
  },
  saveCutBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.inverse,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8
  },
  saveCutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  }
});
