import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// The player reports whole seconds, so look slightly ahead to feel in time
const LOOKAHEAD = 0.5;

/** Index of the last line whose time has been reached (-1 = still in the intro) */
export function findActiveIndex(lines, position) {
  if (!lines || lines.length === 0) return -1;
  let lo = 0;
  let hi = lines.length - 1;
  let answer = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= position) {
      answer = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return answer;
}

function sourceLabel(lyrics) {
  const synced = lyrics.mode === 'synced';
  if (lyrics.source === 'custom') return synced ? 'YOUR LYRICS · SYNCED' : 'YOUR LYRICS';
  if (lyrics.source === 'lrclib') return synced ? 'SYNCED · LRCLIB' : 'LYRICS · LRCLIB';
  return synced ? 'SYNCED LYRICS' : 'LYRICS';
}

function Pill({ icon, label, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.pill, disabled && styles.pillDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      {icon}
      <Text style={styles.pillText}>{label}</Text>
    </TouchableOpacity>
  );
}

/**
 * Full lyrics page: synced highlight + auto-scroll, tap a line to jump there,
 * text size, timing adjustment, other versions, and your own lyrics.
 */
export default function SyncedLyricsView({ lyrics, track, currentPosition = 0, onSeek }) {
  const [fontScale, setFontScale] = useState(1);
  const [editVisible, setEditVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const [viewHeight, setViewHeight] = useState(320);
  const scrollRef = useRef(null);
  const layoutsRef = useRef({});
  const pausedUntilRef = useRef(0);

  const position = currentPosition + (lyrics.offset || 0) + LOOKAHEAD;
  const activeIndex = lyrics.mode === 'synced' ? findActiveIndex(lyrics.lines, position) : -1;

  // Keep the current line in the middle (unless the reader is scrolling by hand)
  useEffect(() => {
    if (lyrics.mode !== 'synced' || activeIndex < 0) return;
    if (Date.now() < pausedUntilRef.current) return;
    const layout = layoutsRef.current[activeIndex];
    if (!layout || !scrollRef.current) return;
    scrollRef.current.scrollTo({
      y: Math.max(0, layout.y - viewHeight / 2 + layout.height / 2),
      animated: true
    });
  }, [activeIndex, lyrics.mode, viewHeight, fontScale]);

  const pauseAutoScroll = () => {
    pausedUntilRef.current = Date.now() + 5000;
  };

  const openEditor = () => {
    setEditText(lyrics.rawText || '');
    setEditVisible(true);
  };

  const saveEditor = async () => {
    await lyrics.saveCustom(editText);
    setEditVisible(false);
  };

  const fontSize = 20 * fontScale;
  const lineHeight = 30 * fontScale;

  const renderBody = () => {
    if (lyrics.status === 'loading') {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#12141A" />
          <Text style={styles.centerTitle}>Looking for lyrics…</Text>
        </View>
      );
    }

    if (lyrics.mode === 'synced') {
      return (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          onLayout={(e) => setViewHeight(e.nativeEvent.layout.height)}
          onScrollBeginDrag={pauseAutoScroll}
          onMomentumScrollEnd={pauseAutoScroll}
          contentContainerStyle={{ paddingVertical: viewHeight / 2.2, paddingHorizontal: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {lyrics.lines.map((line, i) => {
            const isActive = i === activeIndex;
            const isPast = activeIndex >= 0 && i < activeIndex;
            return (
              <TouchableOpacity
                key={line.id}
                activeOpacity={0.7}
                onLayout={(e) => {
                  layoutsRef.current[i] = e.nativeEvent.layout;
                }}
                onPress={() => onSeek && onSeek(Math.max(0, Math.round(line.time - (lyrics.offset || 0))))}
                style={styles.lineBox}
              >
                <Text
                  style={[
                    styles.lineText,
                    { fontSize, lineHeight },
                    isPast && styles.pastLine,
                    isActive && styles.activeLine
                  ]}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );
    }

    if (lyrics.mode === 'plain') {
      return (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.plainNote}>These lyrics are not time-synced for this song.</Text>
          {lyrics.plainLines.map((line, i) =>
            line === '' ? (
              <View key={i} style={{ height: 14 }} />
            ) : (
              <Text key={i} style={[styles.plainLine, { fontSize: 17 * fontScale, lineHeight: 26 * fontScale }]}>
                {line}
              </Text>
            )
          )}
        </ScrollView>
      );
    }

    // No lyrics
    const isError = lyrics.status === 'error';
    return (
      <View style={styles.centerBox}>
        <MaterialCommunityIcons
          name={lyrics.instrumental ? 'music-clef-treble' : isError ? 'wifi-off' : 'music-note-off'}
          size={36}
          color="#8A919E"
        />
        <Text style={styles.centerTitle}>
          {lyrics.instrumental
            ? 'This song is an instrumental'
            : isError
            ? 'Could not reach the lyrics service'
            : 'No lyrics found for this song'}
        </Text>
        <Text style={styles.centerSub}>
          {isError
            ? 'Check your internet connection and try again.'
            : lyrics.canSearch
            ? 'Selah searched the free LRCLIB lyrics library. You can search again or add your own.'
            : 'You can add your own lyrics for this song.'}
        </Text>
        <View style={styles.centerActions}>
          {lyrics.canSearch && (
            <TouchableOpacity style={styles.primaryBtn} onPress={lyrics.refresh}>
              <Ionicons name="search" size={14} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Search again</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryBtn} onPress={openEditor}>
            <Ionicons name="add" size={16} color="#12141A" />
            <Text style={styles.secondaryBtnText}>Add lyrics</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const hasLyrics = lyrics.mode !== 'none';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="microphone-variant" size={13} color="#12141A" />
          <Text style={styles.badgeText}>{sourceLabel(lyrics)}</Text>
        </View>
        {lyrics.matched && lyrics.source === 'lrclib' && (
          <Text style={styles.matchText} numberOfLines={1}>
            {lyrics.matched.artistName}
          </Text>
        )}
      </View>

      {hasLyrics && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillRow}
          contentContainerStyle={styles.pillRowContent}
        >
          <Pill icon={<Ionicons name="pencil" size={13} color="#12141A" />} label="Edit" onPress={openEditor} />
          {lyrics.canSearch && (
            <Pill icon={<Ionicons name="refresh" size={13} color="#12141A" />} label="Search again" onPress={lyrics.refresh} />
          )}
          {lyrics.source === 'lrclib' && lyrics.versionCount > 1 && (
            <Pill
              icon={<Ionicons name="swap-horizontal" size={14} color="#12141A" />}
              label={`Version ${(lyrics.versionIndex % lyrics.versionCount) + 1}/${lyrics.versionCount}`}
              onPress={lyrics.nextVersion}
            />
          )}
          {lyrics.mode === 'synced' && (
            <>
              <Pill icon={<Ionicons name="remove" size={14} color="#12141A" />} label="Earlier" onPress={() => lyrics.adjustOffset(-0.5)} />
              <View style={styles.offsetChip}>
                <Text style={styles.offsetText}>
                  {lyrics.offset > 0 ? '+' : ''}
                  {lyrics.offset.toFixed(1)}s
                </Text>
              </View>
              <Pill icon={<Ionicons name="add" size={14} color="#12141A" />} label="Later" onPress={() => lyrics.adjustOffset(0.5)} />
            </>
          )}
          <Pill
            icon={<Ionicons name="text" size={13} color="#12141A" />}
            label="A−"
            onPress={() => setFontScale((s) => Math.max(0.8, Math.round((s - 0.1) * 10) / 10))}
          />
          <Pill
            icon={<Ionicons name="text" size={17} color="#12141A" />}
            label="A+"
            onPress={() => setFontScale((s) => Math.min(1.6, Math.round((s + 0.1) * 10) / 10))}
          />
        </ScrollView>
      )}

      <View style={styles.body}>{renderBody()}</View>

      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your lyrics</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={22} color="#717886" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub} numberOfLines={2}>
              Paste lyrics for “{track?.title}”. Lines that start with a time like [00:15.00] will highlight in time with the music.
            </Text>
            <TextInput
              style={styles.textInput}
              multiline
              value={editText}
              onChangeText={setEditText}
              placeholder="Paste lyrics here…"
              placeholderTextColor="#8A919E"
              textAlignVertical="top"
            />
            <View style={styles.modalFooter}>
              {lyrics.source === 'custom' && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={async () => {
                    await lyrics.saveCustom('');
                    setEditVisible(false);
                  }}
                >
                  <Text style={styles.removeBtnText}>Remove mine</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEditor}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/** Small card for the Now Playing page: previous / current / next line */
export function LyricsPreview({ lyrics, currentPosition = 0, onPress }) {
  const position = currentPosition + (lyrics.offset || 0) + LOOKAHEAD;
  let body;

  if (lyrics.status === 'loading') {
    body = (
      <View style={styles.previewRow}>
        <ActivityIndicator size="small" color="#717886" />
        <Text style={styles.previewMuted}>  Looking for lyrics…</Text>
      </View>
    );
  } else if (lyrics.mode === 'synced') {
    const idx = findActiveIndex(lyrics.lines, position);
    const prev = idx > 0 ? lyrics.lines[idx - 1].text : '';
    const current = idx >= 0 ? lyrics.lines[idx].text : '♪';
    const next = lyrics.lines[idx + 1] ? lyrics.lines[idx + 1].text : '';
    body = (
      <View>
        <Text style={styles.previewDim} numberOfLines={1}>{prev || ' '}</Text>
        <Text style={styles.previewActive} numberOfLines={2}>{current}</Text>
        <Text style={styles.previewDim} numberOfLines={1}>{next || ' '}</Text>
      </View>
    );
  } else if (lyrics.mode === 'plain') {
    const first = lyrics.plainLines.filter((l) => l !== '').slice(0, 3);
    body = (
      <View>
        {first.map((l, i) => (
          <Text key={i} style={i === 0 ? styles.previewActive : styles.previewDim} numberOfLines={1}>
            {l}
          </Text>
        ))}
      </View>
    );
  } else {
    body = (
      <Text style={styles.previewMuted}>
        {lyrics.instrumental
          ? 'Instrumental'
          : lyrics.status === 'error'
          ? 'Could not load lyrics. Tap to try again.'
          : 'No lyrics yet. Tap to find or add them.'}
      </Text>
    );
  }

  return (
    <TouchableOpacity style={styles.previewCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.previewHeader}>
        <View style={styles.previewTitleRow}>
          <MaterialCommunityIcons name="microphone-variant" size={13} color="#12141A" />
          <Text style={styles.previewTitle}>LYRICS</Text>
        </View>
        <Ionicons name="expand" size={15} color="#8A919E" />
      </View>
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF0F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  badgeText: { color: '#12141A', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  matchText: { color: '#8A919E', fontSize: 12, fontWeight: '600', maxWidth: 150 },
  pillRow: { flexGrow: 0, marginBottom: 8 },
  pillRowContent: { paddingHorizontal: 2, gap: 8, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16
  },
  pillDisabled: { opacity: 0.4 },
  pillText: { color: '#12141A', fontSize: 12, fontWeight: '700' },
  offsetChip: { paddingHorizontal: 4 },
  offsetText: { color: '#717886', fontSize: 12, fontWeight: '700' },
  body: { flex: 1 },
  scroll: { flex: 1 },
  lineBox: { paddingVertical: 8 },
  lineText: { textAlign: 'center', color: '#8A919E', fontWeight: '700' },
  pastLine: { color: '#B6BCC8' },
  activeLine: { color: '#12141A', fontWeight: '900' },
  plainNote: {
    color: '#8A919E',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic'
  },
  plainLine: { color: '#12141A', textAlign: 'center', fontWeight: '600' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 10 },
  centerTitle: { color: '#12141A', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  centerSub: { color: '#717886', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  centerActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#12141A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF0F4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18
  },
  secondaryBtnText: { color: '#12141A', fontWeight: '800', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 17, 21, 0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#0F1115', fontSize: 18, fontWeight: '800' },
  modalSub: { color: '#717886', fontSize: 12, lineHeight: 17, marginTop: 6, marginBottom: 12 },
  textInput: {
    height: 260,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    color: '#0F1115',
    fontSize: 15
  },
  modalFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  removeBtn: { paddingVertical: 10, paddingHorizontal: 4 },
  removeBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: '#717886', fontWeight: '700', fontSize: 14 },
  saveBtn: { backgroundColor: '#12141A', paddingVertical: 10, paddingHorizontal: 22, borderRadius: 18 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  previewCard: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  previewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewTitle: { color: '#12141A', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  previewRow: { flexDirection: 'row', alignItems: 'center' },
  previewActive: { color: '#12141A', fontSize: 17, fontWeight: '800', lineHeight: 24, marginVertical: 2 },
  previewDim: { color: '#9AA1AE', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  previewMuted: { color: '#717886', fontSize: 14, lineHeight: 20 }
});
