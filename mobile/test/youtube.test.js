import { searchYouTube, videoDetails, extractVideoId, VIDEO_REFRESH_AGE } from '../src/services/youtubeService';
import { setApiUrlForTests } from '../src/services/apiClient';

const answer = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body), headers: { get: () => null } });

afterEach(() => setApiUrlForTests(null));

test("search uses YouTube's official search through Selah's server, never youtube.com pages", async () => {
  global.fetch = jest.fn(async () => answer({}));
  setApiUrlForTests('');
  expect(await searchYouTube('worship')).toEqual([]); // no server: nothing, and nothing fetched
  expect(global.fetch).not.toHaveBeenCalled();

  setApiUrlForTests('https://selah.example');
  global.fetch = jest.fn(async () =>
    answer({
      results: [
        { youtubeId: 'gIWCDgNt5ww', title: 'Full Live Worship Set', channel: 'Chris Tomlin', duration: 3730, durationFormatted: '1:02:10', picture: 'https://i.ytimg.com/vi/gIWCDgNt5ww/hqdefault.jpg' }
      ]
    })
  );
  const [song] = await searchYouTube('  Chris Tomlin worship ');
  expect(String(global.fetch.mock.calls[0][0])).toBe('https://selah.example/api/youtube/search?q=Chris%20Tomlin%20worship');
  expect(song).toMatchObject({
    id: 'yt-gIWCDgNt5ww',
    youtubeId: 'gIWCDgNt5ww',
    sourceType: 'youtube',
    title: 'Full Live Worship Set',
    artist: 'Chris Tomlin',
    duration: 3730,
    coverUrl: 'https://i.ytimg.com/vi/gIWCDgNt5ww/hqdefault.jpg'
  });
  expect(Date.now() - song.checkedAt).toBeLessThan(5000);
});

test('saved videos are checked again before 30 days (YouTube rule); offline means try later', async () => {
  expect(VIDEO_REFRESH_AGE).toBeLessThan(30 * 24 * 60 * 60 * 1000);
  setApiUrlForTests('https://selah.example');
  global.fetch = jest.fn(async () => answer({ videos: [{ youtubeId: 'dy9nwe9_xzw', title: 'Oceans', channel: 'Hillsong UNITED' }] }));
  const fresh = await videoDetails(['dy9nwe9_xzw', 'not valid']);
  expect(String(global.fetch.mock.calls[0][0])).toBe('https://selah.example/api/youtube/videos?ids=dy9nwe9_xzw');
  expect(fresh).toEqual([expect.objectContaining({ id: 'yt-dy9nwe9_xzw', title: 'Oceans', artist: 'Hillsong UNITED' })]);

  global.fetch = jest.fn(async () => {
    throw new Error('Network request failed');
  });
  expect(await videoDetails(['dy9nwe9_xzw'])).toBeNull();
});

test('links and IDs', () => {
  expect(extractVideoId('https://youtu.be/dy9nwe9_xzw')).toBe('dy9nwe9_xzw');
  expect(extractVideoId('https://www.youtube.com/watch?v=dy9nwe9_xzw&t=10')).toBe('dy9nwe9_xzw');
  expect(extractVideoId('nope')).toBeNull();
});
