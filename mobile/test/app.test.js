/**
 * Whole-app checks. Each test starts Selah like a phone would and taps through it.
 * They run twice: once as iPhone and once as Android (see "jest" in package.json).
 */
import React from 'react';
import { Platform, Alert, StyleSheet, AppState } from 'react-native';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

const fx = require('./fixtures');

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
  global.__youtubeRef = null;
  global.__youtubeTime = 0;
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
  await tap(screen.getByText('Scan My Phone for Music'));
  await settle(10);
  expect(screen.getAllByText('Music access is off').length).toBeGreaterThan(0);
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

test("songs show their own cover from inside the file, after a restart too, and it comes back if the phone clears it", async () => {
  const COVERS = 'file:///cache/selah-covers/';
  const FRONT = fx.jpeg(7);
  fs.__reset({
    'file:///docs/': { dirs: ['Selah Music'], files: {} },
    'file:///docs/Selah%20Music/': { dirs: [], files: { 'track 01.mp3': { bytes: fx.mp3WithCovers(FRONT, fx.jpeg(8)) } } }
  });
  const shown = () => JSON.stringify(screen.toJSON());

  await render(<App />);
  await settle(30);
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));

  const names = Object.keys(fs.__FS[COVERS].files);
  expect(names).toHaveLength(1); // only the front cover is kept
  expect(Array.from(fs.__FS[COVERS].files[names[0]].bytes)).toEqual(FRONT);
  const coverUri = COVERS + names[0];
  expect(shown()).toContain(coverUri); // Home shows the song with its own picture

  await tap(screen.getByTestId('tab-library'));
  expect(screen.getAllByText('Jehovah Overdo').length).toBeGreaterThan(0);
  expect(screen.getAllByTestId('song-cover').length).toBeGreaterThan(0);

  // the saved library only keeps the picture's name (the full address can change on iPhone)
  const saved = JSON.parse(fs.__FS['file:///docs/.selah/'].files['library.json'].content);
  expect(saved[0]).toMatchObject({ title: 'Jehovah Overdo', coverFile: names[0] });
  expect(saved[0].coverUrl).toBeUndefined();
  await cleanup();

  await render(<App />); // restart
  await settle(25);
  expect(shown()).toContain(coverUri);
  await cleanup();

  delete fs.__FS[COVERS]; // the phone cleared its cache
  await render(<App />);
  await settle(30);
  expect(Object.keys(fs.__FS[COVERS].files)).toEqual(names); // read again from the song
  expect(shown()).toContain(coverUri);
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

test('bottom tabs are in the order: Home, Player, YouTube, Library, Playlists', async () => {
  await render(<App />);
  await settle();
  const ids = screen.getAllByTestId(/^tab-/).map((el) => el.props.testID);
  expect(ids).toEqual(['tab-home', 'tab-player', 'tab-youtube', 'tab-library', 'tab-playlists']);
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
  expect(screen.getByText(/offline songs? on device/)).toBeTruthy(); // still on My Songs, not thrown to YouTube
});

androidOnly('smart playlists: a song counts as played after 30 seconds and shows in Most played', async () => {
  media.__state.audio = phoneSongs(4);
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-library'));
  await tap(screen.getAllByText('Way Maker 2')[0]);
  await act(async () => {
    jest.advanceTimersByTime(10000); // 10 seconds: not a "play" yet
  });

  await tap(screen.getByTestId('tab-playlists'));
  await tap(screen.getByTestId('smart-most'));
  expect(screen.getByText('Nothing here yet')).toBeTruthy();
  await tap(screen.getByText('All Playlists'));

  await act(async () => {
    jest.advanceTimersByTime(25000); // 35 seconds in total
  });
  await settle(4);
  await tap(screen.getByTestId('smart-most'));
  expect(screen.getByText('1 song • Updates by itself')).toBeTruthy();
  expect(screen.getByText('Sinach • 1 play')).toBeTruthy();
  await tap(screen.getByText('All Playlists'));

  await tap(screen.getByTestId('smart-never'));
  expect(screen.getByText('3 songs • Updates by itself')).toBeTruthy();
  expect(screen.queryByText('Add Songs')).toBeNull(); // smart lists fill themselves
  audio.createAudioPlayer.mockClear();
  await tap(screen.getByTestId('playlist-play-all'));
  expect(audio.createAudioPlayer).toHaveBeenCalled();

  // the count is remembered
  expect(JSON.parse(await AsyncStorage.getItem('@selah_play_counts'))['local-scan-3']).toMatchObject({ n: 1 });
});

