/**
 * Whole-app checks. Each test starts Selah like a phone would and taps through it.
 * They run twice: once as iPhone and once as Android (see "jest" in package.json).
 */
import React from 'react';
import { Platform, Alert, StyleSheet, AppState } from 'react-native';
import { render, screen, fireEvent, act, cleanup, within } from '@testing-library/react-native';
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
  require('./mocks/notifications').__reset();
  require('./mocks/secureStore').__store.clear();
  require('./mocks/purchases').__reset();
  require('../src/services/apiClient').resetTokenCacheForTests();
  require('../src/services/artistPictures').resetArtistPicturesForTests();
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

test("Home's Today card: verse of the day, another verse, and a daily reminder", async () => {
  const { devotionForDay, dayNumber } = require('../src/services/dailyService');
  const notifications = require('./mocks/notifications');
  await render(<App />);
  await settle(15);
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));

  const todays = devotionForDay(dayNumber());
  expect(within(screen.getByTestId('today-card')).getByText(todays.reference)).toBeTruthy();
  expect(screen.queryByTestId('song-of-the-day')).toBeNull(); // no songs yet

  await tap(screen.getByTestId('next-verse'));
  expect(within(screen.getByTestId('today-card')).getByText(devotionForDay(dayNumber() + 1).reference)).toBeTruthy();

  await tap(screen.getByTestId('open-reminder'));
  await tap(screen.getByTestId('reminder-on'));
  await tap(screen.getByTestId('reminder-time-21'));
  await tap(screen.getByTestId('reminder-save'));
  await settle(4);
  expect(notifications.__scheduled.length).toBe(14);
  expect(screen.getByText('Reminder 9:00 PM')).toBeTruthy();
  expect(screen.queryByTestId('reminder-modal')).toBeNull();
});

androidOnly('song for today comes from your own music and plays with one tap', async () => {
  media.__state.audio = phoneSongs(5);
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  const card = screen.getByTestId('song-of-the-day');
  expect(within(card).getByText('Sinach')).toBeTruthy();
  audio.createAudioPlayer.mockClear();
  await tap(card);
  expect(audio.createAudioPlayer).toHaveBeenCalledWith(expect.stringContaining('Way%20Maker'));
});

test('Account & Backup: hidden until Selah cloud is set up; sign up, Premium unlocks backup, restore, delete account', async () => {
  const cloud = require('../src/services/cloudService');
  const { resetTokenCacheForTests } = require('../src/services/apiClient');
  const { createFakeServer, BASE } = require('./fakeServer');
  fs.__reset({
    'file:///docs/': { dirs: ['Selah Music'], files: {} },
    'file:///docs/Selah%20Music/': { dirs: [], files: { 'track01.mp3': { bytes: fx.mp3WithTags() } } } // Way Maker, Sinach, 0:26
  });
  await render(<App />);
  await settle(25);
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  expect(screen.queryByTestId('header-account')).toBeNull(); // not set up yet: nothing to see
  await tap(screen.getByTestId('open-menu'));
  expect(screen.queryByTestId('open-account')).toBeNull();
  await cleanup();

  cloud.setApiUrlForTests(BASE);
  resetTokenCacheForTests();
  const server = createFakeServer({ otherFetch: global.fetch });
  global.fetch = server.fetch;
  // Kofi made an account on his old phone, has Premium and a backup there
  server.users.set('kofi@example.com', {
    id: 'user-old',
    name: 'Kofi',
    email: 'kofi@example.com',
    password: 'praise1234',
    premium: { active: true, until: null, source: 'gift' }
  });
  server.backups.set('user-old', {
    savedAt: '2026-11-11T10:00:00.000Z',
    data: {
      songs: { 'old-id': { t: 'Way Maker', a: 'Sinach', d: 26 } },
      playlists: [{ id: 'pl-old', name: 'From my old phone', trackIds: ['old-id'] }],
      favorites: ['old-id'],
      playCounts: { 'old-id': { n: 9, last: 1 } },
      lyrics: {}
    }
  });
  const type = async (testID, text) => {
    await fireEvent.changeText(screen.getByTestId(testID), text);
  };
  try {
    await render(<App />);
    await settle(25);
    // the account button sits at the top, beside the light/dark button (signing in is never required)
    expect(screen.getByTestId('header-account').props.accessibilityLabel).toBe('Log in or create an account');
    await tap(screen.getByTestId('header-account'));

    // sign up: a free account
    await tap(screen.getByTestId('go-signup'));
    await type('account-name', 'Ama');
    await type('account-email', 'ama@example.com');
    await type('account-password', 'short');
    await tap(screen.getByTestId('account-submit'));
    expect(screen.getByTestId('account-error').props.children).toBe('Use at least 8 characters for your password.');
    await type('account-password', 'worship123');
    await tap(screen.getByTestId('account-submit'));
    await settle(6);
    expect(screen.getByTestId('account-signed-in-email').props.children).toBe('ama@example.com');
    expect(screen.getByTestId('header-account').props.accessibilityLabel).toBe('Your account, Ama'); // shows "A"

    // backup is locked without Premium; Premium isn't on sale until the store key is set
    expect(screen.queryByTestId('backup-now')).toBeNull();
    expect(screen.getByText('Backup and restore are part of Selah Premium.')).toBeTruthy();
    await tap(screen.getByTestId('see-plans'));
    expect(screen.getByTestId('plans-note').props.children).toBe("Selah Premium isn't on sale yet. It's coming soon.");
    await tap(screen.getByTestId('premium-back'));

    // log out, then log in as Kofi on this "new phone" and restore his backup
    await tap(screen.getByTestId('account-logout'));
    await settle(4);
    await type('account-email', 'kofi@example.com');
    await type('account-password', 'wrong-pass');
    await tap(screen.getByTestId('account-submit'));
    await settle(4);
    expect(screen.getByTestId('account-error').props.children).toBe('That email or password is not right.');
    await type('account-password', 'praise1234');
    await tap(screen.getByTestId('account-submit'));
    await settle(6);
    expect(screen.getByText('Gifted to you')).toBeTruthy();

    await tap(screen.getByTestId('restore-now'));
    await settle(6);
    expect(Alert.alert).toHaveBeenCalledWith('Restored', expect.stringContaining('1 playlist'));
    await tap(screen.getByTestId('backup-now'));
    await settle(4);
    expect(server.calls.some((c) => c.method === 'PUT' && c.path === '/api/backup')).toBe(true);
    expect(Alert.alert).toHaveBeenCalledWith('Backed up', expect.any(String));

    // delete the account (Google Play requires this to be in the app)
    await tap(screen.getByTestId('go-delete-account'));
    await type('delete-password', 'praise1234');
    await tap(screen.getByTestId('delete-account-confirm'));
    await settle(6);
    expect(Alert.alert).toHaveBeenCalledWith('Account deleted', expect.any(String));
    expect(server.users.has('kofi@example.com')).toBe(false);
    expect(screen.getByTestId('account-submit')).toBeTruthy(); // back to log in

    await tap(screen.getByTestId('account-close'));
    await tap(screen.getByTestId('tab-playlists'));
    await tap(screen.getByText('From my old phone'));
    expect(screen.getByText('1 song • Custom Collection')).toBeTruthy();
    await tap(screen.getByText('All Playlists'));
    await tap(screen.getByTestId('smart-most'));
    expect(screen.getByText('Sinach • 9 plays')).toBeTruthy(); // play counts came back too
  } finally {
    cloud.setApiUrlForTests(null);
  }
});

