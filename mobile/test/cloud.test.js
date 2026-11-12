import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  makeCode,
  normalizeCode,
  CODE_PATTERN,
  buildBackup,
  matchSongs,
  fetchRestore,
  backupNow,
  getBackupCode,
  findSharedLyrics,
  setApiUrlForTests,
  isCloudReady,
  autoBackupIfDue,
  setAutoBackup
} from '../src/services/cloudService';
import { songKey } from '../src/services/songKey';

const song = (id, title, artist, duration = 240) => ({ id, title, artist, duration, sourceType: 'local', uri: `file:///${id}.mp3` });

function answer(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  setApiUrlForTests('https://selah-api.test/');
  global.fetch = jest.fn(async () => answer(200, {}));
});

afterAll(() => setApiUrlForTests(null));

test('backup codes: random, easy to read, typed any way', () => {
  const code = makeCode();
  expect(code).toMatch(CODE_PATTERN);
  expect(makeCode()).not.toBe(code);
  expect(makeCode(new Uint8Array(20).fill(0))).toBe('AAAA-AAAA-AAAA-AAAA-AAAA');
  expect(normalizeCode(' abcd efgh-jklm npqr stuv ')).toBe('ABCD-EFGH-JKLM-NPQR-STUV');
  expect(normalizeCode('ABCD-EFGH')).toBeNull();
  expect(normalizeCode('ABCD-EFGH-JKLM-NPQR-STU1')).toBeNull(); // 1 and 0 are never used
});

test('the phone keeps its code', async () => {
  const first = await getBackupCode();
  expect(await getBackupCode()).toBe(first);
});

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
  const here = [
    song('new-a', 'Way Maker (Live)', 'SINACH', 420), // a different version
    song('new-b', 'Way Maker', 'Sinach', 301), // the same recording
    song('new-c', 'Odo Yewu', 'Joe Mettle ft. Choir', 279)
  ];
  expect(matchSongs(backupSongs, here)).toEqual({ old1: 'new-b', old2: 'new-c' });
  expect(matchSongs({ same: { t: 'x', a: 'y' } }, [song('same', 'Other', 'Name')])).toEqual({ same: 'same' });
});

test('back up now sends the backup with the code; restore fits it to this phone', async () => {
  const tracks = [song('s1', 'Way Maker', 'Sinach', 300)];
  global.fetch = jest.fn(async () => answer(200, { savedAt: '2026-11-12T10:00:00.000Z', size: 120 }));
  const result = await backupNow({ tracks, playlists: [{ id: 'pl-1', name: 'Sunday', trackIds: ['s1'] }], favorites: [], playCounts: {} });
  expect(result).toMatchObject({ playlists: 1, songs: 1 });
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe('https://selah-api.test/api/backup');
  expect(options.method).toBe('PUT');
  expect(options.headers.Authorization).toBe(`Bearer ${await getBackupCode()}`);
  expect(JSON.parse(options.body).data.playlists[0].name).toBe('Sunday');

  global.fetch = jest.fn(async () =>
    answer(200, {
      savedAt: '2026-11-12T10:00:00.000Z',
      data: {
        songs: { s1: { t: 'Way Maker', a: 'Sinach', d: 300 }, x: { t: 'Missing', a: 'Nobody', d: 100 } },
        playlists: [{ id: 'pl-1', name: 'Sunday', trackIds: ['s1', 'x'] }],
        favorites: ['s1', 'x'],
        playCounts: { s1: { n: 3, last: 5 } },
        lyrics: { s1: 'words' }
      }
    })
  );
  const restored = await fetchRestore('wxyz 2345 6789 abcd efgh', [song('phone-9', 'Way Maker', 'Sinach', 299)]);
  expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer WXYZ-2345-6789-ABCD-EFGH');
  expect(restored).toMatchObject({
    playlists: [{ id: 'pl-1', name: 'Sunday', trackIds: ['phone-9'] }],
    favorites: ['phone-9'],
    playCounts: { 'phone-9': { n: 3, last: 5 } },
    lyrics: { 'phone-9': 'words' },
    found: 1,
    total: 2
  });
});

test('clear messages: wrong code, no backup, no internet, not set up', async () => {
  await expect(fetchRestore('ABC', [])).rejects.toMatchObject({ kind: 'bad-code' });
  global.fetch = jest.fn(async () => answer(404, { error: 'No backup for this code' }));
  await expect(fetchRestore('ABCD-EFGH-JKLM-NPQR-STUV', [])).rejects.toMatchObject({ kind: 'not-found', message: 'There is no backup for that code.' });
  global.fetch = jest.fn(async () => {
    throw new Error('Network request failed');
  });
  await expect(backupNow({ tracks: [] })).rejects.toMatchObject({ kind: 'offline' });
  setApiUrlForTests('');
  expect(isCloudReady()).toBe(false);
  await expect(backupNow({ tracks: [] })).rejects.toMatchObject({ kind: 'not-configured' });
  expect(await findSharedLyrics({ title: 'Way Maker', artist: 'Sinach' })).toBeNull();
});

test('shared lyrics lookup: found, not found, and never an error', async () => {
  global.fetch = jest.fn(async () => answer(200, { found: true, lyrics: { id: 7, text: 'words', synced: false } }));
  expect(await findSharedLyrics({ title: 'Odo Yewu', artist: 'Joe Mettle', duration: 280.4 })).toMatchObject({ id: 7 });
  expect(global.fetch.mock.calls[0][0]).toBe('https://selah-api.test/api/lyrics?title=Odo%20Yewu&artist=Joe%20Mettle&duration=280');
  global.fetch = jest.fn(async () => answer(200, { found: false }));
  expect(await findSharedLyrics({ title: 'Odo Yewu', artist: 'Joe Mettle' })).toBeNull();
  global.fetch = jest.fn(async () => answer(500, { error: 'boom' }));
  expect(await findSharedLyrics({ title: 'Odo Yewu', artist: 'Joe Mettle' })).toBeNull();
});

test('automatic backup: only when turned on, at most once a day', async () => {
  global.fetch = jest.fn(async () => answer(200, { savedAt: new Date().toISOString() }));
  const state = { tracks: [], playlists: [], favorites: [], playCounts: {} };
  expect(await autoBackupIfDue(state)).toBe(false); // off by default
  await setAutoBackup(true);
  expect(await autoBackupIfDue(state)).toBe(true);
  expect(await autoBackupIfDue(state)).toBe(false); // already done today
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
