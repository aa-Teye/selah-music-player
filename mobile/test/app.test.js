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

const OCEANS = {
  id: 2,
  trackName: 'Oceans (Where Feet May Fail)',
  artistName: 'Hillsong UNITED',
  albumName: 'Zion',
  duration: 534,
  instrumental: false,
  plainLyrics: 'You call me out upon the waters',
  syncedLyrics: '[00:10.00] You call me out upon the waters\n[00:16.00] The great unknown where feet may fail'
};

test('bottom tabs are in the new order: Home, Library, YouTube, Player, Playlists', async () => {
  await render(<App />);
  await settle();
  const ids = screen.getAllByTestId(/^tab-/).map((el) => el.props.testID);
  expect(ids).toEqual(['tab-home', 'tab-library', 'tab-youtube', 'tab-player', 'tab-playlists']);
});

test('the YouTube pause button really pauses and resumes the video', async () => {
  await render(<App />);
  await settle();
  await tap(screen.getByTestId('tab-youtube'));
  await tap(screen.getByText('Powerful Worship Songs for Prayer'));
  expect(global.__youtubeProps.play).toBe(true);

  await tap(screen.getByTestId('yt-play-pause'));
  expect(global.__youtubeProps.play).toBe(false);

  await tap(screen.getByTestId('yt-play-pause'));
  expect(global.__youtubeProps.play).toBe(true);
});

androidOnly('YouTube pauses and never takes over when you play one of your own songs', async () => {
  media.__state.audio = phoneSongs(6);
  await render(<App />);
  await settle(25);

  await tap(screen.getByTestId('tab-youtube'));
  await tap(screen.getByText('Powerful Worship Songs for Prayer'));
  await act(async () => {
    global.__youtubeProps.onChangeState('playing');
  });
  expect(global.__youtubeProps.play).toBe(true);

  await tap(screen.getByTestId('tab-library'));
  audio.createAudioPlayer.mockClear();
  await tap(screen.getAllByText('Way Maker 2')[0]);
  expect(audio.createAudioPlayer).toHaveBeenCalledWith(expect.stringContaining('Way%20Maker%202'));
  expect(global.__youtubeProps.play).toBe(false); // the video paused straight away

  // the video pausing or ending must not stop or replace your song
  const songPlayer = audio.__players[audio.__players.length - 1];
  await act(async () => {
    global.__youtubeProps.onChangeState('paused');
  });
  await act(async () => {
    global.__youtubeProps.onChangeState('ended');
  });
  await settle(6);
  expect(songPlayer.pause).not.toHaveBeenCalled();
  expect(audio.createAudioPlayer).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Local Music')).toBeTruthy(); // still on Library, not thrown to YouTube
});

androidOnly('Home shows your own music: recently added, playlists and your songs', async () => {
  media.__state.audio = phoneSongs(30);
  await render(<App />);
  await settle(25);
  expect(screen.getByText('Recently Added')).toBeTruthy();
  expect(screen.getByText('Your Playlists')).toBeTruthy();
  expect(screen.getByText('Create your first playlist')).toBeTruthy();
  expect(screen.getByText('Your Songs')).toBeTruthy();
});

androidOnly('big libraries load in batches so the app stays fast', async () => {
  media.__state.audio = phoneSongs(200);
  await render(<App />);
  await settle(30);
  expect(screen.getByText('See all 200 songs in Library')).toBeTruthy();

  await tap(screen.getByTestId('tab-library'));
  const before = screen.getAllByText(/^Way Maker \d+$/).length;
  expect(before).toBeLessThanOrEqual(62); // 60 songs (+ the song in the mini player)
  await tap(screen.getByTestId('show-more'));
  expect(screen.getAllByText(/^Way Maker \d+$/).length).toBeGreaterThan(before);
});

test('lyrics are looked up automatically for a YouTube song', async () => {
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    status: 200,
    json: async () => (decodeURIComponent(String(url)).includes('Oceans') ? [OCEANS] : []),
    text: async () => ''
  }));
  await render(<App />);
  await settle();
  await tap(screen.getByTestId('tab-youtube'));
  await tap(screen.getByText('Oceans (Where Feet May Fail) - Worship Music'));
  await tap(screen.getByTestId('tab-player'));
  await settle(10);
  await tap(screen.getByTestId('player-view-lyrics'));
  expect(screen.getByText('You call me out upon the waters')).toBeTruthy();
});

androidOnly('repeat: off stops at the end of the list, all starts over, one repeats the song', async () => {
  media.__state.audio = phoneSongs(3);
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('tab-library'));
  await tap(screen.getAllByText('Way Maker 2')[0]); // last song in the list
  let player = audio.__players[audio.__players.length - 1];
  const finish = async (p, secs) => {
    await act(async () => {
      p.emit('playbackStatusUpdate', { isLoaded: true, currentTime: secs, duration: secs, didJustFinish: true });
    });
    await settle(4);
  };

  audio.createAudioPlayer.mockClear();
  await finish(player, 242);
  expect(audio.createAudioPlayer).not.toHaveBeenCalled(); // repeat off: music stops at the end

  await tap(screen.getByTestId('tab-player'));
  await tap(screen.getByTestId('repeat-button')); // repeat all
  await finish(player, 242);
  expect(audio.createAudioPlayer).toHaveBeenLastCalledWith(expect.stringContaining('Way%20Maker%200')); // starts over

  player = audio.__players[audio.__players.length - 1];
  await tap(screen.getByTestId('repeat-button')); // repeat this song
  player.seekTo.mockClear();
  audio.createAudioPlayer.mockClear();
  await finish(player, 240);
  expect(player.seekTo).toHaveBeenCalledWith(0);
  expect(audio.createAudioPlayer).not.toHaveBeenCalled();
});
