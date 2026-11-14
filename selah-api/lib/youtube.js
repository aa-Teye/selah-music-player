// YouTube's official search (YouTube Data API v3), used instead of reading YouTube's website.
// Needs YOUTUBE_API_KEY in Vercel (Google Cloud › APIs & Services › YouTube Data API v3 › Credentials).
// Each search costs 100 of the 10,000 free units a day, so answers are remembered for 12 hours.
import { HttpError } from './http.js';
import { cachedYouTube, saveYouTubeCache, clearOldYouTubeCache } from './db.js';

const API = 'https://www.googleapis.com/youtube/v3';
const SEARCH_MAX_AGE = 12 * 60 * 60 * 1000;
const VIDEOS_MAX_AGE = 24 * 60 * 60 * 1000;
let fetchForTests = null;

export function useYouTubeFetchForTests(fn) {
  fetchForTests = fn;
}

export function youtubeReady() {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

async function api(path, params) {
  if (!youtubeReady()) throw new HttpError(503, 'YouTube search is not set up yet');
  const query = new URLSearchParams({ ...params, key: process.env.YOUTUBE_API_KEY });
  const doFetch = fetchForTests || fetch;
  const res = await doFetch(`${API}/${path}?${query}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    // 403: the daily allowance is used up (or the key is wrong)
    throw new HttpError(res.status === 403 ? 429 : 502, 'YouTube is busy right now. Please try again later.');
  }
  return res.json();
}

/** "PT1H2M10S" → 3730 seconds */
export function isoSeconds(iso) {
  const m = String(iso || '').match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  return (Number(m[1] || 0) * 86400) + (Number(m[2] || 0) * 3600) + (Number(m[3] || 0) * 60) + Number(m[4] || 0);
}

export function formatSeconds(total) {
  const s = Math.max(0, Math.round(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

const decode = (s) =>
  String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

function videoFromApi(item) {
  const snippet = item.snippet || {};
  const thumbs = snippet.thumbnails || {};
  const picture = (thumbs.high || thumbs.medium || thumbs.default || {}).url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
  const seconds = isoSeconds(item.contentDetails && item.contentDetails.duration);
  return {
    youtubeId: item.id,
    title: decode(snippet.title) || 'YouTube video',
    channel: decode(snippet.channelTitle) || 'YouTube',
    duration: seconds,
    durationFormatted: seconds ? formatSeconds(seconds) : '',
    picture,
    live: snippet.liveBroadcastContent === 'live'
  };
}

/** Details for up to 50 videos: title, channel, length, picture. Missing ones no longer exist. */
export async function videoDetails(ids) {
  const clean = [...new Set(ids.filter((id) => /^[\w-]{11}$/.test(id)))].slice(0, 50);
  if (clean.length === 0) return [];
  const key = `videos:${[...clean].sort().join(',')}`;
  const cached = await cachedYouTube(key, VIDEOS_MAX_AGE);
  if (cached) return cached;
  const data = await api('videos', { part: 'snippet,contentDetails', id: clean.join(','), maxResults: '50' });
  const videos = (data.items || []).map(videoFromApi);
  await saveYouTubeCache(key, videos);
  return videos;
}

/** Search: up to 20 videos that can be played inside apps */
export async function searchVideos(q) {
  const query = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (!query) throw new HttpError(400, 'What should we search for?');
  const key = `search:${query.toLowerCase()}`;
  const cached = await cachedYouTube(key, SEARCH_MAX_AGE);
  if (cached) return cached;
  const found = await api('search', {
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true',
    safeSearch: 'moderate',
    maxResults: '20',
    q: query
  });
  const ids = (found.items || []).map((i) => i.id && i.id.videoId).filter(Boolean);
  const details = ids.length ? await videoDetails(ids) : [];
  const byId = new Map(details.map((v) => [v.youtubeId, v]));
  const results = ids.map((id) => byId.get(id)).filter((v) => v && !v.live);
  await saveYouTubeCache(key, results);
  clearOldYouTubeCache().catch(() => {});
  return results;
}
