import { searchYouTube, searchYouTubeWithStatus, videoDetails, extractVideoId, VIDEO_REFRESH_AGE } from '../src/services/youtubeService';
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

test("an artist's newest songs ask for their channel, which costs far less of the day's searches", async () => {
  setApiUrlForTests('https://selah.example');
  global.fetch = jest.fn(async () => answer({ results: [{ youtubeId: 'gIWCDgNt5ww', title: 'Way Maker', channel: 'Sinach' }] }));
  const { results, problem } = await searchYouTubeWithStatus('latest Sinach songs 2026', { channel: '@SinachOfficial' });
  expect(String(global.fetch.mock.calls[0][0])).toBe(
    'https://selah.example/api/youtube/search?q=latest%20Sinach%20songs%202026&channel=%40SinachOfficial'
  );
  expect(results).toHaveLength(1);
  expect(problem).toBeNull();
  await searchYouTube('latest Sinach songs 2026', 20, 'UCcaV40yrjS5R88xYHxK_0rA');
  expect(String(global.fetch.mock.calls[1][0])).toContain('&channel=UCcaV40yrjS5R88xYHxK_0rA');
});

test("when a search shows nothing, Selah can say why: the day's searches are used up, no internet, or busy", async () => {
  setApiUrlForTests('https://selah.example');
  const fail = (status, body) => ({ ok: false, status, json: async () => body, text: async () => JSON.stringify(body), headers: { get: () => null } });

  global.fetch = jest.fn(async () => fail(429, { error: 'Search is resting until tomorrow morning.', code: 'resting' }));
  expect(await searchYouTubeWithStatus('worship')).toEqual({ results: [], problem: 'resting' });

  global.fetch = jest.fn(async () => {
    throw new Error('Network request failed');
  });
  expect(await searchYouTubeWithStatus('worship')).toEqual({ results: [], problem: 'offline' });

  global.fetch = jest.fn(async () => fail(503, { error: 'YouTube search is not set up yet' }));
  expect(await searchYouTubeWithStatus('worship')).toEqual({ results: [], problem: 'busy' });

  global.fetch = jest.fn(async () => answer({ results: [] }));
  expect(await searchYouTubeWithStatus('zzzz nothing')).toEqual({ results: [], problem: null }); // really nothing found
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
