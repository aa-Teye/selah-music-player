import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useColors, useThemedStyles } from '../theme/ThemeContext';
import { measureTourTarget } from '../tour/tourTargets';
import { TOUR_STEPS } from '../data/tour';

const RING_PAD = 8;

/**
 * The guided tour: points at each part of Selah with a glowing ring and says what it is for.
 * Next / Skip; the last step says "Done". Parts that are not on screen get a card in the middle.
 */
export default function GuidedTour({ visible, onDone, steps = TOUR_STEPS }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const win = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState(null);

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  const step = steps[index];
  useEffect(() => {
    if (!visible || !step) return undefined;
    let current = true;
    setSpot(null);
    measureTourTarget(step.target).then((rect) => {
      if (current) setSpot(rect);
    });
    return () => {
      current = false;
    };
  }, [visible, step]);

  if (!visible || !step) return null;
  const last = index === steps.length - 1;
  const next = () => (last ? onDone() : setIndex((i) => i + 1));

  // The ring around the part, and the card above or below it
  const ring = spot && {
    left: spot.x - RING_PAD,
    top: spot.y - RING_PAD,
    width: spot.width + RING_PAD * 2,
    height: spot.height + RING_PAD * 2,
    borderRadius: Math.min(24, (spot.height + RING_PAD * 2) / 2)
  };
  const cardBelow = spot && spot.y + spot.height / 2 < win.height / 2;
  const cardPlace = !spot
    ? { top: win.height * 0.32 }
    : cardBelow
    ? { top: spot.y + spot.height + RING_PAD + 14 }
    : { bottom: win.height - spot.y + RING_PAD + 14 };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.backdrop} testID="guided-tour">
        {ring ? (
          <>
            <View style={[styles.glow, ring]} pointerEvents="none" />
            <View style={[styles.ring, ring]} pointerEvents="none" testID="tour-ring" />
          </>
        ) : null}
        <View style={[styles.card, cardPlace]}>
          <Text style={styles.count}>
            {index + 1} of {steps.length}
          </Text>
          <Text style={styles.title} testID="tour-title">{step.title}</Text>
          <Text style={styles.text}>{step.text}</Text>
          <View style={styles.buttons}>
            {!last ? (
              <TouchableOpacity onPress={onDone} testID="tour-skip" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.skip}>Skip</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity style={styles.next} onPress={next} testID="tour-next">
              <Text style={styles.nextText}>{last ? 'Done' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(8, 9, 12, 0.72)' },
    glow: { position: 'absolute', backgroundColor: 'rgba(232, 196, 104, 0.22)' },
    ring: { position: 'absolute', borderWidth: 3, borderColor: '#E8C468' },
    card: {
      position: 'absolute',
      left: 20,
      right: 20,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 18,
      gap: 8,
      borderWidth: 1,
      borderColor: c.border
    },
    count: { color: c.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    title: { color: c.text, fontSize: 19, fontWeight: '900' },
    text: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
    buttons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    skip: { color: c.textMuted, fontWeight: '800', fontSize: 14 },
    next: { backgroundColor: c.inverse, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 22 },
    nextText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 }
  });
