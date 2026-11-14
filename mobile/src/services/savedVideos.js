// ═════════════════════════════════════════════════════════════════════════
//  SELAH — SAVED YOUTUBE VIDEOS STAY FRESH
//  YouTube's rules: details of saved videos (title, channel, picture) must be
//  refreshed within 30 days, and removed when the video no longer exists.
//  Selah checks videos older than 25 days each time it opens.
// ═════════════════════════════════════════════════════════════════════════
import { videoDetails, VIDEO_REFRESH_AGE } from './youtubeService';

/** Saved YouTube songs whose details are older than 25 days (or were never checked) */
export function videosDue(tracks, now = Date.now()) {
  return (tracks || []).filter((t) => t && t.youtubeId && (!t.checkedAt || now - t.checkedAt > VIDEO_REFRESH_AGE));
}

/**
 * Asks YouTube (through Selah's server) about those videos, 50 at a time.
 * → { fresh: Map(youtubeId → song), gone: Set(youtubeId) }, or null if Selah could not check (offline).
 */
export async function checkVideos(due) {
  const fresh = new Map();
  const gone = new Set();
  for (let i = 0; i < due.length; i += 50) {
    const batch = due.slice(i, i + 50);
    const answer = await videoDetails(batch.map((t) => t.youtubeId));
    if (answer === null) return fresh.size || gone.size ? { fresh, gone } : null;
    const byId = new Map(answer.map((v) => [v.youtubeId, v]));
    batch.forEach((t) => {
      const v = byId.get(t.youtubeId);
      if (v) fresh.set(t.youtubeId, v);
      else gone.add(t.youtubeId);
    });
  }
  return { fresh, gone };
}

/** The song list with fresh details, and without videos that no longer exist */
export function applyVideoCheck(tracks, { fresh, gone }) {
  return tracks
    .filter((t) => !(t && t.youtubeId && gone.has(t.youtubeId)))
    .map((t) => {
      const v = t && t.youtubeId && fresh.get(t.youtubeId);
      if (!v) return t;
      return {
        ...t,
        title: v.title,
        artist: v.artist,
        coverUrl: v.coverUrl,
        duration: v.duration || t.duration,
        durationFormatted: v.durationFormatted || t.durationFormatted,
        checkedAt: v.checkedAt
      };
    });
}