androidOnly('opening your own playlist that has songs works (it used to crash)', async () => {
  media.__state.audio = phoneSongs(3);
  await AsyncStorage.setItem(
    '@selah_playlists',
    JSON.stringify([{ id: 'pl-sunday', name: 'Sunday Service', trackIds: ['local-scan-1', 'local-scan-2'] }])
  );
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-playlists'));
  await tap(screen.getByText('Sunday Service'));
  expect(screen.getByText('2 songs • Custom Collection')).toBeTruthy();
  expect(screen.getAllByText('Way Maker 0').length).toBeGreaterThan(0);
  expect(JSON.stringify(screen.toJSON())).not.toContain('"w>"');
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
  expect(screen.getByText('See all 200 in My Songs')).toBeTruthy();

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

test('dark mode: one tap on the header button, every screen still opens, and it switches back', async () => {
  media.__state.audio = phoneSongs(5);
  await render(<App />);
  await settle(20);
  const background = () => StyleSheet.flatten(screen.getByTestId('app-root').props.style).backgroundColor;
  expect(background()).toBe('#F8F9FA');

  await tap(screen.getByTestId('theme-toggle'));
  expect(background()).toBe('#0B0D12');

  for (const tab of ['library', 'youtube', 'playlists', 'home', 'player']) {
    await tap(screen.getByTestId(`tab-${tab}`));
  }
  for (const view of ['lyrics', 'queue', 'library', 'now']) {
    await tap(screen.getByTestId(`player-view-${view}`));
  }
  await tap(screen.getByTestId('tab-home'));
  await tap(screen.getByTestId('theme-toggle'));
  expect(background()).toBe('#F8F9FA');
});

androidOnly('detailed scan: every folder (hidden, WhatsApp media, SD card), real song names, private app data skipped', async () => {
  fs.__reset({
    'file:///docs/': { dirs: [], files: {} },
    'file:///storage/': { dirs: ['emulated', 'self', '1234-5678'], files: {} },
    'file:///storage/emulated/0/': { dirs: ['Music', 'Download', 'Android'], files: {} },
    'file:///storage/emulated/0/Music/': {
      dirs: [],
      files: { 'Sinach - Way Maker 0.mp3': { size: 10 }, 'Sinach - Way Maker 1.m4a': { size: 10 }, 'Sinach - Way Maker 2.flac': { size: 10 } }
    },
    'file:///storage/emulated/0/Download/': { dirs: ['.hidden songs'], files: { 'notes.pdf': { size: 5 } } },
    'file:///storage/emulated/0/Download/.hidden%20songs/': {
      dirs: [],
      files: { 'track01.mp3': { bytes: fx.mp3WithTags() }, 'voice.opus': { bytes: fx.opus180s() } }
    },
    'file:///storage/emulated/0/Android/': { dirs: ['data', 'media'], files: {} },
    'file:///storage/emulated/0/Android/data/': { dirs: [], files: { 'secret.mp3': { size: 10 } } },
    'file:///storage/emulated/0/Android/media/': { dirs: [], files: { 'Shared Audio.aac': { size: 10 } } },
    'file:///storage/1234-5678/': { dirs: ['Gospel'], files: {} },
    'file:///storage/1234-5678/Gospel/': { dirs: [], files: { 'Excess Love.flac': { bytes: fx.flacWithTags() } } }
  });
  media.__state.audio = phoneSongs(3); // the 3 songs in Music/ are also in the phone's own list

  await render(<App />); // first launch on Android runs the detailed scan with the scan screen
  await settle(40);
  expect(screen.getByText('Scan complete')).toBeTruthy();
  expect(screen.getByText(/7 songs in your library/)).toBeTruthy();
  await tap(screen.getByTestId('deep-scan-done'));
  expect(screen.queryByText('Scan complete')).toBeNull();
  expect(screen.getByText('7 available')).toBeTruthy();

  await tap(screen.getByTestId('tab-library'));
  expect(screen.getByText('Way Maker')).toBeTruthy(); // real title read from inside track01.mp3
  expect(screen.getByText('Sinach • 0:26')).toBeTruthy(); // real artist and length from the file
  expect(screen.getByText('Excess Love')).toBeTruthy(); // on the SD card
  expect(screen.getByText('Mercy Chinwo • 3:20')).toBeTruthy();
  expect(screen.queryByText('secret')).toBeNull(); // other apps' private data is not touched
});

androidOnly('My Songs search box finds songs', async () => {
  media.__state.audio = phoneSongs(12);
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-library'));
  await fireEvent.changeText(screen.getByPlaceholderText('Search my songs...'), 'Maker 1');
  await settle(4);
  expect(screen.getByText('Way Maker 1')).toBeTruthy();
  expect(screen.getByText('Way Maker 10')).toBeTruthy();
  expect(screen.getByText('Way Maker 11')).toBeTruthy();
  expect(screen.queryByText('Way Maker 2')).toBeNull();
});

androidOnly('song lengths are real (never a made-up 3:30)', async () => {
  media.__state.audio = phoneSongs(3); // 4:00, 4:01, 4:02
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-player'));
  await tap(screen.getByTestId('player-view-library'));
  expect(screen.getAllByText(/Sinach • 4:0[0-2]/).length).toBeGreaterThanOrEqual(3);
  expect(screen.queryByText(/3:30/)).toBeNull();
});

androidOnly('reopening the app continues the same song from the same spot', async () => {
  media.__state.audio = phoneSongs(3);
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-library'));
  await tap(screen.getAllByText('Way Maker 1')[0]);
  const first = audio.__players[audio.__players.length - 1];
  await act(async () => {
    first.emit('playbackStatusUpdate', { isLoaded: true, currentTime: 95, duration: 241, didJustFinish: false });
  });
  await act(async () => {
    jest.advanceTimersByTime(6000); // saved automatically every 5 seconds
  });
  await settle(4);
  await cleanup(); // the app is closed

  audio.createAudioPlayer.mockClear();
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('tab-player'));
  expect(screen.getAllByText('Way Maker 1').length).toBeGreaterThan(0);
  expect(screen.getByText('1:35')).toBeTruthy(); // exactly where you stopped
  await tap(screen.getByTestId('play-pause'));
  expect(audio.createAudioPlayer).toHaveBeenCalledWith(expect.stringContaining('Way%20Maker%201'));
  expect(audio.__players[audio.__players.length - 1].seekTo).toHaveBeenCalledWith(95);
});

androidOnly('leaving the app saves the exact spot straight away', async () => {
  const handlers = [];
  const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((type, fn) => {
    handlers.push(fn);
    return { remove: jest.fn() };
  });
  media.__state.audio = phoneSongs(2);
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-library'));
  await tap(screen.getAllByText('Way Maker 1')[0]);
  const p = audio.__players[audio.__players.length - 1];
  await act(async () => {
    p.emit('playbackStatusUpdate', { isLoaded: true, currentTime: 42, duration: 241, didJustFinish: false });
  });
  await act(async () => {
    handlers.forEach((fn) => fn('background'));
  });
  await settle(2);
  const saved = JSON.parse(await AsyncStorage.getItem('@selah_last_played'));
  expect(saved).toMatchObject({ trackId: 'local-scan-2', position: 42 });
  spy.mockRestore();
});

androidOnly('a long sermon continues where you left it after listening to something else', async () => {
  media.__state.audio = [
    {
      id: '900',
      filename: 'Pastor Kumuyi - Sunday Sermon.mp3',
      uri: 'file:///storage/emulated/0/Sermons/Pastor%20Kumuyi%20-%20Sunday%20Sermon.mp3',
      mediaType: 'audio',
      duration: 3600,
      modificationTime: 1700000000500
    },
    ...phoneSongs(2)
  ];
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-library'));
  await tap(screen.getAllByText('Sunday Sermon')[0]);
  const sermon = audio.__players[audio.__players.length - 1];
  await act(async () => {
    sermon.emit('playbackStatusUpdate', { isLoaded: true, currentTime: 1250, duration: 3600, didJustFinish: false });
  });
  await tap(screen.getAllByText('Way Maker 0')[0]); // listen to something else
  await tap(screen.getAllByText('Sunday Sermon')[0]); // back to the sermon
  expect(audio.__players[audio.__players.length - 1].seekTo).toHaveBeenCalledWith(1250);
});

androidOnly('Home: "Continue listening" shows a sermon you stopped, with the time left, and continues it', async () => {
  media.__state.audio = [
    {
      id: '900',
      filename: 'Pastor Kumuyi - Sunday Sermon.mp3',
      uri: 'file:///storage/emulated/0/Sermons/Pastor%20Kumuyi%20-%20Sunday%20Sermon.mp3',
      mediaType: 'audio',
      duration: 3600,
      modificationTime: 1700000000500
    },
    ...phoneSongs(1)
  ];
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  expect(screen.queryByText('Continue listening')).toBeNull(); // nothing half-finished yet

  await tap(screen.getByTestId('tab-library'));
  await tap(screen.getAllByText('Sunday Sermon')[0]);
  await act(async () => {
    audio.__players[audio.__players.length - 1].emit('playbackStatusUpdate', {
      isLoaded: true,
      currentTime: 1250,
      duration: 3600,
      didJustFinish: false
    });
  });
  await tap(screen.getAllByText('Way Maker 0')[0]); // listen to something else

  await tap(screen.getByTestId('tab-home'));
  expect(screen.getByText('Continue listening')).toBeTruthy();
  expect(screen.getByText('39 min left')).toBeTruthy();
  await tap(screen.getByTestId('continue-local-scan-900'));
  expect(audio.__players[audio.__players.length - 1].seekTo).toHaveBeenCalledWith(1250);
  await cleanup();

  await render(<App />); // still there after reopening the app
  await settle(25);
  expect(screen.getByText('Continue listening')).toBeTruthy();
  expect(screen.getByTestId('continue-local-scan-900')).toBeTruthy();
});

test('time left reads naturally', () => {
  const { timeLeft } = require('../src/screens/HomeScreen');
  expect(timeLeft(0, 600)).toBe('10 min left');
  expect(timeLeft(10, 3910)).toBe('1 h 5 min left');
  expect(timeLeft(0, 7200)).toBe('2 h left');
  expect(timeLeft(599, 600)).toBe('1 min left');
});

test('a YouTube video continues where you stopped after reopening the app', async () => {
  await render(<App />);
  await settle(15);
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-youtube'));
  await tap(screen.getByText('Powerful Worship Songs for Prayer'));
  global.__youtubeTime = 130;
  await act(async () => {
    global.__youtubeProps.onReady();
  });
  await act(async () => {
    jest.advanceTimersByTime(1500); // the YouTube screen reads the video's time
  });
  await settle(4);
  await act(async () => {
    jest.advanceTimersByTime(6000); // saved automatically
  });
  await settle(4);
  await cleanup();

  global.__youtubeRef = null;
  await render(<App />);
  await settle(15);
  await tap(screen.getByTestId('tab-youtube'));
  await act(async () => {
    global.__youtubeProps.onReady();
  });
  await tap(screen.getByTestId('yt-play-pause'));
  await settle(4);
  expect(global.__youtubeRef.seekTo).toHaveBeenCalledWith(130, true);
});
