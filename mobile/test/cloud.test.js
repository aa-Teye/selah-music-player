import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildBackup,
  matchSongs,
  fetchRestore,
  backupNow,
  deleteBackup,
  findSharedLyrics,
  shareLyrics,
  setApiUrlForTests,
  isCloudReady,
  autoBackupIfDue,
  setAutoBackup
} from '../src/services/cloudService';
import { resetTokenCacheForTests, getToken } from '../src/services/apiClient';
import { logIn, signUp } from '../src/services/accountService';
import { songKey } from '../src/services/songKey';

const { createFakeServer, BASE } = require('./fakeServer');
const secureStore = require('./mocks/secureStore');

const song = (id, title, artist, duration = 240) => ({ id, title, artist, duration, sourceType: 'local', uri: `file:///${id}.mp3` });
let server;

beforeEach(async () => {
  await AsyncStorage.clear();
  secureStore.__store.clear();
  resetTokenCacheForTests();
  setApiUrlForTests(BASE);
  server = createFakeServer();
  global.fetch = server.fetch;
});

afterAll(() => setApiUrlForTests(null));

test('song names match the same way as on the server', () => {
  expect(songKey('Way Maker (Live) [Official Video]', 'Sinach ft. Joe Mettle')).toBe('way maker|sinach');
  expect(songKey('Ọlọ́run Àgbáyé', 'Tope Àlàbí')).toBe('olorun agbaye|tope alabi');
  expect(songKey('  WAY   MAKER! ', 'SINACH')).toBe('way maker|sinach');
});

test('a backup has playlists, loved songs, counts and your lyrics, with song names (never the songs)', async () => {
  await AsyncStorage.setItem('@selah_lyrics_s2', 'My own words for this song');
  await AsyncStorage.setItem('@selah_lyrics_cache_s2', '{"candidates":[]}'); // not your lyrics
  await AsyncStorage.setItem('@selah_lyrics_offset_s2', '1.5');
  const data = await buildBackup({
    tracks: [song('s1', 'Way Maker', 'Sinach', 300), song('s2', 'Odo Yewu', 'Joe Mettle'), song('s3', 'Excess Love', 'Mercy Chinwo')],
    playlists: [{ id: 'pl-1', name: 'Sunday', trackIds: ['s1', 'gone'] }],
    favorites: ['s3'],
    playCounts: { s1: { n: 4, last: 1 }, gone: { n: 1, last: 1 } }
  });
  expect(data.songs).toEqual({
    s1: { t: 'Way Maker', a: 'Sinach', d: 300 },
    s2: { t: 'Odo Yewu', a: 'Joe Mettle', d: 240 },
    s3: { t: 'Excess Love', a: 'Mercy Chinwo', d: 240 }
  });
  expect(data.playlists).toEqual([{ id: 'pl-1', name: 'Sunday', trackIds: ['s1'] }]);
  expect(data.favorites).toEqual(['s3']);
  expect(data.playCounts).toEqual({ s1: { n: 4, last: 1 } });
  expect(data.lyrics).toEqual({ s2: 'My own words for this song' });
  expect(JSON.stringify(data)).not.toContain('file:///'); // no file paths
});

test('restore finds the songs on a new phone by name, artist and length', () => {
  const backupSongs = {
    old1: { t: 'Way Maker', a: 'Sinach', d: 300 },
    old2: { t: 'Odo Yewu', a: 'Joe Mettle', d: 280 },
    old3: { t: 'Not On This Phone', a: 'Someone', d: 200 }
  };
  const here = [song('new-a', 'Way Maker (Live)', 'SINACH', 420), song('new-b', 'Way Maker', 'Sinach', 301), song('new-c', 'Odo Yewu', 'Joe Mettle ft. Choir', 279)];
  expect(matchSongs(backupSongs, here)).toEqual({ old1: 'new-b', old2: 'new-c' });
  expect(matchSongs({ same: { t: 'x', a: 'y' } }, [song('same', 'Other', 'Name')])).toEqual({ same: 'same' });
});

