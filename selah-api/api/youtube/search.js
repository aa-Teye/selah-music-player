// GET /api/youtube/search?q=worship%20songs[&channel=UC…|@handle] → { results: [{ youtubeId, title, channel,
//   duration, durationFormatted, picture }] }   (channel: an artist's own channel, the cheap way to get their latest songs)
// YouTube's official search (YouTube API Services), for the app. No account needed.
import { json, preflight, endpoint } from '../../lib/http.js';
import { searchVideos } from '../../lib/youtube.js';

export const GET = endpoint(async (request) => {
  const params = new URL(request.url).searchParams;
  return json(200, { results: await searchVideos(params.get('q'), params.get('channel') || '') });
});

export const OPTIONS = preflight;
