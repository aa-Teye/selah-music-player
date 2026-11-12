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

// ── Cover pictures ──────────────────────────────────────────────────────────
const withPicture = (bytes, ext) => readTagsFromReader(fx.memoryReader(bytes), ext, { picture: true });
const picOf = (tags) => (tags.picture ? Array.from(tags.picture.data) : null);

test('MP3: picks the FRONT cover even when another picture comes first', () => {
  const front = fx.jpeg(1);
  const tags = withPicture(fx.mp3WithCovers(front, fx.jpeg(2)), 'mp3');
  expect(tags).toMatchObject({ title: 'Jehovah Overdo', artist: 'Minister GUC' });
  expect(tags.picture.type).toBe('jpg');
  expect(picOf(tags)).toEqual(front);
});

test('covers are only read when asked for', () => {
  const tags = readTagsFromReader(fx.memoryReader(fx.mp3WithCovers(fx.jpeg(1), fx.jpeg(2))), 'mp3');
  expect(tags.title).toBe('Jehovah Overdo');
  expect(tags.picture).toBeUndefined();
});

test('MP3: newer (v2.4, unsynchronised frame), older (v2.2) and fully unsynchronised tags', () => {
  const pic = fx.png();
  const v24 = withPicture(fx.mp3v24WithCover(pic), 'mp3');
  expect(v24.title).toBe('Nara');
  expect(v24.picture.type).toBe('png');
  expect(picOf(v24)).toEqual(pic);

  const jpg = fx.jpeg(3);
  const unsynced = withPicture(fx.mp3UnsyncedTag(jpg), 'mp3');
  expect(unsynced.title).toBe('Odo Yewu');
  expect(picOf(unsynced)).toEqual(jpg);

  const v22 = withPicture(fx.mp3v22WithCover(jpg), 'mp3');
  expect(v22.title).toBe('Onise Iyanu');
  expect(picOf(v22)).toEqual(jpg);
});

test('a huge cover is skipped, and the title stored after it is still found', () => {
  const tags = withPicture(fx.mp3WithHugeCover(), 'mp3');
  expect(tags.title).toBe('Big Cover Song');
  expect(tags.picture).toBeUndefined();
});

test('M4A, FLAC and WAV covers (and WAV names from its INFO list)', () => {
  const pic = fx.jpeg(4);
  const m4a = withPicture(fx.m4aWithCover(pic), 'm4a');
  expect(m4a.title).toBe('Yesu Mo');
  expect(picOf(m4a)).toEqual(pic);

  expect(picOf(withPicture(fx.flacWithCover(pic), 'flac'))).toEqual(pic);

  const wav = withPicture(fx.wavWithDetails(pic), 'wav');
  expect(wav).toMatchObject({ title: 'Bo Noo Ni', artist: 'Joe Mettle', album: 'Love Never Fails', duration: 3 });
  expect(picOf(wav)).toEqual(pic);
});

test('data that is not a picture is never treated as a cover', () => {
  const junk = Array.from({ length: 200 }, (_, i) => (i * 13) & 127);
  expect(withPicture(fx.mp3WithCovers(junk, junk), 'mp3').picture).toBeUndefined();
});
