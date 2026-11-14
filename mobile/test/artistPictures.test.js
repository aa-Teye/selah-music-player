import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadArtistPictures,
  resetArtistPicturesForTests,
  PICTURES_REFRESH_AGE,
  PICTURES_MAX_AGE
} from '../src/services/artistPictures';
import { setApiUrlForTests } from '../src/services/apiClient';
import { ARTISTS } from '../src/data/discover';

const DAY = 24 * 60 * 60 * 1000;
const answer = (status, body) => ({
  ok: status < 400,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
  headers: { get: () => null }
});
const artists = [
  { name: 'Sinach', youtube: 'UCcaV40yrjS5R88xYHxK_0rA' },
  { name: 'Joe Mettle', youtube: '@JoeMettleMinistries' },
  { name: 'Someone new', youtube: 'UCaaaaaaaaaaaaaaaaaaaaaa' },
  { name: 'No channel' }
];
const channels = {
  UCcaV40yrjS5R88xYHxK_0rA: { id: 'UCcaV40yrjS5R88xYHxK_0rA', title: 'Sinach', picture: 'https://yt3.ggpht.com/sinach' },
  '@JoeMettleMinistries': { id: 'UCEwvM8_QdsFIioyVIiGq01Q', title: 'Joe Mettle', picture: 'https://yt3.ggpht.com/joe' }
};

beforeEach(async () => {
  await AsyncStorage.clear();
  resetArtistPicturesForTests();
  setApiUrlForTests('https://selah.example');
});
afterEach(() => setApiUrlForTests(null));

test("artists get their own YouTube channel pictures, asked for all at once", async () => {
  global.fetch = jest.fn(async () => answer(200, { channels }));
  const now = Date.now();
  expect(await loadArtistPictures(artists, now)).toEqual({
    Sinach: 'https://yt3.ggpht.com/sinach',
    'Joe Mettle': 'https://yt3.ggpht.com/joe'
  }); // no channel or no picture: their initials, as before
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(decodeURIComponent(global.fetch.mock.calls[0][0])).toContain(
    '/api/youtube/channels?ids=UCcaV40yrjS5R88xYHxK_0rA,@JoeMettleMinistries,UCaaaaaaaaaaaaaaaaaaaaaa'
  );

  // the next time: from the phone, no question to the server
  expect(await loadArtistPictures(artists, now + DAY)).toHaveProperty('Sinach');
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("YouTube's 30-day rule: asked again after 25 days; never shown after 30 days", async () => {
  global.fetch = jest.fn(async () => answer(200, { channels }));
  const start = Date.now();
  await loadArtistPictures(artists, start);

  // after 25 days, offline: the pictures still show (under 30 days old) and Selah tries again later
  global.fetch = jest.fn(async () => {
    throw new Error('Network request failed');
  });
  expect(await loadArtistPictures(artists, start + PICTURES_REFRESH_AGE + DAY)).toHaveProperty('Sinach');
  expect(global.fetch).toHaveBeenCalledTimes(1);

  // after 30 days and still offline: removed from the phone, initials instead
  resetArtistPicturesForTests();
  expect(await loadArtistPictures(artists, start + PICTURES_MAX_AGE + DAY)).toEqual({});
  expect(await AsyncStorage.getItem('@selah_artist_pictures')).toBeNull();

  // back online: fresh pictures
  resetArtistPicturesForTests();
  global.fetch = jest.fn(async () => answer(200, { channels }));
  expect(await loadArtistPictures(artists, start + PICTURES_MAX_AGE + 2 * DAY)).toHaveProperty('Joe Mettle');
});

test('YouTube not set up on the server yet: initials, and Selah does not keep asking', async () => {
  global.fetch = jest.fn(async () => answer(503, { error: 'YouTube search is not set up yet' }));
  const now = Date.now();
  expect(await loadArtistPictures(artists, now)).toEqual({});
  expect(await loadArtistPictures(artists, now + 60 * 1000)).toEqual({});
  expect(global.fetch).toHaveBeenCalledTimes(1); // waits a few minutes before asking again
});

test('every gospel artist in Libraries has their own YouTube channel ID or @handle', () => {
  ARTISTS.forEach((a) => expect(a.youtube).toMatch(/^(UC[\w-]{22}|@[\w.-]{3,30})$/));
  expect(new Set(ARTISTS.map((a) => a.youtube.toLowerCase())).size).toBe(ARTISTS.length);
});
