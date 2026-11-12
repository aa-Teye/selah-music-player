import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';
import {
  getBackupCode,
  getBackupStatus,
  setAutoBackup,
  backupNow,
  fetchRestore,
  adoptBackupCode,
  deleteBackup,
  normalizeCode
} from '../services/cloudService';

const when = (iso) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Backup & restore: no account needed. Each phone has a private backup code;
 * typing that code on another phone brings your playlists and lyrics back.
 * getState() returns { tracks, playlists, favorites, playCounts } right now.
 * onRestore(result) adds what was restored to the app.
 */
export default function BackupModal({ visible, onClose, getState, onRestore }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState({ lastBackupAt: null, auto: false });
  const [busy, setBusy] = useState(null); // 'backup' | 'restore' | 'delete'
  const [restoreCode, setRestoreCode] = useState('');

  useEffect(() => {
    if (!visible) return;
    getBackupCode().then(setCode);
    getBackupStatus().then(setStatus);
  }, [visible]);

  if (!visible) return null;

  const doBackup = async () => {
    setBusy('backup');
    try {
      const result = await backupNow(getState());
      setStatus((s) => ({ ...s, lastBackupAt: result.savedAt }));
      Alert.alert(
        'Backed up',
        `${result.playlists} playlist${result.playlists === 1 ? '' : 's'} and ${result.songs} song${result.songs === 1 ? '' : 's'} are saved. Keep your code to restore them.`
      );
    } catch (err) {
      Alert.alert('Backup failed', err?.message || 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const doRestore = async () => {
    const clean = normalizeCode(restoreCode);
    if (!clean) {
      Alert.alert('Check the code', 'A backup code has 20 letters and numbers, like ABCD-EFGH-JKLM-NPQR-STUV.');
      return;
    }
    setBusy('restore');
    try {
      const result = await fetchRestore(clean, getState().tracks);
      await onRestore(result);
      await adoptBackupCode(clean);
      setCode(clean);
      setRestoreCode('');
      const missing = result.total - result.found;
      Alert.alert(
        'Restored',
        `${result.playlists.length} playlist${result.playlists.length === 1 ? '' : 's'} and ${result.favorites.length} loved song${
          result.favorites.length === 1 ? '' : 's'
        } are back.${missing > 0 ? ` ${missing} song${missing === 1 ? ' is' : 's are'} not on this phone yet, so ${missing === 1 ? 'it was' : 'they were'} skipped.` : ''}`
      );
    } catch (err) {
      Alert.alert('Restore failed', err?.message || 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete your backup?', 'Your backup in Selah cloud will be removed. Songs and playlists on this phone stay.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy('delete');
          try {
            await deleteBackup();
            setStatus((s) => ({ ...s, lastBackupAt: null }));
          } catch (err) {
            Alert.alert('Not deleted', err?.message || 'Please try again.');
          } finally {
            setBusy(null);
          }
        }
      }
    ]);
  };

  const toggleAuto = async (on) => {
    setStatus((s) => ({ ...s, auto: on }));
    await setAutoBackup(on);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet} testID="backup-modal">
          <View style={styles.header}>
            <Text style={styles.title}>Backup &amp; Restore</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" testID="backup-close">
              <Ionicons name="close" size={24} color={c.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 12 }}>
            <Text style={styles.note}>
              Saves your playlists, loved songs, play counts and the lyrics you typed. Your songs themselves are never
              uploaded.
            </Text>

            <View style={styles.box}>
              <Text style={styles.label}>Your backup code</Text>
              <Text style={styles.code} selectable testID="backup-code">
                {code}
              </Text>
              <Text style={styles.small}>Keep it safe, like a password. You need it to restore on a new phone.</Text>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => Share.share({ message: `My Selah backup code: ${code}` }).catch(() => {})}
              >
                <Ionicons name="share-outline" size={15} color={c.ink} />
                <Text style={styles.linkText}>Save the code somewhere safe</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={doBackup} disabled={Boolean(busy)} testID="backup-now">
              {busy === 'backup' ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />}
              <Text style={styles.primaryText}>Back up now</Text>
            </TouchableOpacity>
            <Text style={styles.small} testID="backup-last">Last backup: {when(status.lastBackupAt)}</Text>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Back up automatically</Text>
                <Text style={styles.small}>Once a day, when you leave the app</Text>
              </View>
              <Switch value={status.auto} onValueChange={toggleAuto} testID="backup-auto" />
            </View>

            <View style={styles.box}>
              <Text style={styles.label}>Restore from another phone</Text>
              <TextInput
                style={styles.input}
                value={restoreCode}
                onChangeText={setRestoreCode}
                placeholder="ABCD-EFGH-JKLM-NPQR-STUV"
                placeholderTextColor={c.textSubtle}
                autoCapitalize="characters"
                autoCorrect={false}
                testID="restore-code"
              />
              <TouchableOpacity style={styles.secondaryBtn} onPress={doRestore} disabled={Boolean(busy)} testID="restore-now">
                {busy === 'restore' ? <ActivityIndicator color={c.ink} /> : <Ionicons name="cloud-download-outline" size={18} color={c.ink} />}
                <Text style={styles.secondaryText}>Restore</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} disabled={Boolean(busy)} testID="backup-delete">
              <Text style={styles.deleteText}>Delete my backup</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(8, 9, 12, 0.6)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 18,
      paddingBottom: 30,
      maxHeight: '92%'
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    title: { color: c.text, fontSize: 19, fontWeight: '900' },
    note: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
    box: { backgroundColor: c.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 14, gap: 8 },
    label: { color: c.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
    code: { color: c.text, fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
    small: { color: c.textMuted, fontSize: 12, lineHeight: 17 },
    linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
    linkText: { color: c.ink, fontWeight: '800', fontSize: 13 },
    primaryBtn: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.inverse,
      borderRadius: 16,
      paddingVertical: 14
    },
    primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowTitle: { color: c.text, fontWeight: '800', fontSize: 14 },
    input: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: c.text,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1
    },
    secondaryBtn: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 12
    },
    secondaryText: { color: c.ink, fontWeight: '800', fontSize: 14 },
    deleteBtn: { alignItems: 'center', paddingVertical: 8 },
    deleteText: { color: '#EF4444', fontWeight: '800', fontSize: 13 }
  });
