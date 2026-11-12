import { readTagsFromReader, readTags } from '../src/services/tagReader';
const fx = require('./fixtures');
const fs = require('./mocks/fileSystem');

test('MP3: title, artist, album, lyrics and length from inside the file', () => {
  const tags = readTagsFromReader(fx.memoryReader(fx.mp3WithTags()), 'mp3');
  expect(tags.title).toBe('Way Maker');
  expect(tags.artist).toBe('Sinach');
  expect(tags.album).toBe('Ọlọ́run Worship');
  expect(tags.lyrics).toBe('You are here\nmoving in our midst');
  expect(tags.duration).toBe(26); // 1000 frames x 1152 samples / 44100 Hz
});

test('MP3 with only an old ID3v1 tag', () => {
  const tags = readTagsFromReader(fx.memoryReader(fx.mp3WithId3v1()), 'mp3');
  expect(tags).toMatchObject({ title: 'Imela', artist: 'Nathaniel Bassey', album: 'Revival', duration: 1 });
});

test('M4A with details stored at the end of the file', () => {
  const tags = readTagsFromReader(fx.memoryReader(fx.m4aWithTags()), 'm4a');
  expect(tags).toMatchObject({ title: 'Goodness of God', artist: 'CeCe Winans', duration: 245 });
  expect(tags.lyrics).toContain('For Your mercy never fails me');
});

test('FLAC, WAV and Opus lengths (and FLAC names)', () => {
  expect(readTagsFromReader(fx.memoryReader(fx.flacWithTags()), 'flac')).toMatchObject({
    title: 'Excess Love',
    artist: 'Mercy Chinwo',
    duration: 200
  });
  expect(readTagsFromReader(fx.memoryReader(fx.wav3s()), 'wav').duration).toBe(3);
  expect(readTagsFromReader(fx.memoryReader(fx.opus180s()), 'opus').duration).toBe(180);
});

test('reads a real file through the file system, and survives broken files', () => {
  fs.__reset({
    'file:///docs/': { dirs: [], files: { 'a.mp3': { bytes: fx.mp3WithTags() }, 'broken.mp3': { bytes: Uint8Array.from([1, 2, 3]) } } }
  });
  expect(readTags('file:///docs/a.mp3')).toMatchObject({ title: 'Way Maker', artist: 'Sinach' });
  expect(readTags('file:///docs/broken.mp3')).toEqual({});
  expect(readTags('file:///docs/missing.mp3')).toBeNull();
});
