// ═════════════════════════════════════════════════════════════════════════
//  SELAH — YOUTUBE
//  Search uses YouTube's official search (YouTube API Services) through
//  Selah's server, which keeps the key (selah-api › /api/youtube/search).
//  Selah never reads YouTube's website directly. Videos play in YouTube's
//  own player. Saved videos get fresh details at least every 30 days.
// ═════════════════════════════════════════════════════════════════════════
import { call, isCloudReady } from './apiClient';

/** Saved videos are refreshed when their details are older than this (YouTube's limit is 30 days) */
export const VIDEO_REFRESH_AGE = 25 * 24 * 60 * 60 * 1000;

/**
 * Extracts a YouTube Video ID from any standard link, short link, or raw ID.
 */
export function extractVideoId(input) {
  if (!input) return null;
  const str = String(input).trim();
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match) return match[1];
  if (/^[\w-]{11}$/.test(str)) return str;
  return null;
}

/** A video from Selah's server → a Selah song */
export function videoToTrack(video) {
  return {
    id: `yt-${video.youtubeId}`,
    title: video.title || 'YouTube video',
    artist: video.channel || 'YouTube',
    album: 'YouTube Watch',
    duration: video.duration || 0,
    durationFormatted: video.durationFormatted || '',
    youtubeId: video.youtubeId,
    sourceType: 'youtube',
    coverUrl: video.picture || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
    checkedAt: Date.now()
  };
}

/** YouTube's official search, through Selah's server. Nothing found (or offline): [] */
export async function searchYouTube(query, maxResults = 20) {
  const q = String(query || '').trim();
  if (!q || !isCloudReady()) return [];
  try {
    const res = await call(`/api/youtube/search?q=${encodeURIComponent(q)}`, { timeout: 12000 });
    return (res.results || []).slice(0, maxResults).map(videoToTrack);
  } catch {
    return [];
  }
}

/**
 * Fresh details for saved videos (up to 50). Returns the songs YouTube still has;
 * a saved video missing from them no longer exists. null = could not check now (offline).
 */
export async function videoDetails(ids) {
  const clean = (ids || []).filter((id) => /^[\w-]{11}$/.test(id)).slice(0, 50);
  if (!isCloudReady() || clean.length === 0) return null;
  try {
    const res = await call(`/api/youtube/videos?ids=${clean.join(',')}`, { timeout: 12000 });
    return (res.videos || []).map(videoToTrack);
  } catch {
    return null;
  }
}

export const YouTubeService = {
  extractVideoId,
  searchYouTube,
  videoDetails
};

export default YouTubeService;
