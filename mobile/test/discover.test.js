import { GENRES, ARTISTS, latestSongsSearch, artistSearch, artistChannel } from '../src/data/discover';

const ionicons = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');

test('a genre or an artist asks YouTube for the newest songs', () => {
  expect(latestSongsSearch('Ghana gospel songs', 2026)).toBe('latest Ghana gospel songs 2026');
  expect(artistSearch('Joe Mettle', 2026)).toBe('latest Joe Mettle songs 2026');
  expect(artistSearch('Joe Mettle')).toBe(`latest Joe Mettle songs ${new Date().getFullYear()}`);
});

test("a gospel artist's own channel is known; an artist Selah does not know has none", () => {
  expect(artistChannel('Joe Mettle')).toBe('@JoeMettleMinistries');
  expect(artistChannel('Sinach')).toBe('UCcaV40yrjS5R88xYHxK_0rA');
  expect(artistChannel('Somebody New')).toBe('');
});

test('every genre has its own photo: in the app, small, and in the credits list', () => {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '..', 'assets', 'genres');
  const credits = fs.readFileSync(path.join(dir, 'CREDITS.md'), 'utf8');
  GENRES.forEach((g) => {
    expect(g.photo).toBeTruthy();
    const file = path.join(dir, `${g.id}.jpg`);
    expect(fs.existsSync(file)).toBe(true);
    expect(fs.statSync(file).size).toBeLessThan(60 * 1024); // keeps the app small
    expect(credits).toContain(`| ${g.name} |`);
  });
});

test('every genre has a real icon, and nothing is listed twice', () => {
  GENRES.forEach((g) => expect(ionicons[g.icon]).toBeDefined());
  expect(new Set(GENRES.map((g) => g.id)).size).toBe(GENRES.length);
  expect(new Set(ARTISTS.map((a) => a.name)).size).toBe(ARTISTS.length);
});

test('the messages for a search that shows nothing use real icons and say what is happening', () => {
  const { SEARCH_PROBLEMS } = require('../src/screens/YouTubeWatchScreen');
  Object.values(SEARCH_PROBLEMS).forEach((p) => {
    expect(ionicons[p.icon]).toBeDefined();
    expect(p.title('worship').length).toBeGreaterThan(5);
  });
  expect(SEARCH_PROBLEMS.resting.title()).toBe('Search is resting until tomorrow morning');
});
