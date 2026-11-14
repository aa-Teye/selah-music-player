import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react-native';
import IntroSplash from '../src/components/IntroSplash';

const SplashScreen = require('expo-splash-screen');

async function wait(ms) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  SplashScreen.hideAsync.mockClear();
});

afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

const LAYOUT = { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } } };

test('the opening takes over from the start screen, spells SELAH, then opens the app by itself', async () => {
  const onDone = jest.fn();
  await render(<IntroSplash onDone={onDone} />);
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled(); // not before it is on screen
  await fireEvent(screen.getByTestId('intro-splash'), 'layout', LAYOUT);
  await wait(0);
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1); // the phone's start screen hands over
  expect(screen.getByTestId('intro-logo')).toBeTruthy();
  ['S', 'E', 'L', 'A', 'H'].forEach((letter) => expect(screen.getByText(letter)).toBeTruthy());
  expect(screen.getByText('MUSIC PLAYER')).toBeTruthy();

  // (in tests React Native plays animations instantly; on a phone this takes about two seconds)
  for (let i = 0; i < 30; i++) await wait(100);
  expect(onDone).toHaveBeenCalledTimes(1); // then Home
});

test('it still starts if the screen is slow to report its layout', async () => {
  const onDone = jest.fn();
  await render(<IntroSplash onDone={onDone} />);
  await wait(600);
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  for (let i = 0; i < 30; i++) await wait(100);
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('a tap skips the opening', async () => {
  const onDone = jest.fn();
  await render(<IntroSplash onDone={onDone} />);
  await wait(100);
  await fireEvent.press(screen.getByLabelText('Selah. Tap to skip'));
  await wait(400);
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('with Reduce motion on, nothing moves and it is shorter', async () => {
  const spy = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const onDone = jest.fn();
  await render(<IntroSplash onDone={onDone} />);
  await wait(0);
  await wait(0);
  for (let i = 0; i < 13; i++) await wait(100);
  expect(onDone).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});
