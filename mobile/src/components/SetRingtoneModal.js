import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

export default function SetRingtoneModal({
  visible,
  track,
  onClose
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [selectedType, setSelectedType] = useState('ringtone'); // 'ringtone' | 'notification' | 'alarm'
  const [successMessage, setSuccessMessage] = useState(null);

  if (!track) return null;

  const handleApplyRingtone = async (type) => {
    setSelectedType(type);
    try {
      const typeLabel = 
        type === 'ringtone' ? 'Phone Ringtone / Caller Tune' :
        type === 'notification' ? 'Notification Sound' : 'Devotional Alarm';

      const slot = type === 'notification' ? 'Notification sound' : type === 'alarm' ? 'Alarm sound' : 'Phone ringtone';
      if (Platform.OS === 'android') {
        Alert.alert(
          `Set as ${typeLabel}`,
          `Android doesn't let apps change your ringtone directly.\n\nOpen Sound settings, choose "${slot}", and pick "${track.title}" from your files.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Sound Settings",
              onPress: () => {
                const open = Linking.sendIntent
                  ? Linking.sendIntent('android.settings.SOUND_SETTINGS')
                  : Linking.openSettings();
                Promise.resolve(open).catch(() => Linking.openSettings().catch(() => {}));
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          `${typeLabel}`,
          `iPhone ringtones can't be set from an app. Add "${track.title}" as a ringtone using GarageBand or Finder on a computer.`,
          [{ text: "OK", onPress: onClose }]
        );
      }
    } catch (err) {
      console.log('Error setting ringtone:', err);
      Alert.alert("Notice", "Unable to set ringtone directly. You can select this track in Android Settings > Sound.");
    }
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
              <MaterialCommunityIcons name="phone-incoming" size={22} color={c.ink} />
              <Text style={styles.title}>Set Caller Tune & Ringtone</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Track Preview Box */}
          <View style={styles.trackCard}>
            <Ionicons name="musical-note" size={20} color={c.ink} />
            <View style={{ flex: 1 }}>
              <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{track.artist || 'Local Audio'}</Text>
            </View>
          </View>

          <Text style={styles.sectionSub}>Choose how you want to use this audio file:</Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {/* Phone Ringtone */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleApplyRingtone('ringtone')}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconBox}>
                <Ionicons name="call" size={20} color={c.ink} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Phone Caller Ringtone</Text>
                <Text style={styles.optionDesc}>Plays as your main incoming call melody</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textSubtle} />
            </TouchableOpacity>

            {/* Notification Sound */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleApplyRingtone('notification')}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconBox}>
                <Ionicons name="notifications" size={20} color={c.ink} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Message & Notification Tone</Text>
                <Text style={styles.optionDesc}>Alert sound for SMS and app notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textSubtle} />
            </TouchableOpacity>

            {/* Alarm Sound */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleApplyRingtone('alarm')}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconBox}>
                <Ionicons name="alarm" size={20} color={c.ink} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Morning Devotion Alarm</Text>
                <Text style={styles.optionDesc}>Gentle wake-up worship sound for your alarms</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textSubtle} />
            </TouchableOpacity>
          </View>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
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
    marginBottom: 14
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 10,
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
  sectionSub: {
    fontSize: 12,
    color: c.textMuted,
    marginBottom: 12
  },
  optionsList: {
    gap: 10,
    marginBottom: 16
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.bg,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionInfo: {
    flex: 1
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text
  },
  optionDesc: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: c.surfaceAlt
  },
  cancelBtnText: {
    color: c.text,
    fontWeight: '700',
    fontSize: 13
  }
});
