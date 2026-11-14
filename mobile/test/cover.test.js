import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CoverArt, { hasRealCover, coverColors, initialsOf } from '../src/components/CoverArt';
import SongThumb from '../src/components/SongThumb';
import { Id3Service, SONG_PHOTOS } from '../src/services/id3Service';

test("songs without their own picture get Selah's photos, like before, shared out so not every song looks the same", () => {
  const photos = Object.values(SONG_PHOTOS);
  expect(photos).toHaveLength(6);
  expect(Id3Service.generateCuratedArtwork('Way Maker (Live Worship)', 'Sinach')).toBe(SONG_PHOTOS.worship);
  expect(Id3Service.generateCuratedArtwork('Be Still', 'Choir')).toBe(SONG_PHOTOS.ocean);
  expect(Id3Service.generateCuratedArtwork('Odo Yewu', 'Joe Mettle')).toBe(Id3Service.generateCuratedArtwork('Odo Yewu', 'Joe Mettle'));
  const others = ['Odo Yewu', 'Excess Love', 'Imela', 'Bo Noo Ni', 'Nara', 'Onise Iyanu', 'Okemmuo', 'Yahweh', 'Ebezina', 'Chinedum', 'Nkwa', 'Ayo'].map(
    (title) => Id3Service.generateCuratedArtwork(title, 'x')
  );
  others.forEach((p) => expect(photos).toContain(p));
  expect(new Set(others).size).toBeGreaterThanOrEqual(3);
});

test('real pictures are kept: album art from the file, YouTube thumbnails, your own choice', () => {
  expect(hasRealCover({ coverUrl: 'file:///cache/selah-covers/a.jpg', coverFile: 'a.jpg' })).toBe(true);
  expect(hasRealCover({ coverUrl: 'https://img.youtube.com/vi/x/hqdefault.jpg', youtubeId: 'x' })).toBe(true);
  expect(hasRealCover({ coverUrl: 'https://example.com/mine.jpg', customCover: true })).toBe(true);
  expect(hasRealCover({ coverUrl: SONG_PHOTOS.studio })).toBe(false); // a Selah photo, not the song's own
  expect(hasRealCover(null)).toBe(false);
});

test("big views show the song's own picture, or its Selah photo", async () => {
  await render(<CoverArt track={{ title: 'Excess Love', artist: 'Mercy Chinwo', coverUrl: SONG_PHOTOS.stage }} size={80} />);
  expect(screen.getByTestId('cover-photo').props.source).toEqual({ uri: SONG_PHOTOS.stage });

  await render(<CoverArt track={{ title: 'Nothing chosen yet' }} size={80} />);
  expect(screen.getByTestId('cover-photo').props.source).toEqual({ uri: SONG_PHOTOS.studio });

  await render(<CoverArt track={{ title: 'Nara', coverUrl: 'file:///cache/selah-covers/n.png', coverFile: 'n.png' }} size={80} />);
  expect(screen.getByTestId('cover-real').props.source).toEqual({ uri: 'file:///cache/selah-covers/n.png' });
});

test('offline: when no picture can load, a quiet music note shows instead of an empty box', async () => {
  await render(<CoverArt track={{ title: 'Imela', coverUrl: SONG_PHOTOS.guitar }} size={60} />);
  await fireEvent(screen.getByTestId('cover-photo'), 'error');
  expect(screen.getByTestId('cover-note')).toBeTruthy();
});

test('song lists show a music note for songs without art, and the cover when there is one (like before)', async () => {
  await render(<SongThumb track={{ title: 'Imela', coverUrl: SONG_PHOTOS.studio }} />);
  expect(screen.getByTestId('song-note')).toBeTruthy();
  await render(<SongThumb track={{ title: 'Nara', coverUrl: 'file:///cache/selah-covers/n.png', coverFile: 'n.png' }} />);
  expect(screen.getByTestId('song-cover')).toBeTruthy();
});

test('artists (people, not songs) show a coloured circle with their initials', async () => {
  expect(initialsOf('Joe Mettle')).toBe('JM');
  expect(initialsOf('Ọlọ́run Àgbáyé')).toBe('ỌÀ');
  expect(initialsOf('')).toBe('♪');
  expect(coverColors({ title: 'Sinach' })).toEqual(coverColors({ title: 'Sinach' }));
  await render(<CoverArt person track={{ title: 'Joe Mettle' }} size={60} round />);
  expect(screen.getByTestId('cover-made')).toBeTruthy();
  expect(screen.getByText('JM')).toBeTruthy();
});
