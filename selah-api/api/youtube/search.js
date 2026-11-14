// GET /api/youtube/search?q=worship%20songs → { results: [{ youtubeId, title, channel, duration,
//   durationFormatted, picture }] }
// YouTube's official search (YouTube API Services), for the app. No account needed.
import { json, preflight, endpoint } from '../../lib/http.js';
import { searchVideos } from '../../lib/youtube.js';

export const GET = endpoint(async (request) => {
  const q = new URL(request.url).searchParams.get('q');
  return json(200, { results: await searchVideos(q) });
});

export const OPTIONS = preflight;
