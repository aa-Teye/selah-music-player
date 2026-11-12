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
import { useColors, useThemedStyles } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function HeaderMenuModal({
  visible,
  onClose,
  onOpenEq,
  onOpenStats,
  onOpenSleepTimer,
  onOpenBackup,
  streakDays = 14
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
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
                  <Ionicons name="person" size={20} color={c.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>Selah</Text>
                  <View style={styles.streakRow}>
                    <Ionicons name="sparkles-outline" size={13} color={c.ink} />
                    <Text style={styles.streakText}>Day {streakDays} Daily Worship</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={c.textMuted} />
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
                <View style={styles.menuIconWrap}>
                  <Ionicons name="options" size={20} color={c.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Sound &amp; Sleep Timer</Text>
                  <Text style={styles.menuSub}>Sleep timer, speed, crossfade, calming sounds</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.textSubtle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  if (onOpenStats) onOpenStats();
                }}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name="stats-chart" size={20} color={c.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Listening Statistics</Text>
                  <Text style={styles.menuSub}>Session minutes, devotionals, top frequency</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.textSubtle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  if (onOpenSleepTimer) onOpenSleepTimer();
                }}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name="moon" size={20} color={c.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Bedtime Sleep Timer</Text>
                  <Text style={styles.menuSub}>Auto fade-out (15m, 30m, 45m, 60m)</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.textSubtle} />
              </TouchableOpacity>

              {onOpenBackup && (
                <TouchableOpacity
                  style={styles.menuItem}
                  testID="open-backup"
                  onPress={() => {
                    onClose();
                    onOpenBackup();
                  }}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name="cloud-upload-outline" size={20} color={c.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuTitle}>Backup &amp; Restore</Text>
                    <Text style={styles.menuSub}>Keep your playlists safe, move to a new phone</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.textSubtle} />
                </TouchableOpacity>
              )}

              {/* Version & Badge Footer */}
              <View style={styles.drawerFooter}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={styles.footerText}>Selah v1.0 • Your music stays on your phone</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end'
  },
  menuDrawer: {
    width: Math.min(width * 0.82, 340),
    height: '100%',
    backgroundColor: c.surface,
    borderLeftWidth: 1,
    borderLeftColor: c.border,
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8
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
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: c.border
  },
  profileName: {
    color: c.text,
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
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 6
  },
  divider: {
    height: 1,
    backgroundColor: c.surfaceStrong,
    marginBottom: 20
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border
  },
  menuTitle: {
    color: c.text,
    fontSize: 13,
    fontWeight: '700'
  },
  menuSub: {
    color: c.textMuted,
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
    borderTopColor: c.border
  },
  footerText: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '600'
  }
});
