import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';
import CoverArt from './CoverArt';
import { GENRES, ARTISTS, latestSongsSearch, artistSearch } from '../data/discover';

/**
 * Libraries: music genres and gospel artists to follow.
 * Tapping a genre or an artist shows its latest songs on YouTube.
 */
export default function LibrariesModal({ visible, onClose, followed = [], onToggleFollow, onSearch }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  if (!visible) return null;

  const isFollowed = (name) => followed.includes(name);
  const extraFollowed = followed.filter((name) => !ARTISTS.some((a) => a.name === name));
  const artists = [...extraFollowed.map((name) => ({ name, from: '' })), ...ARTISTS];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Libraries</Text>
            <Text style={styles.subtitle}>Tap a genre or an artist to see the latest songs</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close" testID="libraries-close">
            <Ionicons name="close" size={22} color={c.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>Genres</Text>
          <View style={styles.grid}>
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.genre, { backgroundColor: g.color }]}
                onPress={() => onSearch(latestSongsSearch(g.search))}
                activeOpacity={0.85}
                testID={`genre-${g.id}`}
              >
                <View style={styles.genreGlow} />
                <Ionicons name={g.icon} size={22} color="#FFFFFF" />
                <Text style={styles.genreName} numberOfLines={2}>{g.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {followed.length > 0 && (
            <>
              <Text style={styles.section}>Artists you follow</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
                {followed.map((name) => (
                  <TouchableOpacity key={name} style={styles.followedCard} onPress={() => onSearch(artistSearch(name))} activeOpacity={0.85}>
                    <CoverArt track={{ title: name }} size={60} round />
                    <Text style={styles.followedName} numberOfLines={1}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.section}>Gospel artists</Text>
          {artists.map((a) => {
            const on = isFollowed(a.name);
            return (
              <View key={a.name} style={styles.artistRow}>
                <TouchableOpacity
                  style={styles.artistInfo}
                  onPress={() => onSearch(artistSearch(a.name))}
                  activeOpacity={0.8}
                  testID={`artist-${a.name}`}
                >
                  <CoverArt track={{ title: a.name }} size={44} round />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.artistName} numberOfLines={1}>{a.name}</Text>
                    <Text style={styles.artistFrom}>{a.from ? `${a.from} · latest songs` : 'Latest songs'}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.followBtn, on && styles.followBtnOn]}
                  onPress={() => onToggleFollow(a.name)}
                  accessibilityLabel={on ? `Unfollow ${a.name}` : `Follow ${a.name}`}
                  testID={`follow-${a.name}`}
                >
                  <Ionicons name={on ? 'checkmark' : 'person-add-outline'} size={14} color={on ? '#FFFFFF' : c.ink} />
                  <Text style={[styles.followText, on && styles.followTextOn]}>{on ? 'Following' : 'Follow'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    title: { color: c.text, fontSize: 24, fontWeight: '900' },
    subtitle: { color: c.textMuted, fontSize: 13, marginTop: 2 },
    closeBtn: { padding: 8, backgroundColor: c.surfaceAlt, borderRadius: 20, borderWidth: 1, borderColor: c.border },
    content: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: c.text, fontSize: 17, fontWeight: '900', marginTop: 18, marginBottom: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
    genre: {
      width: '48.5%',
      height: 86,
      borderRadius: 16,
      padding: 12,
      justifyContent: 'space-between',
      overflow: 'hidden'
    },
    genreGlow: {
      position: 'absolute',
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: '#FFFFFF',
      opacity: 0.14,
      top: -50,
      right: -40
    },
    genreName: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
    followedCard: { width: 76, alignItems: 'center', gap: 6 },
    followedName: { color: c.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
    artistRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
    artistInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    artistName: { color: c.text, fontSize: 15, fontWeight: '800' },
    artistFrom: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    followBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceAlt
    },
    followBtnOn: { backgroundColor: c.inverse, borderColor: c.inverse },
    followText: { color: c.ink, fontWeight: '800', fontSize: 12 },
    followTextOn: { color: '#FFFFFF' }
  });
