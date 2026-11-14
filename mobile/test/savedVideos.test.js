import { videosDue, checkVideos, applyVideoCheck } from '../src/services/savedVideos';
import { setApiUrlForTests } from '../src/services/apiClient';

const DAY = 24 * 60 * 60 * 1000;
const answer = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body), headers: { get: () => null } });

afterEach(() => setApiUrlForTests(null));

test("YouTube's 30-day rule: saved videos older than 25 days (or never checked) are checked again", () => {
  const now = Date.now();
  const songs = [
    { id: 'yt-aaaaaaaaaaa', youtubeId: 'aaaaaaaaaaa', checkedAt: now - 2 * DAY },
    { id: 'yt-bbbbbbbbbbb', youtubeId: 'bbbbbbbbbbb', checkedAt: now - 26 * DAY },
    { id: 'yt-ccccccccccc', youtubeId: 'ccccccccccc' },
    { id: 'local-1', title: 'Way Maker' }
  ];
  expect(videosDue(songs, now).map((s) => s.id)).toEqual(['yt-bbbbbbbbbbb', 'yt-ccccccccccc']);
});

test('fresh details are used, and videos YouTube no longer has are removed', async () => {
  setApiUrlForTests('https://selah.example');
  global.fetch = jest.fn(async () => answer({ videos: [{ youtubeId: 'bbbbbbbbbbb', title: 'New title', channel: 'New channel', duration: 300 }] }));
  const due = [
    { id: 'yt-bbbbbbbbbbb', youtubeId: 'bbbbbbbbbbb', title: 'Old title' },
    { id: 'yt-ccccccccccc', youtubeId: 'ccccccccccc', title: 'Removed video' }
  ];
  const result = await checkVideos(due);
  const songs = applyVideoCheck([...due, { id: 'local-1', title: 'Way Maker' }], result);
  expect(songs).toEqual([
    expect.objectContaining({ id: 'yt-bbbbbbbbbbb', title: 'New title', artist: 'New channel', duration: 300, checkedAt: expect.any(Number) }),
    { id: 'local-1', title: 'Way Maker' }
  ]);

  // offline: nothing changes, it is tried again next time
  global.fetch = jest.fn(async () => {
    throw new Error('Network request failed');
  });
  expect(await checkVideos(due)).toBeNull();
});
