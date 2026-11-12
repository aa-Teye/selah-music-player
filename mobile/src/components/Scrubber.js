import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';

const formatTime = (secs) => {
  if (!secs || isNaN(secs) || secs < 0) return '0:00';
  const total = Math.floor(secs);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${ss}` : `${m}:${ss}`;
};

/**
 * Progress bar you can tap OR drag. While dragging it shows the time you are
 * moving to, and only jumps when you let go.
 */
export default function Scrubber({ position = 0, duration = 0, onSeek }) {
  const styles = useThemedStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const [dragRatio, setDragRatio] = useState(null);
  const widthRef = useRef(0);
  const durationRef = useRef(duration);
  const onSeekRef = useRef(onSeek);
  const startXRef = useRef(0);
  const dragRatioRef = useRef(null);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    onSeekRef.current = onSeek;
  }, [onSeek]);

  const responder = useMemo(() => {
    const ratioFromX = (x) => {
      const w = widthRef.current;
      if (w <= 0) return 0;
      return Math.max(0, Math.min(1, x / w));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        startXRef.current = evt.nativeEvent.locationX;
        const r = ratioFromX(startXRef.current);
        dragRatioRef.current = r;
        setDragRatio(r);
      },
      onPanResponderMove: (_evt, gesture) => {
        const r = ratioFromX(startXRef.current + gesture.dx);
        dragRatioRef.current = r;
        setDragRatio(r);
      },
      onPanResponderRelease: () => {
        const r = dragRatioRef.current;
        dragRatioRef.current = null;
        setDragRatio(null);
        if (r != null && durationRef.current > 0 && onSeekRef.current) {
          onSeekRef.current(Math.round(r * durationRef.current));
        }
      },
      onPanResponderTerminate: () => {
        dragRatioRef.current = null;
        setDragRatio(null);
      }
    });
  }, []);

  const dragging = dragRatio != null;
  const ratio = dragging ? dragRatio : duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const shownTime = dragging ? dragRatio * duration : position;
  const thumbLeft = Math.max(0, Math.min(width - 16, ratio * width - 8));
  const bubbleLeft = Math.max(0, Math.min(width - 56, ratio * width - 28));

  return (
    <View style={styles.wrap}>
      <View
        style={styles.touchArea}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
        {...responder.panHandlers}
      >
        <View pointerEvents="none" style={[styles.track, dragging && styles.trackActive]}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <View pointerEvents="none" style={[styles.thumb, dragging && styles.thumbActive, { left: thumbLeft }]} />
        {dragging && (
          <View pointerEvents="none" style={[styles.bubble, { left: bubbleLeft }]}>
            <Text style={styles.bubbleText}>{formatTime(shownTime)}</Text>
          </View>
        )}
      </View>
      <View style={styles.timesRow}>
        <Text style={styles.time}>{formatTime(shownTime)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  touchArea: { height: 40, justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, backgroundColor: c.surfaceStrong, overflow: 'hidden' },
  trackActive: { height: 8, borderRadius: 4 },
  fill: { height: '100%', backgroundColor: c.inverse },
  thumb: {
    position: 'absolute',
    top: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: c.inverse,
    borderWidth: 2,
    borderColor: c.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3
  },
  thumbActive: { transform: [{ scale: 1.35 }] },
  bubble: {
    position: 'absolute',
    top: -14,
    width: 56,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: c.inverse,
    alignItems: 'center'
  },
  bubbleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  timesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  time: { color: c.textMuted, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }
});
