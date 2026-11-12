/**
 * Whole-app checks. Each test starts Selah like a phone would and taps through it.
 * They run twice: once as iPhone and once as Android (see "jest" in package.json).
 */
import React from 'react';
import { Platform, Alert } from 'react-native';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

const media = require('./mocks/mediaLibrary');
const fs = require('./mocks/fileSystem');
const audio = require('./mocks/audio');

jest.setTimeout(60000);

const isAndroid = Platform.OS === 'android';
const androidOnly = isAndroid ? test : test.skip;
const iphoneOnly = isAndroid ? test.skip : test;

const LYRICS = {
  id: 1,
  trackName: 'Way Maker',
  artistName: 'Sinach',
  albumName: 'Way Maker',
  duration: 300,
  instrumental: false,
  plainLyrics: 'You are here, moving in our midst',
  syncedLyrics:
    '[00:01.00] You are here, moving in our midst\n[00:06.00] I worship You, I worship You\n[00:12.00] You are here, working in this place'
};

const FORMATS = ['mp3', 'm4a', 'flac', 'wav', 'ogg', 'opus', 'aac', 'wma', 'amr', 'mid'];

function phoneSongs(count) {
  return Array.from({ length: count }, (_, i) => {
    const ext = FORMATS[i % FORMATS.length];
    return {
      id: String(i + 1),
      filename: `Sinach - Way Maker ${i}.${ext}`,
      uri: `file:///storage/emulated/0/Music/Sinach%20-%20Way%20Maker%20${i}.${ext}`,
      mediaType: 'audio',
      duration: 240 + i,
      modificationTime: 1700000000000 + i
    };
  });
}

// Let the app finish its start-up work (storage, scanning, lyrics lookups)
async function settle(rounds = 15) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });
  }
}

async function tap(element) {
  await fireEvent.press(element);
  await settle(4);
}

beforeAll(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@selah_has_onboarded', 'true');
  fs.__reset();
  media.__state.audio = [];
  media.__state.other = [];
  media.__state.permission = 'granted';
  media.getPermissionsAsync.mockClear();
  media.requestPermissionsAsync.mockClear();
  media.getAssetsAsync.mockClear();
  audio.createAudioPlayer.mockClear();
  audio.__players.length = 0;
  Alert.alert.mockClear();
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    status: 200,
    json: async () => (String(url).includes('lrclib') ? [LYRICS] : []),
    text: async () => ''
  }));
});

