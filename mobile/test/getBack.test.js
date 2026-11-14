import { mergeGetBack, findGotBack, getBackSearch } from '../src/services/getBack';

test('the list never shows a song twice, and keeps every playlist it belongs to', () => {
  const list = mergeGetBack(
    [{ title: 'Imela', artist: 'Nathaniel Bassey', playlists: ['pl-1'] }],
    [
      { title: 'Imela (Live)', artist: 'NATHANIEL BASSEY', playlists: ['pl-2', 'pl-1'], loved: true },
      { title: 'Odo Yewu', artist: 'Joe Mettle', duration: 279.6 },
      null,
      { title: '' }
    ]
  );
  expect(list).toEqual([
    { key: 'imela|nathaniel bassey', title: 'Imela', artist: 'Nathaniel Bassey', duration: 0, playlists: ['pl-1', 'pl-2'], loved: true },
    { key: 'odo yewu|joe mettle', title: 'Odo Yewu', artist: 'Joe Mettle', duration: 280, playlists: [], loved: false }
  ]);
});

test('a song is back once a song with the same name, artist and length is on the phone', () => {
  const list = [
    { key: 'imela|nathaniel bassey', title: 'Imela', artist: 'Nathaniel Bassey', duration: 300 },
    { key: 'odo yewu|joe mettle', title: 'Odo Yewu', artist: 'Joe Mettle', duration: 0 }
  ];
  const { found, still } = findGotBack(list, [
    { id: 'p1', title: 'Imela', artist: 'Nathaniel Bassey', duration: 420 }, // a longer live version
    { id: 'p2', title: 'Imela', artist: 'Nathaniel Bassey', duration: 302 },
    { id: 'p3', title: 'Odo', artist: 'Joe Mettle', duration: 280 }
  ]);
  expect(found).toEqual([{ song: list[0], track: expect.objectContaining({ id: 'p2' }) }]);
  expect(still).toEqual([list[1]]);
  expect(findGotBack([], [{ id: 'x', title: 'a' }])).toEqual({ found: [], still: [] });
});

test('"Find" searches YouTube for the song and its artist', () => {
  expect(getBackSearch({ title: 'Odo Yewu', artist: 'Joe Mettle' })).toBe('Odo Yewu Joe Mettle');
  expect(getBackSearch({ title: 'Imela', artist: '' })).toBe('Imela');
});
