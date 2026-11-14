import React, { memo, useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SONG_PHOTOS } from '../services/id3Service';

// Rich colours for artists' initials (people, not songs): [main, glow]
const PALETTE = [
  ['#6D28D9', '#C4B5FD'],
  ['#1D4ED8', '#93C5FD'],
  ['#0E7490', '#67E8F9'],
  ['#047857', '#6EE7B7'],
  ['#A16207', '#FDE68A'],
  ['#B91C1C', '#FCA5A5'],
  ['#BE185D', '#F9A8D4'],
  ['#C2410C', '#FDBA74'],
  ['#4338CA', '#A5B4FC'],
  ['#0F766E', '#5EEAD4'],
  ['#7E22CE', '#E9D5FF'],
  ['#9A3412', '#FED7AA']
];

/** True when the song has its own picture: album art from inside the file, a YouTube thumbnail, or one you chose */
export function hasRealCover(track) {
  if (!track || !track.coverUrl) return false;
  return Boolean(track.coverFile || track.youtubeId || track.sourceType === 'youtube' || track.customCover);
}

/** The photo for a song without its own picture: the one Selah chose for it (as before), or the studio photo */
export function songPhoto(track) {
  const url = track && typeof track.coverUrl === 'string' ? track.coverUrl : '';
  return /^(https?|file|content):/i.test(url) ? url : SONG_PHOTOS.studio;
}

/** The same name always gets the same colours */
export function coverColors(track) {
  const key = `${(track && track.title) || ''}|${(track && track.artist) || ''}`.toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** "Joe Mettle" → "JM", "Sinach" → "S" */
export function initialsOf(title) {
  const words = String(title || '')
    .normalize('NFC') // accents stay part of their letter (Ọlọ́run, Àgbáyé)
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[^\p{L}\p{M}\p{N} ]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '♪';
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

/**
 * A song's picture: its own cover when it has one (album art, YouTube thumbnail, your choice),
 * otherwise Selah's photo for it, like before. If no picture can load (offline): a music note.
 * person: an artist, shown as a coloured circle with their initials.
 * size: the box size (when style has no width/height).
 */
function CoverArt({ track, size = 48, style, round = false, testID, person = false }) {
  const [attempt, setAttempt] = useState(0);
  const real = hasRealCover(track);
  const coverUrl = track && track.coverUrl;
  useEffect(() => setAttempt(0), [coverUrl]); // a new song: try its pictures again

  const shape = { width: size, height: size, borderRadius: round ? size / 2 : Math.round(size * 0.16), overflow: 'hidden' };

  if (!person) {
    const pictures = real ? [coverUrl, songPhoto({})] : [songPhoto(track)];
    if (attempt < pictures.length) {
      return (
        <Image
          key={pictures[attempt]}
          source={{ uri: pictures[attempt] }}
          style={[shape, style]}
          onError={() => setAttempt((n) => n + 1)}
          testID={testID || (real && attempt === 0 ? 'cover-real' : 'cover-photo')}
        />
      );
    }
    return (
      <View
        style={[shape, { backgroundColor: '#1F2430', alignItems: 'center', justifyContent: 'center' }, style]}
        testID={testID || 'cover-note'}
      >
        <Ionicons name="musical-note" size={Math.max(14, Math.round(size * 0.4))} color="rgba(255,255,255,0.75)" />
      </View>
    );
  }

  const [main, glow] = coverColors(track);
  return (
    <View
      style={[shape, { backgroundColor: main, alignItems: 'center', justifyContent: 'center' }, style]}
      testID={testID || 'cover-made'}
      accessibilityLabel={track && track.title ? track.title : 'Artist'}
    >
      <View
        style={{
          position: 'absolute',
          width: size * 1.2,
          height: size * 1.2,
          borderRadius: size * 0.6,
          backgroundColor: glow,
          opacity: 0.32,
          top: -size * 0.55,
          right: -size * 0.5
        }}
      />
      <Text
        style={{ color: '#FFFFFF', fontWeight: '900', fontSize: Math.max(10, Math.round(size * 0.34)), letterSpacing: 0.5 }}
        numberOfLines={1}
      >
        {initialsOf(track && track.title)}
      </Text>
    </View>
  );
}

export default memo(CoverArt);