afterEach(async () => {
  await cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('fresh install with no music: every tab and player view opens without crashing', async () => {
  await render(<App />);
  await settle();

  expect(screen.getByText('Your Songs')).toBeTruthy();
  expect(screen.getByText('No songs yet')).toBeTruthy();
  // the 5 old demo songs are gone
  for (const title of ['Gratitude (Acoustic Reflection)', 'Oceans (Where Feet May Fail)', 'Peaceful Mind & Lo-Fi Beats', 'Goodness of God', 'House of the Lord']) {
    expect(screen.queryByText(title)).toBeNull();
  }

  await tap(screen.getByTestId('tab-player'));
  expect(screen.getByText('Nothing playing yet')).toBeTruthy();
  for (const view of ['lyrics', 'queue', 'library', 'now']) {
    await tap(screen.getByTestId(`player-view-${view}`));
  }

  await tap(screen.getByTestId('tab-library'));
  expect(screen.getByText(isAndroid ? 'Scan My Phone for Music' : "Scan Selah's Folder")).toBeTruthy();

  await tap(screen.getByTestId('tab-youtube'));
  await tap(screen.getByTestId('tab-playlists'));
  await tap(screen.getByTestId('tab-home'));
  expect(screen.getByText('Your Songs')).toBeTruthy();

  if (!isAndroid) {
    // iPhone must never ask for Photos access or read the photo library
    expect(media.getPermissionsAsync).not.toHaveBeenCalled();
    expect(media.getAssetsAsync).not.toHaveBeenCalled();
  }
});

androidOnly('finds every song on the phone, plays one, shows Now Playing, lyrics and queue', async () => {
  media.__state.audio = phoneSongs(30);
  await render(<App />);
  await settle(25);

  expect(screen.getByText('30 available')).toBeTruthy();
  expect(screen.queryByText('Recently Played')).toBeNull(); // scanning must not fake "recently played"

  // the library is saved to a file
  const saved = JSON.parse(fs.__FS['file:///docs/.selah/'].files['library.json'].content);
  expect(saved).toHaveLength(30);

  // play a song
  await tap(screen.getAllByText('Way Maker 3')[0]);
  expect(audio.createAudioPlayer).toHaveBeenLastCalledWith(
    'file:///storage/emulated/0/Music/Sinach%20-%20Way%20Maker%203.wav'
  );
  const player = audio.__players[audio.__players.length - 1];
  expect(player.play).toHaveBeenCalled();
  await act(async () => {
    player.emit('playbackStatusUpdate', { isLoaded: true, currentTime: 7, duration: 243, didJustFinish: false });
  });

  // full player
  await tap(screen.getByTestId('tab-player'));
  await settle(10);
  expect(screen.getAllByText('Way Maker 3').length).toBeGreaterThan(0);
  expect(screen.getAllByText('I worship You, I worship You').length).toBeGreaterThan(0); // live lyric line

  await tap(screen.getByTestId('player-view-lyrics'));
  expect(screen.getByText('You are here, working in this place')).toBeTruthy();
  expect(screen.getByText('SYNCED · LRCLIB')).toBeTruthy();

  await tap(screen.getByTestId('player-view-queue'));
  expect(screen.getByText('Playback Queue')).toBeTruthy();

  await tap(screen.getByTestId('player-view-library'));
  await tap(screen.getByTestId('tab-home'));
  expect(screen.getByText('Recently Played')).toBeTruthy();
});

androidOnly('a format the phone cannot play shows a clear message instead of failing', async () => {
  media.__state.audio = phoneSongs(10);
  await render(<App />);
  await settle(25);

  audio.createAudioPlayer.mockClear();
  await tap(screen.getAllByText('Way Maker 7')[0]); // .wma
  expect(Alert.alert).toHaveBeenCalledWith('Format not supported', expect.stringContaining('.wma'));
  expect(audio.createAudioPlayer).not.toHaveBeenCalled();
});

androidOnly('library is remembered after restart, and deleted songs disappear', async () => {
  media.__state.audio = phoneSongs(30);
  await render(<App />);
  await settle(25);
  expect(screen.getByText('30 available')).toBeTruthy();
  await cleanup();

  media.__state.audio = phoneSongs(25); // 5 songs were deleted from the phone
  await render(<App />);
  await settle(25);
  expect(screen.getByText('25 available')).toBeTruthy();
});

androidOnly('if music permission is refused, the scan explains how to allow it', async () => {
  media.__state.permission = 'denied';
  await render(<App />);
  await settle();

  await tap(screen.getByTestId('tab-library'));
  Alert.alert.mockClear();
  await tap(screen.getByText('Scan My Phone for Music'));
  await settle(10);
  expect(Alert.alert).toHaveBeenCalledWith('Audio Permission Needed', expect.any(String), expect.any(Array));
});

iphoneOnly("finds songs in Selah's folder without asking for Photos access", async () => {
  fs.__reset({
    'file:///docs/': { dirs: ['Selah Music', '.selah'], files: {} },
    'file:///docs/Selah%20Music/': { dirs: [], files: { 'Sinach - Way Maker.mp3': { size: 100, content: '' } } },
    'file:///docs/.selah/': { dirs: [], files: {} }
  });
  await render(<App />);
  await settle(20);

  expect(screen.getByText('1 available')).toBeTruthy();
  expect(media.getPermissionsAsync).not.toHaveBeenCalled();
  expect(media.getAssetsAsync).not.toHaveBeenCalled();
});
