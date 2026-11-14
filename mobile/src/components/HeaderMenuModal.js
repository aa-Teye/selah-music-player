import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Linking
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useColors, useThemedStyles } from '../theme/ThemeContext';
import { apiUrl } from '../services/apiClient';

const { width, height } = Dimensions.get('window');
// The version people have installed (app.json "version"), so you can always tell which one a phone runs
export const APP_VERSION = (Constants.expoConfig && Constants.expoConfig.version) || '1.0.0';

export default function HeaderMenuModal({
  visible,
  onClose,
  onOpenEq,
  onOpenStats,
  onOpenSleepTimer,
  onOpenAccount,
  onOpenTour,
  onOpenWhatsNew,
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
                    <Ionicons name="flame-outline" size={13} color={c.ink} />
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
                  <Text style={styles.menuSub}>Sleep timer, playback speed, crossfade</Text>
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

              {onOpenAccount && (
                <TouchableOpacity
                  style={styles.menuItem}
                  testID="open-account"
                  onPress={() => {
                    onClose();
                    onOpenAccount();
                  }}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name="person-circle-outline" size={20} color={c.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuTitle}>Account &amp; Backup</Text>
                    <Text style={styles.menuSub}>Log in, Selah Premium, back up your playlists</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.textSubtle} />
                </TouchableOpacity>
              )}

              {onOpenWhatsNew && (
                <TouchableOpacity
                  style={styles.menuItem}
                  testID="open-whats-new"
                  onPress={() => {
                    onClose();
                    onOpenWhatsNew();
                  }}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name="megaphone-outline" size={20} color={c.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuTitle}>What&apos;s new</Text>
                    <Text style={styles.menuSub}>The latest things in Selah</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.textSubtle} />
                </TouchableOpacity>
              )}

              {onOpenTour && (
                <TouchableOpacity
                  style={styles.menuItem}
                  testID="open-tour"
                  onPress={() => {
                    onClose();
                    onOpenTour();
                  }}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name="compass-outline" size={20} color={c.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuTitle}>Show me around</Text>
                    <Text style={styles.menuSub}>A quick tour of Selah</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.textSubtle} />
                </TouchableOpacity>
              )}

              {/* Version & Badge Footer */}
              <View style={styles.drawerFooter}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={styles.footerText} testID="app-version">Selah {APP_VERSION} • Your music stays on your phone</Text>
              </View>
              {apiUrl() ? (
                <View style={styles.legalRow}>
                  <TouchableOpacity onPress={() => Linking.openURL(`${apiUrl()}/privacy`).catch(() => {})} testID="menu-privacy">
                    <Text style={styles.legalLink}>Privacy policy</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalDot}>·</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`${apiUrl()}/terms`).catch(() => {})} testID="menu-terms">
                    <Text style={styles.legalLink}>Terms of use</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
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
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  legalLink: { color: c.textMuted, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  legalDot: { color: c.textSubtle, fontSize: 12 },
  footerText: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '600'
  }
});
