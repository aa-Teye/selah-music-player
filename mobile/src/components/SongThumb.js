import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CoverArt, { hasRealCover } from './CoverArt';

/**
 * A song's small picture in lists: its own cover (read from inside the file) when it has one,
 * otherwise a colourful cover made from its name. Shows a speaker while it plays.
 */
function SongThumb({ track, isCurrent, isPlaying, size = 40 }) {
  const radius = Math.round(size / 4);
  return (
    <View
      style={[styles.box, { width: size, height: size, borderRadius: radius }]}
      testID={hasRealCover(track) ? 'song-cover' : undefined}
    >
      <CoverArt track={track} size={size} style={{ borderRadius: radius }} />
      {isCurrent && isPlaying ? (
        <View style={[styles.playing, { width: size, height: size, borderRadius: radius }]}>
          <Ionicons name="volume-high" size={18} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}

export default memo(SongThumb);

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  playing: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  }
});
