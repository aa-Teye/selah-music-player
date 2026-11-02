import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function HeaderMenuModal({
  visible,
  onClose,
  onOpenEq,
  onOpenStats,
  onOpenSleepTimer,
  streakDays = 14
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.menuDrawer}>
              {/* Header Profile Brand */}
              <View style={styles.drawerHeader}>
                <View style={styles.profileAvatar}>
                  <Ionicons name="person" size={20} color="#34D399" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>Selah</Text>
                  <View style={styles.streakRow}>
                    <Ionicons name="sparkles-outline" size={13} color="#34D399" />
                    <Text style={styles.streakText}>Day {streakDays} Daily Worship</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Menu Items */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  if (onOpenEq) onOpenEq();
                }}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                  <Ionicons name="options" size={20} color="#34D399" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Sound Equalizer &amp; Presets</Text>
                  <Text style={styles.menuSub}>5-Band EQ, Worship, Bass Boost, Clarity</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  if (onOpenStats) onOpenStats();
                }}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Ionicons name="stats-chart" size={20} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Listening Statistics</Text>
                  <Text style={styles.menuSub}>Session minutes, devotionals, top frequency</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  if (onOpenSleepTimer) onOpenSleepTimer();
                }}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Ionicons name="moon" size={20} color="#A855F7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Bedtime Sleep Timer</Text>
                  <Text style={styles.menuSub}>Auto fade-out (15m, 30m, 45m, 60m)</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>

              {/* Version & Badge Footer */}
              <View style={styles.drawerFooter}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={styles.footerText}>Selah v1.0 • Offline Storage &amp; Worship</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 11, 0.75)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end'
  },
  menuDrawer: {
    width: Math.min(width * 0.82, 340),
    height: '100%',
    backgroundColor: '#121318',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(52, 211, 153, 0.2)',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 30
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1C23',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)'
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  streakText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 6
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1C23',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  menuTitle: {
    color: '#FBFBFC',
    fontSize: 13,
    fontWeight: '700'
  },
  menuSub: {
    color: '#A0A6B5',
    fontSize: 10,
    marginTop: 2
  },
  drawerFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)'
  },
  footerText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600'
  }
});
