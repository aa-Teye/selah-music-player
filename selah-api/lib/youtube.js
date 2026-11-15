// YouTube's official search (YouTube Data API v3), used instead of reading YouTube's website.
// Needs YOUTUBE_API_KEY in Vercel (Google Cloud › APIs & Services › YouTube Data API v3 › Credentials).
// Each keyword search costs 100 of the 10,000 free units a day, so the allowance is made to last:
//  • answers are remembered for a day (YouTube allows up to 30 days);
//  • an artist's "latest songs" come from the artist's own channel uploads (about 3 units, not 100);
//  • when the day's allowance is used up, the last answer is shown again instead of an error.
import { HttpError } from './http.js';
import { cachedYouTube, saveYouTubeCache, clearOldYouTubeCache } from './db.js';

const API = 'https://www.googleapis.com/youtube/v3';
const SEARCH_MAX_AGE = 24 * 60 * 60 * 1000;
const STALE_MAX_AGE = 2 * 24 * 60 * 60 * 1000; // shown when YouTube cannot be asked (Selah deletes older answers)
const MIN_UPLOADS = 3; // a channel with fewer songs than this: use a keyword search instead
const MIN_SONG_SECONDS = 60; // shorter uploads are clips and Shorts, not songs
const VIDEOS_MAX_AGE = 24 * 60 * 60 * 1000;
const CHANNELS_MAX_AGE = 24 * 60 * 60 * 1000;
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
    // 403: the daily allowance is used up (or the key is wrong); it fills up again every morning
    if (res.status === 403) throw new HttpError(429, 'Search is resting until tomorrow morning.', { code: 'resting' });
    throw new HttpError(502, 'YouTube is busy right now. Please try again later.');
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
    live: snippet.liveBroadcastContent === 'live',
    ...(item.status && item.status.embeddable === false ? { embeddable: false } : {}) // cannot play inside apps
  };
}

/** Details for up to 50 videos: title, channel, length, picture. Missing ones no longer exist. */
export async function videoDetails(ids) {
  const clean = [...new Set(ids.filter((id) => /^[\w-]{11}$/.test(id)))].slice(0, 50);
  if (clean.length === 0) return [];
  const key = `videos:${[...clean].sort().join(',')}`;
  const cached = await cachedYouTube(key, VIDEOS_MAX_AGE);
  if (cached) return cached;
  const data = await api('videos', { part: 'snippet,contentDetails,status', id: clean.join(','), maxResults: '50' });
  const videos = (data.items || []).map(videoFromApi);
  await saveYouTubeCache(key, videos);
  return videos;
}

function channelFromApi(item) {
  const snippet = item.snippet || {};
  const thumbs = snippet.thumbnails || {};
  return {
    id: item.id,
    title: decode(snippet.title),
    picture: (thumbs.medium || thumbs.high || thumbs.default || {}).url || ''
  };
}

/**
 * Artists' pictures: each artist's own YouTube channel picture, asked by channel ID ("UC…", up to 50
 * in one call, 1 unit) or by handle ("@name", one call each). Remembered for a day; YouTube's rules
 * say stored details must be refreshed within 30 days. Answer: { "<ID or @handle>": { id, title, picture } }.
 * Channels that don't exist (any more) are left out.
 */
export async function channelPictures(keys) {
  const wanted = [...new Set(keys.map((k) => String(k || '').trim()).filter(Boolean))];
  const ids = wanted.filter((k) => /^UC[\w-]{22}$/.test(k)).slice(0, 50);
  const handles = wanted.filter((k) => /^@[\w.-]{3,30}$/.test(k)).slice(0, 25);
  const found = {};
  if (ids.length) {
    const key = `channels:${[...ids].sort().join(',')}`;
    let channels = await cachedYouTube(key, CHANNELS_MAX_AGE);
    if (!channels) {
      const data = await api('channels', { part: 'snippet', id: ids.join(','), maxResults: '50' });
      channels = (data.items || []).map(channelFromApi).filter((c) => c.picture);
      await saveYouTubeCache(key, channels);
    }
    channels.forEach((c) => {
      found[c.id] = c;
    });
  }
  for (const handle of handles) {
    const channel = await channelForHandle(handle);
    if (channel) found[handle] = channel;
  }
  return found;
}

/** The channel behind an @handle (1 unit, remembered for a day), or null */
async function channelForHandle(handle) {
  const key = `handle:${handle.toLowerCase()}`;
  let channels = await cachedYouTube(key, CHANNELS_MAX_AGE);
  if (!channels) {
    const data = await api('channels', { part: 'snippet', forHandle: handle });
    channels = (data.items || []).map(channelFromApi).filter((c) => c.picture);
    await saveYouTubeCache(key, channels);
  }
  return channels[0] || null;
}

const isChannelKey = (k) => /^UC[\w-]{22}$/.test(k) || /^@[\w.-]{3,30}$/.test(k);

/**
 * The newest songs an artist uploaded to their own channel: about 3 units (handle lookup, upload list,
 * details) instead of the 100 a keyword search costs. Shorts and clips are left out.
 */
async function channelUploads(channel) {
  let id = channel;
  if (channel.startsWith('@')) {
    const found = await channelForHandle(channel);
    id = found && found.id;
  }
  if (!id) return [];
  const key = `uploads:${id}`;
  const cached = await cachedYouTube(key, SEARCH_MAX_AGE);
  if (cached) return cached;
  // a channel's uploads are the playlist with the same ID, starting "UU" instead of "UC"
  const list = await api('playlistItems', { part: 'contentDetails', playlistId: `UU${id.slice(2)}`, maxResults: '25' });
  const ids = (list.items || []).map((i) => i.contentDetails && i.contentDetails.videoId).filter(Boolean);
  const details = ids.length ? await videoDetails(ids) : [];
  const byId = new Map(details.map((v) => [v.youtubeId, v]));
  const songs = ids
    .map((vid) => byId.get(vid))
    .filter((v) => v && !v.live && v.embeddable !== false && v.duration >= MIN_SONG_SECONDS);
  await saveYouTubeCache(key, songs);
  return songs;
}

/**
 * Search: up to 20 videos that can be played inside apps.
 * channel (optional, an artist's channel ID or @handle): the newest songs from that channel instead.
 * When YouTube cannot be asked (the day's allowance is used up), the last answer is shown again.
 */
export async function searchVideos(q, channel = '') {
  const query = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (!query) throw new HttpError(400, 'What should we search for?');
  const key = `search:${query.toLowerCase()}`;
  const cached = await cachedYouTube(key, SEARCH_MAX_AGE);
  if (cached) return cached;
  try {
    const wanted = String(channel || '').trim();
    if (isChannelKey(wanted)) {
      let uploads = [];
      try {
        uploads = await channelUploads(wanted);
      } catch (err) {
        if (err && err.status === 429) throw err; // allowance used up: a keyword search would fail too
      }
      if (uploads.length >= MIN_UPLOADS) {
        await saveYouTubeCache(key, uploads);
        return uploads;
      }
    }
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
  } catch (err) {
    const old = await cachedYouTube(key, STALE_MAX_AGE).catch(() => null);
    if (old) return old;
    throw err;
  }
}
