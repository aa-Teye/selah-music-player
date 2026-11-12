import { saveCover, coverUri, savedCoverNames, resetCoverStore, COVER_BUDGET_BYTES } from '../src/services/coverStore';
const fx = require('./fixtures');
const fs = require('./mocks/fileSystem');

const FOLDER = 'file:///cache/selah-covers/';
const picture = (bytes) => ({ data: Uint8Array.from(bytes), type: 'jpg' });

beforeEach(() => {
  fs.__reset();
  resetCoverStore();
});

test('a cover is saved once and songs with the same picture share it', () => {
  const first = saveCover(picture(fx.jpeg(1)));
  expect(first).toMatch(/\.jpg$/);
  expect(Array.from(fs.__FS[FOLDER].files[first].bytes)).toEqual(fx.jpeg(1));
  expect(coverUri(first)).toBe(FOLDER + first);

  expect(saveCover(picture(fx.jpeg(1)))).toBe(first); // same album art: same file
  const other = saveCover(picture(fx.jpeg(2)));
  expect(other).not.toBe(first);
  expect(Object.keys(fs.__FS[FOLDER].files)).toHaveLength(2);
  expect(savedCoverNames()).toEqual(new Set([first, other]));
});

test('the real kind of picture decides the file type', () => {
  expect(saveCover({ data: Uint8Array.from(fx.png()), type: 'jpg' })).toMatch(/\.png$/);
});

test('junk, tiny pictures and a full covers folder are refused', () => {
  expect(saveCover(null)).toBeNull();
  expect(saveCover(picture([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]))).toBeNull();
  expect(saveCover(picture([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull(); // too small

  fs.__reset({
    'file:///docs/': { dirs: [], files: {} },
    [FOLDER]: { dirs: [], files: { 'old.jpg': { size: COVER_BUDGET_BYTES } } }
  });
  resetCoverStore();
  expect(saveCover(picture(fx.jpeg(5)))).toBeNull();
});
