import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CoverArt, { hasRealCover, coverColors, initialsOf } from '../src/components/CoverArt';

test('every song gets its own colourful cover, always the same one', () => {
  const a = { title: 'Way Maker', artist: 'Sinach' };
  const b = { title: 'Odo Yewu', artist: 'Joe Mettle' };
  expect(coverColors(a)).toEqual(coverColors({ ...a }));
  const many = ['Way Maker', 'Odo Yewu', 'Excess Love', 'Imela', 'Bo Noo Ni', 'Nara', 'Jehovah Overdo', 'Onise Iyanu'].map(
    (title) => coverColors({ title, artist: 'x' })[0]
  );
  expect(new Set(many).size).toBeGreaterThanOrEqual(4); // plenty of different colours
  expect(coverColors(a)).not.toBeNull();
  expect(coverColors(b)).toHaveLength(2);
});

test('the letters on a cover come from the song name', () => {
  expect(initialsOf('Way Maker')).toBe('WM');
  expect(initialsOf('Oceans (Where Feet May Fail)')).toBe('O');
  expect(initialsOf('Ọlọ́run Àgbáyé')).toBe('ỌÀ');
  expect(initialsOf('')).toBe('♪');
});

test('real pictures are kept: album art from the file, YouTube thumbnails, your own choice', () => {
  expect(hasRealCover({ coverUrl: 'file:///cache/selah-covers/a.jpg', coverFile: 'a.jpg' })).toBe(true);
  expect(hasRealCover({ coverUrl: 'https://img.youtube.com/vi/x/hqdefault.jpg', youtubeId: 'x' })).toBe(true);
  expect(hasRealCover({ coverUrl: 'https://example.com/mine.jpg', customCover: true })).toBe(true);
  // the old stock photo every song used to share is not a real cover
  expect(hasRealCover({ coverUrl: 'https://images.unsplash.com/photo-1511671782779' })).toBe(false);
  expect(hasRealCover(null)).toBe(false);
});

test('a song without album art shows its letters; one with art shows the picture', async () => {
  await render(<CoverArt track={{ title: 'Excess Love', artist: 'Mercy Chinwo', coverUrl: 'https://images.unsplash.com/x' }} size={80} />);
  expect(screen.getByTestId('cover-made')).toBeTruthy();
  expect(screen.getByText('EL')).toBeTruthy();

  await render(<CoverArt track={{ title: 'Nara', coverUrl: 'file:///cache/selah-covers/n.png', coverFile: 'n.png' }} size={80} />);
  expect(screen.getByTestId('cover-real').props.source).toEqual({ uri: 'file:///cache/selah-covers/n.png' });
});
