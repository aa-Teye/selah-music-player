// GET /api/youtube/videos?ids=a1,b2 (up to 50) → { videos: [...] }
// Fresh details for the videos people saved: YouTube's rules say stored video details must be
// refreshed within 30 days. A video missing from the answer no longer exists.
import { json, preflight, endpoint } from '../../lib/http.js';
import { videoDetails } from '../../lib/youtube.js';

export const GET = endpoint(async (request) => {
  const ids = (new URL(request.url).searchParams.get('ids') || '').split(',').map((s) => s.trim());
  return json(200, { videos: await videoDetails(ids) });
});

export const OPTIONS = preflight;
