import React, { memo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, Share, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';
import { REMINDER_TIMES, formatReminderTime, getReminder, setReminder } from '../services/dailyService';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80';

/** Daily reminder settings: on/off and the time */
function ReminderModal({ visible, onClose, onSaved }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState({ hour: 7, minute: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    getReminder().then((r) => {
      setEnabled(Boolean(r.enabled));
      setTime({ hour: r.hour, minute: r.minute });
    });
  }, [visible]);

  const save = async () => {
    setSaving(true);
    const result = await setReminder({ enabled, ...time });
    setSaving(false);
    if (!result.ok && result.reason === 'denied') {
      Alert.alert('Notifications are off', 'Allow notifications for Selah in your phone settings to get a daily reminder.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) }
      ]);
    } else if (!result.ok) {
      Alert.alert('Reminder not set', 'Something went wrong. Please try again.');
    }
    onSaved && onSaved(result.reminder);
    if (result.ok) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox} testID="reminder-modal">
          <Text style={styles.modalTitle}>Daily reminder</Text>
          <Text style={styles.modalSub}>A gentle notification with the verse of the day.</Text>

          <View style={styles.choiceRow}>
            {[
              { label: 'Off', value: false },
              { label: 'On', value: true }
            ].map((o) => (
              <TouchableOpacity
                key={o.label}
                style={[styles.choice, enabled === o.value && styles.choiceActive]}
                onPress={() => setEnabled(o.value)}
                testID={`reminder-${o.label.toLowerCase()}`}
              >
                <Text style={[styles.choiceText, enabled === o.value && styles.choiceTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {enabled && (
            <View style={styles.timesGrid}>
              {REMINDER_TIMES.map((t) => {
                const active = t.hour === time.hour && t.minute === time.minute;
                const label = formatReminderTime(t);
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.timeChip, active && styles.choiceActive]}
                    onPress={() => setTime(t)}
                    testID={`reminder-time-${t.hour}`}
                  >
                    <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving} testID="reminder-save">
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Home's "Today" card: verse of the day, a short thought, a song from your
 * own music for today, and the daily reminder bell.
 */
function TodayCard({ devotion, song, onPlaySong, onNextVerse, isPlayingSong }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminder, setReminderState] = useState(null);

  useEffect(() => {
    getReminder().then(setReminderState);
  }, []);

  if (!devotion) return null;
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const reminderOn = reminder && reminder.enabled;

  const shareVerse = () => {
    Share.share({ message: `${devotion.verse}\n— ${devotion.reference}\n\n${devotion.reflection}\n\nShared from Selah` }).catch(() => {});
  };

  return (
    <View style={styles.card} testID="today-card">
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>TODAY</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity
          style={[styles.iconBtn, reminderOn && styles.iconBtnOn]}
          onPress={() => setReminderOpen(true)}
          accessibilityLabel={reminderOn ? `Daily reminder at ${formatReminderTime(reminder)}` : 'Set a daily reminder'}
          testID="open-reminder"
        >
          <Ionicons name={reminderOn ? 'notifications' : 'notifications-outline'} size={18} color={reminderOn ? '#FFFFFF' : c.ink} />
        </TouchableOpacity>
      </View>

      <Text style={styles.verse}>{devotion.verse}</Text>
      <Text style={styles.reference}>{devotion.reference}</Text>
      <Text style={styles.reflection}>{devotion.reflection}</Text>

      {song ? (
        <TouchableOpacity style={styles.songRow} onPress={() => onPlaySong(song)} activeOpacity={0.8} testID="song-of-the-day">
          <Image source={{ uri: song.coverUrl || FALLBACK_COVER }} style={styles.songCover} />
          <View style={{ flex: 1 }}>
            <Text style={styles.songLabel}>Song for today</Text>
            <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
            <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
          </View>
          <View style={styles.playCircle}>
            <Ionicons name={isPlayingSong ? 'volume-high' : 'play'} size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      ) : null}

      <View style={styles.actions}>
        {onNextVerse && (
          <TouchableOpacity style={styles.actionBtn} onPress={onNextVerse} testID="next-verse">
            <Ionicons name="refresh" size={14} color={c.ink} />
            <Text style={styles.actionText}>Another verse</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={shareVerse} testID="share-verse">
          <Ionicons name="share-social-outline" size={14} color={c.ink} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        {reminderOn && <Text style={styles.reminderNote}>Reminder {formatReminderTime(reminder)}</Text>}
      </View>

      <ReminderModal visible={reminderOpen} onClose={() => setReminderOpen(false)} onSaved={setReminderState} />
    </View>
  );
}

export default memo(TodayCard);

const makeStyles = (c) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 20,
      gap: 8
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    kicker: { color: c.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    date: { color: c.text, fontSize: 15, fontWeight: '800', marginTop: 2 },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center'
    },
    iconBtnOn: { backgroundColor: c.inverse, borderColor: c.inverse },
    verse: { color: c.text, fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 4 },
    reference: { color: c.textMuted, fontSize: 13, fontWeight: '800' },
    reflection: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
    songRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surfaceAlt,
      borderRadius: 14,
      padding: 10,
      marginTop: 4
    },
    songCover: { width: 44, height: 44, borderRadius: 10, backgroundColor: c.surfaceStrong },
    songLabel: { color: c.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
    songTitle: { color: c.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
    songArtist: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    playCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.inverse,
      alignItems: 'center',
      justifyContent: 'center'
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 7
    },
    actionText: { color: c.ink, fontWeight: '800', fontSize: 12 },
    reminderNote: { color: c.textMuted, fontSize: 12, fontWeight: '700', marginLeft: 'auto' },
    overlay: { flex: 1, backgroundColor: 'rgba(8, 9, 12, 0.6)', justifyContent: 'center', padding: 24 },
    modalBox: {
      backgroundColor: c.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 12
    },
    modalTitle: { color: c.text, fontSize: 19, fontWeight: '900' },
    modalSub: { color: c.textMuted, fontSize: 13 },
    choiceRow: { flexDirection: 'row', gap: 10 },
    choice: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border
    },
    choiceActive: { backgroundColor: c.inverse, borderColor: c.inverse },
    choiceText: { color: c.ink, fontWeight: '800', fontSize: 13 },
    choiceTextActive: { color: '#FFFFFF' },
    timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border
    },
    saveBtn: { backgroundColor: c.inverse, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
    saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    cancelBtn: { alignItems: 'center', paddingVertical: 4 },
    cancelText: { color: c.textMuted, fontWeight: '800', fontSize: 13 }
  });
