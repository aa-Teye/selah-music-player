import React from 'react';
import { View } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GuidedTour from '../src/components/GuidedTour';
import { useTourTarget, measureTourTarget } from '../src/tour/tourTargets';
import { TOUR_STEPS } from '../src/data/tour';
import { whatsNewToShow, LATEST_WHATS_NEW, WHATS_NEW } from '../src/data/whatsNew';

const ionicons = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('the tour goes through every part, with Next, Skip and Done', async () => {
  const onDone = jest.fn();
  await render(<GuidedTour visible onDone={onDone} />);
  await act(async () => {});
  expect(screen.getByTestId('tour-title').props.children).toBe('Home');
  expect(screen.getByText(`1 of ${TOUR_STEPS.length}`)).toBeTruthy();
  for (let i = 1; i < TOUR_STEPS.length; i++) {
    await fireEvent.press(screen.getByTestId('tour-next'));
    await act(async () => {});
    expect(screen.getByTestId('tour-title').props.children).toBe(TOUR_STEPS[i].title);
  }
  expect(screen.queryByTestId('tour-skip')).toBeNull(); // the last step has only "Done"
  expect(screen.getByText('Done')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('tour-next'));
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('Skip ends the tour straight away', async () => {
  const onDone = jest.fn();
  await render(<GuidedTour visible onDone={onDone} />);
  await fireEvent.press(screen.getByTestId('tour-skip'));
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('the tour finds where a part is on screen, and draws a ring around it', async () => {
  function Part() {
    const ref = useTourTarget('tab-home');
    // a stand-in for the phone telling where the part is on screen
    ref.current = { measureInWindow: (cb) => cb(10, 700, 70, 50) };
    return <View />;
  }
  await render(
    <>
      <Part />
      <GuidedTour visible onDone={() => {}} />
    </>
  );
  await act(async () => {});
  expect(await measureTourTarget('tab-home')).toEqual({ x: 10, y: 700, width: 70, height: 50 });
  expect(await measureTourTarget('not-on-screen')).toBeNull();
  expect(screen.getByTestId('tour-ring')).toBeTruthy();
});

test('every tour step has a title and an explanation', () => {
  TOUR_STEPS.forEach((step) => {
    expect(step.target).toMatch(/^[a-z-]+$/);
    expect(step.title.length).toBeGreaterThan(2);
    expect(step.text.length).toBeGreaterThan(20);
  });
});

test("what's new: nothing on a fresh install; once after an update; then not again", async () => {
  expect(await whatsNewToShow(true)).toBeNull(); // fresh install: the tour instead
  expect(await whatsNewToShow(false)).toBeNull(); // already marked as seen

  await AsyncStorage.setItem('@selah_whats_new_seen', 'an-older-update');
  expect(await whatsNewToShow(false)).toBe(LATEST_WHATS_NEW); // after an update
  expect(await whatsNewToShow(false)).toBeNull(); // only once
});

test("every what's new entry has its own id and real icons", () => {
  expect(new Set(WHATS_NEW.map((n) => n.id)).size).toBe(WHATS_NEW.length);
  WHATS_NEW.forEach((n) => n.items.forEach((item) => expect(ionicons[item.icon]).toBeDefined()));
});
