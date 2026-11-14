// GET /api/youtube/channels?ids=UC…,@handle → { channels: { "<ID or @handle>": { id, title, picture } } }
// The pictures for the gospel artists in Libraries: each artist's own YouTube channel picture.
// The app says these pictures come from YouTube, and asks again before 30 days (YouTube's rules).
import { json, preflight, endpoint } from '../../lib/http.js';
import { channelPictures } from '../../lib/youtube.js';

export const GET = endpoint(async (request) => {
  const keys = (new URL(request.url).searchParams.get('ids') || '').split(',').map((s) => s.trim());
  return json(200, { channels: await channelPictures(keys) });
});

export const OPTIONS = preflight;
