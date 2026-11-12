import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

export const CARD_STYLES = [
  { id: 'night', name: 'Night', bg: '#12141A', text: '#FFFFFF', soft: 'rgba(255,255,255,0.65)', accent: '#34D399' },
  { id: 'sunrise', name: 'Sunrise', bg: '#C2410C', text: '#FFFFFF', soft: 'rgba(255,255,255,0.75)', accent: '#FDE68A' },
  { id: 'ocean', name: 'Ocean', bg: '#0E7490', text: '#FFFFFF', soft: 'rgba(255,255,255,0.75)', accent: '#A5F3FC' },
  { id: 'cream', name: 'Cream', bg: '#F5EFE3', text: '#1F2937', soft: 'rgba(31,41,55,0.65)', accent: '#B45309' }
];

export const MAX_CARD_LINES = 4;

/** The words to share as plain text when a picture can't be shared */
export function lyricShareText(lines, track) {
  const words = lines.filter(Boolean).join('\n');
  const who = [track?.title, track?.artist].filter(Boolean).join(' · ');
  return `"${words}"${who ? `\n— ${who}` : ''}\n\nShared from Selah`;
}

/**
 * Turns a few lyric lines into a picture card you can share (WhatsApp status, Instagram, ...).
 * allLines: every line of the song; startIndex: the line you picked.
 */
export default function LyricCardModal({ visible, allLines = [], startIndex = 0, track, onClose }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const cardRef = useRef(null);
  const [count, setCount] = useState(1);
  const [styleId, setStyleId] = useState('night');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    // a short line reads better with the next one
    const first = String(allLines[startIndex] || '');
    setCount(first.length < 28 && startIndex + 1 < allLines.length ? 2 : 1);
  }, [visible, startIndex, allLines]);

  if (!visible) return null;

  const lines = allLines.slice(startIndex, startIndex + count).filter((l) => String(l).trim());
  const look = CARD_STYLES.find((s) => s.id === styleId) || CARD_STYLES[0];
  const canAdd = count < MAX_CARD_LINES && startIndex + count < allLines.length;
  const longText = lines.join(' ').length > 120;

  const shareAsText = async () => {
    try {
      await Share.share({ message: lyricShareText(lines, track) });
    } catch {}
  };

  const sharePicture = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share lyrics', UTI: 'public.png' });
      } else {
        await shareAsText();
      }
    } catch (err) {
      console.log('Lyric card notice:', err);
      await shareAsText(); // the picture failed: share the words instead
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet} testID="lyric-card-sheet">
          <View style={styles.header}>
            <Text style={styles.title}>Share lyrics</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" testID="lyric-card-close">
              <Ionicons name="close" size={24} color={c.text} />
            </TouchableOpacity>
          </View>

          {/* The picture that gets shared */}
          <View ref={cardRef} collapsable={false} style={[styles.card, { backgroundColor: look.bg }]} testID="lyric-card">
            <Ionicons name="musical-notes" size={22} color={look.accent} />
            <Text style={[styles.quote, { color: look.text, fontSize: longText ? 20 : 24, lineHeight: longText ? 28 : 33 }]}>
              {lines.join('\n')}
            </Text>
            <View style={styles.cardFooter}>
              {track?.coverUrl ? <Image source={{ uri: track.coverUrl }} style={styles.cover} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={[styles.songTitle, { color: look.text }]} numberOfLines={1}>
                  {track?.title || 'Unknown song'}
                </Text>
                <Text style={[styles.songArtist, { color: look.soft }]} numberOfLines={1}>
                  {track?.artist || ''}
                </Text>
              </View>
              <Text style={[styles.brand, { color: look.soft }]}>Selah</Text>
            </View>
          </View>

          {/* How many lines */}
          <View style={styles.row}>
            <Text style={styles.label}>Lines</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepBtn, count <= 1 && styles.disabled]}
                disabled={count <= 1}
                onPress={() => setCount((n) => Math.max(1, n - 1))}
                testID="lyric-card-fewer"
              >
                <Ionicons name="remove" size={18} color={c.ink} />
              </TouchableOpacity>
              <Text style={styles.count}>{count}</Text>
              <TouchableOpacity
                style={[styles.stepBtn, !canAdd && styles.disabled]}
                disabled={!canAdd}
                onPress={() => setCount((n) => n + 1)}
                testID="lyric-card-more"
              >
                <Ionicons name="add" size={18} color={c.ink} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Colours */}
          <View style={styles.row}>
            <Text style={styles.label}>Style</Text>
            <View style={styles.swatches}>
              {CARD_STYLES.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setStyleId(s.id)}
                  style={[styles.swatch, { backgroundColor: s.bg }, styleId === s.id && styles.swatchActive]}
                  accessibilityLabel={`${s.name} style`}
                  testID={`lyric-style-${s.id}`}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={sharePicture} disabled={busy} testID="lyric-card-share">
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="share-social" size={18} color="#FFFFFF" />}
            <Text style={styles.shareText}>Share picture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.textBtn} onPress={shareAsText} testID="lyric-card-share-text">
            <Text style={styles.textBtnText}>Share as text</Text>
          </TouchableOpacity>
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
      gap: 14
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: c.text, fontSize: 18, fontWeight: '900' },
    card: { borderRadius: 22, padding: 22, minHeight: 260, justifyContent: 'space-between', gap: 16 },
    quote: { fontWeight: '800' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cover: { width: 40, height: 40, borderRadius: 8 },
    songTitle: { fontSize: 14, fontWeight: '800' },
    songArtist: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    brand: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { color: c.textMuted, fontSize: 13, fontWeight: '800' },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center'
    },
    disabled: { opacity: 0.35 },
    count: { color: c.text, fontSize: 16, fontWeight: '900', minWidth: 14, textAlign: 'center' },
    swatches: { flexDirection: 'row', gap: 10 },
    swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: c.border },
    swatchActive: { borderColor: c.text, borderWidth: 3 },
    shareBtn: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.inverse,
      borderRadius: 16,
      paddingVertical: 14
    },
    shareText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    textBtn: { alignItems: 'center', paddingVertical: 6 },
    textBtnText: { color: c.textMuted, fontWeight: '800', fontSize: 13 }
  });