test('restore on a new phone: songs not on it are listed to get back, and go back into their playlist once they are', async () => {
  const cloud = require('../src/services/cloudService');
  const { resetTokenCacheForTests } = require('../src/services/apiClient');
  const { createFakeServer, BASE } = require('./fakeServer');
  const songsFolder = { 'track01.mp3': { bytes: fx.mp3WithTags() } }; // Way Maker, Sinach, 0:26
  fs.__reset({
    'file:///docs/': { dirs: ['Selah Music'], files: {} },
    'file:///docs/Selah%20Music/': { dirs: [], files: songsFolder }
  });
  cloud.setApiUrlForTests(BASE);
  resetTokenCacheForTests();
  const server = createFakeServer({ otherFetch: global.fetch });
  global.fetch = server.fetch;
  server.users.set('kofi@example.com', {
    id: 'user-old',
    name: 'Kofi',
    email: 'kofi@example.com',
    password: 'praise1234',
    premium: { active: true, until: null, source: 'gift' }
  });
  server.backups.set('user-old', {
    savedAt: '2026-11-11T10:00:00.000Z',
    data: {
      songs: {
        a: { t: 'Way Maker', a: 'Sinach', d: 26 },
        b: { t: 'Imela', a: 'Nathaniel Bassey', d: 0 },
        c: { y: 'dy9nwe9_xzw' } // a YouTube song: only its video ID is kept (YouTube's rules)
      },
      playlists: [{ id: 'pl-old', name: 'Sunday Service', trackIds: ['a', 'b', 'c'] }],
      favorites: ['b'],
      playCounts: {},
      lyrics: {},
      artists: ['Joe Mettle']
    }
  });
  // YouTube still has the video: after the restore its title and channel are fetched fresh
  server.youtubeVideos = {
    dy9nwe9_xzw: { youtubeId: 'dy9nwe9_xzw', title: 'Oceans', channel: 'Hillsong UNITED', duration: 534, picture: 'https://i.ytimg.com/vi/dy9nwe9_xzw/hqdefault.jpg' }
  };
  try {
    await render(<App />);
    await settle(25);
    if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
    await tap(screen.getByTestId('header-account'));
    await fireEvent.changeText(screen.getByTestId('account-email'), 'kofi@example.com');
    await fireEvent.changeText(screen.getByTestId('account-password'), 'praise1234');
    await tap(screen.getByTestId('account-submit'));
    await settle(6);
    await tap(screen.getByTestId('restore-now'));
    await settle(6);
    expect(Alert.alert).toHaveBeenCalledWith('Restored', expect.stringContaining('1 song is not on this phone yet'));

    // Imela is not on this phone; the YouTube song needs no file, so it is simply back
    await tap(screen.getByTestId('open-get-back'));
    const list = within(screen.getByTestId('account-modal'));
    expect(list.getByText('Imela')).toBeTruthy();
    expect(list.getByText('Nathaniel Bassey · in 1 playlist · loved')).toBeTruthy();
    expect(list.queryByText('Oceans')).toBeNull();

    global.fetch.mockClear();
    await tap(screen.getByTestId('find-Imela'));
    expect(youtubeSearches()).toEqual([expect.stringContaining('q=Imela Nathaniel Bassey')]);
    expect(screen.queryByTestId('account-modal')).toBeNull();

    await tap(screen.getByTestId('tab-home'));
    expect(screen.getByTestId('home-artist-Joe Mettle')).toBeTruthy(); // the artists you follow came back
    await tap(screen.getByTestId('tab-playlists'));
    await tap(screen.getByText('Sunday Service'));
    expect(screen.getAllByText('Way Maker').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Oceans').length).toBeGreaterThan(0);
    expect(screen.queryByText('Imela')).toBeNull();

    // later, Imela is on the phone: next time Selah opens it is back in Sunday Service, and loved
    await cleanup();
    songsFolder['Imela.mp3'] = { bytes: fx.mp3WithId3v1() }; // Imela, Nathaniel Bassey
    await render(<App />);
    await settle(25);
    await tap(screen.getByTestId('tab-playlists'));
    await tap(screen.getByText('Sunday Service'));
    expect(screen.getAllByText('Imela').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Oceans').length).toBeGreaterThan(0); // YouTube songs you kept stay after a restart
    expect(JSON.parse(await AsyncStorage.getItem('@selah_get_back'))).toEqual([]);
    expect(JSON.parse(await AsyncStorage.getItem('@selah_favorites'))).toHaveLength(1);
  } finally {
    cloud.setApiUrlForTests(null);
  }
});

test('buying Premium in the app unlocks backup straight away', async () => {
  const cloud = require('../src/services/cloudService');
  const { createFakeServer, BASE } = require('./fakeServer');
  const Purchases = require('./mocks/purchases');
  const Constants = require('expo-constants').default;
  const savedExtra = Constants.expoConfig.extra;
  Constants.expoConfig.extra = { ...(savedExtra || {}), revenueCatAndroidKey: 'goog_test', revenueCatIosKey: 'appl_test' };
  cloud.setApiUrlForTests(BASE);
  const server = createFakeServer({ otherFetch: global.fetch });
  server.users.set('ama@example.com', {
    id: 'user-ama',
    name: 'Ama',
    email: 'ama@example.com',
    password: 'worship123',
    premium: { active: false, until: null, source: null }
  });
  global.fetch = server.fetch;
  // the store tells Selah's server about the purchase
  Purchases.__state.onPurchase = async () =>
    server.giftPremium('ama@example.com', { active: true, until: '2026-12-13T00:00:00.000Z', source: 'store' });
  try {
    await render(<App />);
    await settle(15);
    if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
    await tap(screen.getByTestId('open-menu'));
    await tap(screen.getByTestId('open-account'));
    await fireEvent.changeText(screen.getByTestId('account-email'), 'ama@example.com');
    await fireEvent.changeText(screen.getByTestId('account-password'), 'worship123');
    await tap(screen.getByTestId('account-submit'));
    await settle(6);
    expect(Purchases.configure).toHaveBeenCalledWith({ apiKey: expect.any(String), appUserID: 'user-ama' });

    await tap(screen.getByTestId('see-plans'));
    await settle(2);
    expect(screen.getByText('GH₵15.00 per month')).toBeTruthy();
    expect(screen.getByText('GH₵150.00 per year')).toBeTruthy();
    await tap(screen.getByTestId('plan-$rc_monthly'));
    await settle(4);
    expect(Alert.alert).toHaveBeenCalledWith('Welcome to Selah Premium', expect.any(String));
    expect(screen.getByTestId('backup-now')).toBeTruthy();
    expect(screen.getByText('Manage or cancel your subscription')).toBeTruthy();
  } finally {
    cloud.setApiUrlForTests(null);
    Constants.expoConfig.extra = savedExtra;
  }
});

androidOnly('sharing typed lyrics: the sharing rules are shown and accepted the first time', async () => {
  const cloud = require('../src/services/cloudService');
  const { resetTokenCacheForTests } = require('../src/services/apiClient');
  const { logIn } = require('../src/services/accountService');
  const { createFakeServer, BASE } = require('./fakeServer');
  cloud.setApiUrlForTests(BASE);
  resetTokenCacheForTests();
  const server = createFakeServer({
    otherFetch: async () => ({ ok: true, status: 200, json: async () => [], text: async () => '' }) // no lyrics anywhere
  });
  server.users.set('esi@example.com', { id: 'user-esi', name: 'Esi', email: 'esi@example.com', password: 'praise1234', premium: { active: false, until: null, source: null } });
  global.fetch = server.fetch;
  const pressAlert = async (title, button) => {
    const shown = Alert.alert.mock.calls.filter((c) => c[0] === title).pop();
    await act(async () => {
      await shown[2].find((b) => b.text === button).onPress();
    });
  };
  try {
    media.__state.audio = phoneSongs(2);
    await render(<App />);
    await settle(25);
    await tap(screen.getByTestId('deep-scan-done'));
    await act(async () => {
      await logIn({ email: 'esi@example.com', password: 'praise1234' });
    });
    await tap(screen.getByTestId('tab-library'));
    await tap(screen.getAllByText('Way Maker 1')[0]);
    await tap(screen.getByTestId('tab-player'));
    await settle(10);
    await tap(screen.getByTestId('player-view-lyrics'));
    await tap(screen.getByText('Add lyrics'));
    await fireEvent.changeText(screen.getByPlaceholderText('Paste lyrics here…'), 'Odo yewu, odo yewu\nYour love is so amazing');
    Alert.alert.mockClear();
    await tap(screen.getByText('Save'));
    const first = Alert.alert.mock.calls.find((c) => c[0] === 'Share these lyrics?');
    expect(first[1]).toMatch(/sharing rules/);
    expect(first[2].map((b) => b.text)).toEqual(['Read the rules', 'Not now', 'Agree and share']);
    await pressAlert('Share these lyrics?', 'Agree and share');
    expect(server.posted).toEqual([expect.objectContaining({ title: 'Way Maker 1', agreedToRules: true })]);

    // the next time: just a simple question
    await tap(screen.getByText('Edit'));
    Alert.alert.mockClear();
    await tap(screen.getByText('Save'));
    const next = Alert.alert.mock.calls.find((c) => c[0] === 'Share these lyrics?');
    expect(next[2].map((b) => b.text)).toEqual(['Not now', 'Share']);
  } finally {
    cloud.setApiUrlForTests(null);
  }
});

androidOnly('lyrics typed by other Selah users show when LRCLIB has none; reporting needs an account', async () => {
  const cloud = require('../src/services/cloudService');
  const { resetTokenCacheForTests } = require('../src/services/apiClient');
  const { logIn } = require('../src/services/accountService');
  const { createFakeServer, BASE } = require('./fakeServer');
  cloud.setApiUrlForTests(BASE);
  resetTokenCacheForTests();
  const server = createFakeServer({
    otherFetch: async () => ({ ok: true, status: 200, json: async () => [], text: async () => '' }) // LRCLIB has nothing
  });
  server.sharedLyrics = {
    id: 42,
    title: 'Way Maker 1',
    artist: 'Sinach',
    duration: 241,
    synced: false,
    text: 'Odo yewu, odo yewu\nYour love is so amazing',
    author: 'a1b2c3d4e5f60718'
  };
  server.users.set('esi@example.com', { id: 'user-esi', name: 'Esi', email: 'esi@example.com', password: 'praise1234', premium: { active: false, until: null, source: null } });
  global.fetch = server.fetch;
  const pressAlert = async (title, button) => {
    const shown = Alert.alert.mock.calls.filter((c) => c[0] === title).pop();
    await act(async () => {
      await shown[2].find((b) => b.text === button).onPress();
    });
  };
  // Report › these lyrics / the person
  const reportOnce = async (what = 'These lyrics') => {
    Alert.alert.mockClear();
    await tap(screen.getByText('Report'));
    await pressAlert('Shared lyrics', 'Report');
    await pressAlert('What do you want to report?', what);
  };
  try {
    media.__state.audio = phoneSongs(2);
    await render(<App />);
    await settle(25);
    await tap(screen.getByTestId('deep-scan-done'));
    await tap(screen.getByTestId('tab-library'));
    await tap(screen.getAllByText('Way Maker 1')[0]);
    await tap(screen.getByTestId('tab-player'));
    await settle(10);
    await tap(screen.getByTestId('player-view-lyrics'));
    expect(screen.getByText('SHARED BY SELAH USERS')).toBeTruthy();
    expect(screen.getByText('Your love is so amazing')).toBeTruthy();

    await reportOnce();
    expect(Alert.alert).toHaveBeenCalledWith('Log in to report', expect.stringContaining('account button at the top'));
    expect(server.reports).toHaveLength(0);

    await act(async () => {
      await logIn({ email: 'esi@example.com', password: 'praise1234' });
    });
    await reportOnce();
    await reportOnce('The person');
    expect(server.reports).toEqual([
      { by: 'esi@example.com', id: 42 },
      { by: 'esi@example.com', id: 42, person: true }
    ]);

    // hide everything from this person: their lyrics go away straight away
    Alert.alert.mockClear();
    await tap(screen.getByText('Report'));
    await pressAlert('Shared lyrics', 'Hide this person');
    await settle(10);
    expect(Alert.alert).toHaveBeenCalledWith('Hidden', expect.any(String));
    expect(screen.queryByText('Your love is so amazing')).toBeNull();
  } finally {
    cloud.setApiUrlForTests(null);
  }
});

test('Sound screen is honest: no fake equalizer; Android opens the phone equalizer', async () => {
  const { Linking } = require('react-native');
  const intent = jest.spyOn(Linking, 'sendIntent').mockImplementation(async () => {});
  await render(<App />);
  await settle(15);
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('open-menu'));
  await tap(screen.getByText('Sound & Sleep Timer'));
  expect(screen.queryByText(/5-Band|Bass Boost/)).toBeNull();
  expect(screen.getByText(/exactly as it was recorded/)).toBeTruthy();

  if (isAndroid) {
    await tap(screen.getByTestId('open-phone-equalizer'));
    expect(intent).toHaveBeenCalledWith('android.media.action.DISPLAY_AUDIO_EFFECT_CONTROL_PANEL');
    expect(Alert.alert).not.toHaveBeenCalled();

    intent.mockImplementation(async () => {
      throw new Error('No Activity found');
    });
    await tap(screen.getByTestId('open-phone-equalizer'));
    expect(Alert.alert).toHaveBeenCalledWith('No equalizer found', expect.any(String));
  } else {
    expect(screen.queryByTestId('open-phone-equalizer')).toBeNull();
  }
  intent.mockRestore();
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

androidOnly('share a lyric line as a picture (or as text if the picture fails)', async () => {
  const { captureRef } = require('react-native-view-shot');
  const Sharing = require('expo-sharing');
  const { Share } = require('react-native');
  const shareText = jest.spyOn(Share, 'share').mockImplementation(async () => ({}));
  captureRef.mockClear();
  Sharing.shareAsync.mockClear();

  media.__state.audio = phoneSongs(3);
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-library'));
  await tap(screen.getAllByText('Way Maker 1')[0]);
  await tap(screen.getByTestId('tab-player'));
  await settle(10);
  await tap(screen.getByTestId('player-view-lyrics'));

  // long-press a line: the card shows it with the song's name
  await fireEvent(screen.getByTestId('lyric-line-1'), 'longPress');
  await settle(2);
  const card = () => screen.getByTestId('lyric-card');
  expect(within(card()).getByText('I worship You, I worship You')).toBeTruthy();
  expect(within(card()).getByText('Way Maker 1')).toBeTruthy();

  await tap(screen.getByTestId('lyric-card-more')); // add the next line
  expect(within(card()).getByText('I worship You, I worship You\nYou are here, working in this place')).toBeTruthy();
  await tap(screen.getByTestId('lyric-style-ocean'));

  await tap(screen.getByTestId('lyric-card-share'));
  expect(captureRef).toHaveBeenCalled();
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/lyric-card.png', expect.objectContaining({ mimeType: 'image/png' }));

  // if the picture can't be made, the words are shared instead
  captureRef.mockImplementationOnce(async () => {
    throw new Error('no picture');
  });
  await tap(screen.getByTestId('lyric-card-share'));
  expect(shareText).toHaveBeenCalledWith({
    message: '"I worship You, I worship You\nYou are here, working in this place"\n— Way Maker 1 · Sinach\n\nShared from Selah'
  });

  await tap(screen.getByTestId('lyric-card-close'));
  expect(screen.queryByTestId('lyric-card')).toBeNull();
  shareText.mockRestore();
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

androidOnly('song names with #, % or spaces still play (the address is written safely)', async () => {
  media.__state.audio = [
    { id: '41', filename: 'Track #3.mp3', uri: 'file:///storage/emulated/0/Music/Track #3.mp3', mediaType: 'audio', duration: 200, modificationTime: 1 },
    { id: '42', filename: '100% Praise.mp3', uri: 'file:///storage/emulated/0/Music/100% Praise.mp3', mediaType: 'audio', duration: 210, modificationTime: 2 }
  ];
  await render(<App />);
  await settle(25);
  await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-library'));
  audio.createAudioPlayer.mockClear();
  await tap(screen.getAllByText('Track #3')[0]);
  expect(audio.createAudioPlayer).toHaveBeenLastCalledWith('file:///storage/emulated/0/Music/Track%20%233.mp3');
  await tap(screen.getAllByText('100% Praise')[0]);
  expect(audio.createAudioPlayer).toHaveBeenLastCalledWith('file:///storage/emulated/0/Music/100%25%20Praise.mp3');
});

androidOnly("a song whose file won't open tries again through Android's music library, then explains", async () => {
  media.__state.audio = phoneSongs(3);
  audio.__behaviour.failWhen = (source) => String(source).startsWith('file://');
  try {
    await render(<App />);
    await settle(25);
    await tap(screen.getByTestId('deep-scan-done'));
    await tap(screen.getByTestId('tab-library'));
    audio.createAudioPlayer.mockClear();
    await tap(screen.getAllByText('Way Maker 1')[0]);
    expect(audio.createAudioPlayer).toHaveBeenLastCalledWith(expect.stringMatching(/^file:\/\//));

    await act(async () => {
      jest.advanceTimersByTime(7500);
    });
    await settle(2);
    expect(audio.createAudioPlayer).toHaveBeenLastCalledWith('content://media/external/audio/media/2');
    await act(async () => {
      jest.advanceTimersByTime(7500);
    });
    expect(Alert.alert).not.toHaveBeenCalledWith("Can't play this song", expect.any(String)); // the second way worked

    // when both ways fail, a clear message
    audio.__behaviour.failWhen = () => true;
    await tap(screen.getAllByText('Way Maker 0')[0]);
    await act(async () => {
      jest.advanceTimersByTime(7500);
    });
    await settle(2);
    await act(async () => {
      jest.advanceTimersByTime(7500);
    });
    expect(Alert.alert).toHaveBeenCalledWith("Can't play this song", expect.stringContaining('(.mp3)'));
  } finally {
    audio.__behaviour.failWhen = null;
  }
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

test('a YouTube video saved to a playlist plays from it inside Selah, also after closing the app', async () => {
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-youtube'));
  await tap(screen.getByText('Powerful Worship Songs for Prayer'));
  const videoId = global.__youtubeProps.videoId;
  await tap(screen.getByTestId('yt-add-to-playlist'));
  await tap(screen.getByText('Create New Playlist'));
  await fireEvent.changeText(screen.getByPlaceholderText('New playlist name...'), 'Sunday Worship');
  await tap(screen.getByText('Save'));
  await settle(4);

  // close Selah and open it again: the video is still in the playlist, and plays from it
  await cleanup();
  await render(<App />);
  await settle();
  await tap(screen.getByTestId('tab-playlists'));
  await tap(screen.getByText('Sunday Worship'));
  expect(screen.getAllByText('Powerful Worship Songs for Prayer').length).toBeGreaterThan(0);
  await tap(screen.getByTestId('playlist-play-all'));
  await settle(4);
  expect(global.__youtubeProps.videoId).toBe(videoId); // the official YouTube player, inside Selah
  expect(global.__youtubeProps.play).toBe(true);
});

test("YouTube's size rules: the player is at least 200 high, result pictures at least 120×70", async () => {
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-youtube'));
  expect(global.__youtubeProps.height).toBeGreaterThanOrEqual(200);
  const picture = StyleSheet.flatten(screen.getAllByTestId('yt-result-picture')[0].props.style);
  expect(picture.width).toBeGreaterThanOrEqual(120);
  expect(picture.height).toBeGreaterThanOrEqual(70);
});

test('a YouTube search result can be saved to a playlist without playing it', async () => {
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-youtube'));
  expect(global.__youtubeProps.play).toBe(false);
  await tap(screen.getByTestId('yt-save-gIWCDgNt5ww')); // "Chris Tomlin // Full Live Worship Set", not playing
  await tap(screen.getByText('Create New Playlist'));
  await fireEvent.changeText(screen.getByPlaceholderText('New playlist name...'), 'For later');
  await tap(screen.getByText('Save'));
  await settle(4);
  expect(global.__youtubeProps.play).toBe(false); // nothing started playing

  await cleanup();
  await render(<App />);
  await settle();
  await tap(screen.getByTestId('tab-playlists'));
  await tap(screen.getByText('For later'));
  expect(screen.getAllByText('Chris Tomlin // Full Live Worship Set').length).toBeGreaterThan(0);
});

test('YouTube and Google Play rules: links to the terms and privacy policy are in the app', async () => {
  const { Linking } = require('react-native');
  const { setApiUrlForTests } = require('../src/services/apiClient');
  setApiUrlForTests('https://selah.example');
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-youtube'));
  expect(screen.getByTestId('youtube-terms')).toBeTruthy();
  await tap(screen.getByText('YouTube Terms of Service'));
  expect(open).toHaveBeenLastCalledWith('https://www.youtube.com/t/terms');
  await tap(screen.getByText('Google Privacy Policy'));
  expect(open).toHaveBeenLastCalledWith('https://policies.google.com/privacy');

  await tap(screen.getByTestId('open-menu'));
  await tap(screen.getByTestId('menu-terms'));
  expect(open).toHaveBeenLastCalledWith('https://selah.example/terms');
  await tap(screen.getByTestId('menu-privacy'));
  expect(open).toHaveBeenLastCalledWith('https://selah.example/privacy');
  open.mockRestore();
  setApiUrlForTests(null);
});

test('first start: after choosing artists, the guided tour shows once; the menu shows it again', async () => {
  await AsyncStorage.setItem('@selah_has_onboarded', 'false');
  await render(<App />);
  await settle();
  if (isAndroid && screen.queryByTestId('deep-scan-done')) await tap(screen.getByTestId('deep-scan-done'));
  expect(screen.queryByTestId('guided-tour')).toBeNull(); // not before the artist picker is done
  await tap(screen.getByText(/Start Listening/));
  expect(screen.getByTestId('guided-tour')).toBeTruthy();
  expect(screen.getByTestId('tour-title').props.children).toBe('Home');
  await tap(screen.getByTestId('tour-next'));
  expect(screen.getByTestId('tour-title').props.children).toBe('Libraries');
  await tap(screen.getByTestId('tour-skip'));
  expect(screen.queryByTestId('guided-tour')).toBeNull();
  expect(await AsyncStorage.getItem('@selah_flag_tourDone')).toBe('true');

  // not again on the next start
  await cleanup();
  await render(<App />);
  await settle();
  expect(screen.queryByTestId('guided-tour')).toBeNull();

  // "Show me around" in the menu
  await tap(screen.getByTestId('open-menu'));
  await tap(screen.getByTestId('open-tour'));
  await settle(10);
  expect(screen.getByTestId('guided-tour')).toBeTruthy();
});

test("what's new: shows once after an update, not on a fresh install; always in the menu", async () => {
  const { LATEST_WHATS_NEW } = require('../src/data/whatsNew');
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  expect(screen.queryByTestId('whats-new')).toBeNull(); // first start: nothing
  await cleanup();

  await AsyncStorage.setItem('@selah_whats_new_seen', 'an-older-update'); // an update arrived
  await render(<App />);
  await settle();
  expect(screen.getByTestId('whats-new')).toBeTruthy();
  expect(screen.getByText(LATEST_WHATS_NEW.title)).toBeTruthy();
  await tap(screen.getByTestId('whats-new-close'));
  expect(screen.queryByTestId('whats-new')).toBeNull();
  await cleanup();

  await render(<App />);
  await settle();
  expect(screen.queryByTestId('whats-new')).toBeNull(); // only once
  await tap(screen.getByTestId('open-menu'));
  await tap(screen.getByTestId('open-whats-new'));
  await settle(10);
  expect(screen.getByTestId('whats-new')).toBeTruthy();
});

test('the menu shows which version of Selah this is (the one in app.json)', async () => {
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('open-menu'));
  const text = [].concat(screen.getByTestId('app-version').props.children).join('');
  expect(text).toContain(`Selah ${require('../app.json').expo.version}`);
});

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

test('the bottom player bar pauses and resumes a YouTube video (also told to the player directly)', async () => {
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-youtube'));
  await tap(screen.getByText('Powerful Worship Songs for Prayer'));
  await act(async () => {
    global.__youtubeProps.onReady();
  });
  await settle(2);
  expect(global.__youtubeProps.play).toBe(true);

  await tap(screen.getByTestId('tab-home'));
  global.__youtubeRef.pauseVideo.mockClear();
  global.__youtubeRef.playVideo.mockClear();
  await tap(screen.getByTestId('mini-play-pause'));
  expect(global.__youtubeProps.play).toBe(false);
  expect(global.__youtubeRef.pauseVideo).toHaveBeenCalled(); // straight to the video, not only the setting

  await tap(screen.getByTestId('mini-play-pause'));
  expect(global.__youtubeProps.play).toBe(true);
  expect(global.__youtubeRef.playVideo).toHaveBeenCalled();
});

test('YouTube has no "Play as MP3" mode that hides the video (YouTube and Google Play rules)', async () => {
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-youtube'));
  expect(screen.queryByText('Play as MP3')).toBeNull();
  expect(screen.queryByText(/STREAMING AS MP3/)).toBeNull();
});

// A stand-in for Android's picture-in-picture (the expo-pip module)
function fakePip() {
  const listeners = {};
  return {
    listeners,
    setPictureInPictureParams: jest.fn(),
    enterPipMode: jest.fn(),
    isInPipMode: jest.fn(() => false),
    addListener: jest.fn((name, fn) => {
      listeners[name] = fn;
      return { remove: () => delete listeners[name] };
    })
  };
}

function setAppState(value) {
  Object.defineProperty(AppState, 'currentState', { value, configurable: true, writable: true });
}

androidOnly('picture-in-picture: a playing YouTube video keeps going in a small window that shows only the video', async () => {
  const pipService = require('../src/services/pipService');
  const pip = fakePip();
  pipService.setPipModuleForTests(pip);
  const appStateBefore = Object.getOwnPropertyDescriptor(AppState, 'currentState');
  try {
    await render(<App />);
    await settle();
    await tap(screen.getByTestId('deep-scan-done'));
    // nothing playing: leaving Selah does not open a small window
    expect(pip.setPictureInPictureParams).toHaveBeenLastCalledWith({ autoEnterEnabled: false, actions: [] });

    await tap(screen.getByTestId('tab-youtube'));
    await tap(screen.getByText('Powerful Worship Songs for Prayer'));
    await act(async () => {
      global.__youtubeProps.onReady();
    });
    await settle(2);
    // a video plays: leaving Selah opens the small window by itself, with a pause button in it
    expect(pip.setPictureInPictureParams).toHaveBeenLastCalledWith(
      expect.objectContaining({
        width: 16,
        height: 9,
        autoEnterEnabled: true,
        actions: [expect.objectContaining({ iconName: 'pip_pause', action: 'selah-play-pause', title: 'Pause' })]
      })
    );

    // the small-window button (for phones older than Android 12)
    await tap(screen.getByTestId('yt-small-window'));
    expect(pip.enterPipMode).toHaveBeenCalledWith(expect.objectContaining({ width: 16, height: 9 }));

    // in the small window: only the video, edge to edge, still playing
    await act(async () => {
      pip.listeners.onPipModeChange({ isInPipMode: true });
    });
    await settle(2);
    expect(screen.queryByTestId('tab-home')).toBeNull();
    expect(screen.queryByTestId('mini-play-pause')).toBeNull();
    expect(screen.queryByTestId('yt-search-input')).toBeNull(); // hidden...
    expect(screen.getByTestId('yt-search-input', { includeHiddenElements: true })).toBeTruthy(); // ...but kept
    expect(screen.getByTestId('yt-pip-video')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('youtube-area').props.style)).toMatchObject({ position: 'absolute', top: 0, bottom: 0 });
    expect(global.__youtubeProps.play).toBe(true);

    // the window's own pause / play button
    await act(async () => {
      pip.listeners.onPipActionPressed({ action: 'selah-play-pause' });
    });
    await settle(2);
    expect(global.__youtubeProps.play).toBe(false);
    expect(pip.setPictureInPictureParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ autoEnterEnabled: false, actions: [expect.objectContaining({ iconName: 'pip_play' })] })
    );
    await act(async () => {
      pip.listeners.onPipActionPressed({ action: 'selah-play-pause' });
    });
    await settle(2);
    expect(global.__youtubeProps.play).toBe(true);

    // tapping the window opens Selah again: the video keeps playing and everything is back
    setAppState('active');
    await act(async () => {
      pip.listeners.onPipModeChange({ isInPipMode: false });
    });
    await settle(20);
    expect(global.__youtubeProps.play).toBe(true);
    expect(screen.getByTestId('tab-home')).toBeTruthy();

    // closing the small window (✕): Android tells Selah, and the video pauses straight away
    await act(async () => {
      pip.listeners.onPipModeChange({ isInPipMode: true });
    });
    await settle(2);
    await act(async () => {
      pip.listeners.onPipClosed({ closed: true });
    });
    await settle(2);
    expect(global.__youtubeProps.play).toBe(false);
    expect(screen.getByTestId('tab-home')).toBeTruthy(); // back to the normal layout for next time

    // and if that message were missed: leaving the small window while Selah stays behind other apps also pauses
    await tap(screen.getByTestId('tab-youtube'));
    await tap(screen.getByTestId('yt-play-pause'));
    expect(global.__youtubeProps.play).toBe(true);
    await act(async () => {
      pip.listeners.onPipModeChange({ isInPipMode: true });
    });
    await settle(2);
    setAppState('background');
    await act(async () => {
      pip.listeners.onPipModeChange({ isInPipMode: false });
    });
    await settle(20);
    expect(global.__youtubeProps.play).toBe(false);
  } finally {
    pipService.setPipModuleForTests(null);
    if (appStateBefore) Object.defineProperty(AppState, 'currentState', appStateBefore);
    else delete AppState.currentState;
  }
});

test('no small-window button where picture-in-picture does not exist (iPhone, Expo Go)', async () => {
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-youtube'));
  await tap(screen.getByText('Powerful Worship Songs for Prayer'));
  expect(global.__youtubeProps.play).toBe(true);
  expect(screen.queryByTestId('yt-small-window')).toBeNull();
});

test("YouTube's rule: on another tab a playing video shows in Selah's floating window, never hidden", async () => {
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('tab-youtube'));
  await tap(screen.getByText('Powerful Worship Songs for Prayer'));
  expect(screen.queryByTestId('yt-float-video')).toBeNull(); // on the YouTube tab: the normal screen

  // another tab: the video keeps playing, in the floating window, at least 200×200
  await tap(screen.getByTestId('tab-home'));
  expect(global.__youtubeProps.play).toBe(true);
  expect(screen.getByTestId('yt-float-video')).toBeTruthy();
  expect(global.__youtubeProps.height).toBeGreaterThanOrEqual(200);
  expect(global.__youtubeProps.width).toBeGreaterThanOrEqual(200);

  // the expand button goes back to the YouTube tab
  await tap(screen.getByTestId('float-open'));
  expect(screen.queryByTestId('yt-float-video')).toBeNull();
  expect(screen.getByTestId('yt-search-input')).toBeTruthy();

  // × stops the video: nothing plays hidden
  await tap(screen.getByTestId('tab-home'));
  await tap(screen.getByTestId('float-close'));
  expect(global.__youtubeProps.play).toBe(false);
  expect(screen.queryByTestId('yt-float-video')).toBeNull();
});

// YouTube searches go to YouTube's official search through Selah's server (never youtube.com pages)
function youtubeSearches() {
  const urls = global.fetch.mock.calls.map(([url]) => decodeURIComponent(String(url)));
  expect(urls.filter((url) => url.includes('youtube.com/results'))).toEqual([]);
  return urls.filter((url) => url.includes('/api/youtube/search'));
}

function useSelahServer() {
  const { setApiUrlForTests } = require('../src/services/apiClient');
  setApiUrlForTests('https://selah.example');
  return () => setApiUrlForTests(null);
}

test('Libraries: genres and gospel artists; a genre shows its latest songs on YouTube', async () => {
  const done = useSelahServer();
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('open-libraries'));
  expect(screen.getByText('Genres')).toBeTruthy();
  expect(screen.getByText('Gospel artists')).toBeTruthy();
  expect(screen.getByText('Ghana Gospel')).toBeTruthy();
  expect(screen.getByTestId('genre-photo-ghana')).toBeTruthy(); // a real photo, not a coloured box
  expect(screen.queryByText(/YouVersion|Open Hymnal|Bible/)).toBeNull();

  global.fetch.mockClear();
  await tap(screen.getByTestId('genre-ghana'));
  const year = new Date().getFullYear();
  expect(youtubeSearches()).toEqual([expect.stringContaining(`q=latest Ghana gospel songs ${year}`)]);
  expect(screen.queryByText('Gospel artists')).toBeNull(); // Libraries closed, YouTube is showing
  expect(screen.getByTestId('yt-search-input').props.value).toBe(`latest Ghana gospel songs ${year}`);
  done();
});

test('following an artist: shows on Home, is remembered, and opens their latest songs', async () => {
  const done = useSelahServer();
  await render(<App />);
  await settle();
  if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
  await tap(screen.getByTestId('home-follow-more')); // Home invites you to find artists
  await tap(screen.getByTestId('follow-Joe Mettle'));
  expect(screen.getByLabelText('Unfollow Joe Mettle')).toBeTruthy();
  expect(screen.getAllByText('Artists you follow')).toHaveLength(2); // in Libraries and on Home
  expect(JSON.parse(await AsyncStorage.getItem('@selah_fav_artists'))).toEqual(['Joe Mettle']);
  await tap(screen.getByTestId('libraries-close'));

  global.fetch.mockClear();
  await tap(screen.getByTestId('home-artist-Joe Mettle'));
  const year = new Date().getFullYear();
  expect(youtubeSearches()).toEqual([expect.stringContaining(`q=latest Joe Mettle songs ${year}`)]);

  // still followed after closing and opening Selah again
  await cleanup();
  await render(<App />);
  await settle();
  expect(screen.getByTestId('home-artist-Joe Mettle')).toBeTruthy();

  // unfollow
  await tap(screen.getByTestId('open-libraries'));
  await tap(screen.getByTestId('follow-Joe Mettle'));
  expect(screen.getByLabelText('Follow Joe Mettle')).toBeTruthy();
  expect(JSON.parse(await AsyncStorage.getItem('@selah_fav_artists'))).toEqual([]);
  done();
});

test("artists show their own YouTube channel pictures, in Libraries and on Home, and say they come from YouTube", async () => {
  const { createFakeServer, BASE } = require('./fakeServer');
  const { setApiUrlForTests } = require('../src/services/apiClient');
  setApiUrlForTests(BASE);
  const server = createFakeServer({ otherFetch: global.fetch });
  global.fetch = server.fetch;
  server.youtubeChannels = {
    UCcaV40yrjS5R88xYHxK_0rA: 'https://yt3.ggpht.com/sinach',
    '@JoeMettleMinistries': 'https://yt3.ggpht.com/joe'
  };
  const pictureOf = (name) => {
    const found = screen.queryAllByTestId('cover-artist').find((p) => p.props.accessibilityLabel === name);
    return found ? found.props.source.uri : null;
  };
  try {
    await render(<App />);
    await settle();
    if (isAndroid) await tap(screen.getByTestId('deep-scan-done'));
    await tap(screen.getByTestId('open-libraries'));
    await settle();
    expect(pictureOf('Sinach')).toBe('https://yt3.ggpht.com/sinach');
    expect(pictureOf('Joe Mettle')).toBe('https://yt3.ggpht.com/joe');
    expect(pictureOf('Diana Hamilton')).toBeNull(); // no picture yet: her initials, as before
    expect(screen.getByTestId('artist-pictures-credit')).toBeTruthy();
    expect(screen.getByText("Pictures from the artists' YouTube channels")).toBeTruthy();

    // follow Joe Mettle: Home shows his picture too, and says where it comes from
    await tap(screen.getByTestId('follow-Joe Mettle'));
    await tap(screen.getByTestId('libraries-close'));
    await settle();
    expect(pictureOf('Joe Mettle')).toBe('https://yt3.ggpht.com/joe');
    expect(screen.getByText('Tap one for their latest songs · pictures from YouTube')).toBeTruthy();
  } finally {
    setApiUrlForTests(null);
  }
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
