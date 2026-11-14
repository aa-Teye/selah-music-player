import { GENRES, ARTISTS, latestSongsSearch, artistSearch } from '../src/data/discover';

const ionicons = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');

test('a genre or an artist asks YouTube for the newest songs', () => {
  expect(latestSongsSearch('Ghana gospel songs', 2026)).toBe('latest Ghana gospel songs 2026');
  expect(artistSearch('Joe Mettle', 2026)).toBe('latest Joe Mettle songs 2026');
  expect(artistSearch('Joe Mettle')).toBe(`latest Joe Mettle songs ${new Date().getFullYear()}`);
});

test('every genre has a real icon, and nothing is listed twice', () => {
  GENRES.forEach((g) => expect(ionicons[g.icon]).toBeDefined());
  expect(new Set(GENRES.map((g) => g.id)).size).toBe(GENRES.length);
  expect(new Set(ARTISTS.map((a) => a.name)).size).toBe(ARTISTS.length);
});
