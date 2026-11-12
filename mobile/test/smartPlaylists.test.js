import { buildSmartPlaylists, playsOf } from '../src/services/smartPlaylists';

const song = (id, extra = {}) => ({ id, title: `Song ${id}`, sourceType: 'local', duration: 240, addedAt: 0, ...extra });

const lists = (tracks, counts) => {
  const out = {};
  buildSmartPlaylists(tracks, counts).forEach((l) => {
    out[l.id] = l.tracks.map((t) => t.id);
  });
  return out;
};

test('most played: by number of plays, then the latest played', () => {
  const tracks = [song('a'), song('b'), song('c'), song('d')];
  const counts = { a: { n: 2, last: 10 }, b: { n: 5, last: 5 }, c: { n: 2, last: 20 }, gone: { n: 9, last: 1 } };
  expect(lists(tracks, counts)['smart-most']).toEqual(['b', 'c', 'a']); // songs no longer on the phone are left out
  expect(playsOf(counts, 'b')).toBe(5);
  expect(playsOf(counts, 'd')).toBe(0);
});

test('recently added, never played and long messages', () => {
  const tracks = [
    song('old', { addedAt: 100 }),
    song('new', { addedAt: 300 }),
    song('mid', { addedAt: 200, duration: 2400 }),
    { id: 'yt-1', title: 'A video', sourceType: 'youtube', youtubeId: 'x', addedAt: 999, duration: 4000 }
  ];
  const out = lists(tracks, { new: { n: 1, last: 1 } });
  expect(out['smart-recent']).toEqual(['new', 'mid', 'old']); // only your own songs
  expect(out['smart-never']).toEqual(['old', 'mid']);
  expect(out['smart-long']).toEqual(['mid']);
});

test('works with an empty library', () => {
  const all = buildSmartPlaylists([], {});
  expect(all).toHaveLength(4);
  all.forEach((l) => {
    expect(l.smart).toBe(true);
    expect(l.tracks).toEqual([]);
    expect(l.empty).toBeTruthy();
  });
});