test('backup needs an account, and Premium', async () => {
  const state = { tracks: [song('s1', 'Way Maker', 'Sinach', 300)], playlists: [{ id: 'pl-1', name: 'Sunday', trackIds: ['s1'] }], favorites: [], playCounts: {} };
  await expect(backupNow(state)).rejects.toMatchObject({ kind: 'logged-out' });

  await signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' });
  await expect(backupNow(state)).rejects.toMatchObject({ kind: 'premium', status: 402 });

  server.giftPremium('ama@example.com');
  const result = await backupNow(state);
  expect(result).toMatchObject({ playlists: 1, songs: 1, savedAt: '2026-11-13T10:00:00.000Z' });
  const put = server.calls.find((c) => c.method === 'PUT');
  expect(put.body.data.playlists[0].name).toBe('Sunday');

  // a new phone: log in, restore, songs are matched by name
  secureStore.__store.clear();
  resetTokenCacheForTests();
  await logIn({ email: 'ama@example.com', password: 'worship123' });
  const restored = await fetchRestore([song('phone-9', 'Way Maker', 'Sinach', 299)]);
  expect(restored).toMatchObject({ playlists: [{ id: 'pl-1', name: 'Sunday', trackIds: ['phone-9'] }], found: 1, total: 1 });

  expect(await deleteBackup()).toBe(true);
  await expect(fetchRestore([])).rejects.toMatchObject({ kind: 'not-found', message: 'There is no backup in your account yet.' });
});

test('if the server ends the login, the phone forgets the token', async () => {
  await signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' });
  expect(await getToken()).toBeTruthy();
  server.tokens.clear(); // e.g. password changed on another phone
  await expect(backupNow({ tracks: [] })).rejects.toMatchObject({ kind: 'logged-out' });
  expect(await getToken()).toBeNull();
});

test('clear messages: no internet, not set up', async () => {
  await signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' });
  global.fetch = jest.fn(async () => {
    throw new Error('Network request failed');
  });
  await expect(backupNow({ tracks: [] })).rejects.toMatchObject({ kind: 'offline' });
  setApiUrlForTests('');
  expect(isCloudReady()).toBe(false);
  await expect(backupNow({ tracks: [] })).rejects.toMatchObject({ kind: 'not-configured' });
  expect(await findSharedLyrics({ title: 'Way Maker', artist: 'Sinach' })).toBeNull();
});

test('shared lyrics: reading needs no account, sharing does', async () => {
  server.sharedLyrics = { id: 7, text: 'words', synced: false };
  expect(await findSharedLyrics({ title: 'Odo Yewu', artist: 'Joe Mettle', duration: 280.4 })).toMatchObject({ id: 7 });
  server.sharedLyrics = null;
  expect(await findSharedLyrics({ title: 'Odo Yewu', artist: 'Joe Mettle' })).toBeNull();

  const lyric = { title: 'Odo Yewu', artist: 'Joe Mettle', duration: 280, text: 'Odo yewu, odo yewu', synced: false };
  await expect(shareLyrics(lyric)).rejects.toMatchObject({ kind: 'logged-out' });
  await signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' });
  await shareLyrics(lyric);
  expect(server.posted).toEqual([expect.objectContaining({ by: 'ama@example.com', title: 'Odo Yewu' })]);
});

test('automatic backup: only when logged in and turned on, at most once a day', async () => {
  const state = { tracks: [], playlists: [], favorites: [], playCounts: {} };
  expect(await autoBackupIfDue(state)).toBe(false); // logged out
  await signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' });
  server.giftPremium('ama@example.com');
  expect(await autoBackupIfDue(state)).toBe(false); // off by default
  await setAutoBackup(true);
  expect(await autoBackupIfDue(state)).toBe(true);
  expect(await autoBackupIfDue(state)).toBe(false); // already done today
  expect(server.calls.filter((c) => c.method === 'PUT')).toHaveLength(1);
});
