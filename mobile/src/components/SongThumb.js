import React, { memo, useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';
import { hasRealCover } from './CoverArt';

/**
 * A song's small picture in lists: its own cover (album art from the file, or a YouTube
 * thumbnail) when it has one, otherwise a music note, like before. Shows a speaker while it plays.
 */
function SongThumb({ track, isCurrent, isPlaying, size = 40 }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [failed, setFailed] = useState(false);
  const coverUrl = track && track.coverUrl;
  useEffect(() => setFailed(false), [coverUrl]);
  const hasCover = hasRealCover(track) && !failed;
  const box = { width: size, height: size, borderRadius: Math.round(size / 4) };

  return (
    <View style={[styles.box, box]} testID={hasCover ? 'song-cover' : 'song-note'}>
      {hasCover ? (
        <Image source={{ uri: coverUrl }} style={[styles.image, box]} onError={() => setFailed(true)} />
      ) : null}
      {isCurrent && isPlaying ? (
        <View style={[styles.playing, hasCover && styles.playingOnCover, box]}>
          <Ionicons name="volume-high" size={18} color={hasCover ? '#FFFFFF' : c.ink} />
        </View>
      ) : !hasCover ? (
        <Ionicons name="musical-note" size={20} color={isCurrent ? c.ink : c.textSubtle} />
      ) : null}
    </View>
  );
}

export default memo(SongThumb);

const makeStyles = (c) =>
  StyleSheet.create({
    box: {
      backgroundColor: c.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden'
    },
    image: { position: 'absolute', top: 0, left: 0 },
    playing: { position: 'absolute', top: 0, left: 0, justifyContent: 'center', alignItems: 'center' },
    playingOnCover: { backgroundColor: 'rgba(0, 0, 0, 0.45)' }
  });
