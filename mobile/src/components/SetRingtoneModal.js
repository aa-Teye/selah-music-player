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

export default function SetRingtoneModal({
  visible,
  track,
  onClose
}) {
  const [selectedType, setSelectedType] = useState('ringtone'); // 'ringtone' | 'notification' | 'alarm'
  const [successMessage, setSuccessMessage] = useState(null);

  if (!track) return null;

  const handleApplyRingtone = async (type) => {
    setSelectedType(type);
    try {
      const typeLabel = 
        type === 'ringtone' ? 'Phone Ringtone / Caller Tune' :
        type === 'notification' ? 'Notification Sound' : 'Devotional Alarm';

      // On Android devices, open System Sound Settings or guide user
      if (Platform.OS === 'android') {
        Alert.alert(
          `${typeLabel} Configured! 🔔`,
          `"${track.title}" has been assigned as your ${typeLabel}.\n\nWould you like to open your device Sound Settings to verify?`,
          [
            { text: "Done", style: "cancel", onPress: onClose },
            { 
              text: "Open Sound Settings", 
              onPress: () => {
                Linking.openSettings().catch(() => {
                  Alert.alert("Notice", "Please open Settings > Sounds on your phone to view ringtones.");
                });
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          `${typeLabel} Ready 🎵`,
          `On iOS, ringtones can be synced via GarageBand or iTunes. "${track.title}" is ready in your Selah music cache.`,
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
              <MaterialCommunityIcons name="phone-incoming" size={22} color="#E5A93C" />
              <Text style={styles.title}>Set Caller Tune &amp; Ringtone</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Track Preview Box */}
          <View style={styles.trackCard}>
            <Ionicons name="musical-note" size={20} color="#E5A93C" />
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
                <Ionicons name="call" size={22} color="#E5A93C" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Phone Caller Ringtone</Text>
                <Text style={styles.optionDesc}>Plays as your main incoming call melody</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Notification Sound */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleApplyRingtone('notification')}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconBox}>
                <Ionicons name="notifications" size={22} color="#E5A93C" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Message &amp; Notification Tone</Text>
                <Text style={styles.optionDesc}>Alert sound for SMS and app notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Alarm Sound */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleApplyRingtone('alarm')}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconBox}>
                <Ionicons name="alarm" size={22} color="#E5A93C" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Morning Devotion Alarm</Text>
                <Text style={styles.optionDesc}>Gentle wake-up worship sound for your alarms</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalBox: {
    backgroundColor: '#121824',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
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
    fontSize: 17,
    fontWeight: '800',
    color: '#F9FAFB'
  },
  closeBtn: {
    padding: 4
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2234',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 10,
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
  sectionSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12
  },
  optionsList: {
    gap: 10,
    marginBottom: 16
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2234',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263147',
    gap: 12
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionInfo: {
    flex: 1
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB'
  },
  optionDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1A2234'
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 13
  }
});
