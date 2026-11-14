// ═════════════════════════════════════════════════════════════════════════
//  SELAH — ARTISTS' PICTURES
//  Each gospel artist in Libraries shows their own YouTube channel picture,
//  from YouTube's official service through Selah's server.
//  YouTube's rules: say the pictures come from YouTube (Libraries and Home
//  do), and refresh stored details within 30 days: Selah asks again after
//  25 days and never shows a picture list older than 30 days.
//  No picture (offline, not set up): the artist's initials, as before.
// ═════════════════════════════════════════════════════════════════════════
import AsyncStoragePackage from '@react-native-async-storage/async-storage';
import { call, isCloudReady } from './apiClient';

const AsyncStorage = AsyncStoragePackage?.default || AsyncStoragePackage;
const KEY = '@selah_artist_pictures';
const DAY = 24 * 60 * 60 * 1000;
export const PICTURES_REFRESH_AGE = 25 * DAY;
export const PICTURES_MAX_AGE = 30 * DAY;
const RETRY_AFTER = 5 * 60 * 1000; // when the server could not answer, wait a bit before asking again

let lastFailedAt = 0;

export function resetArtistPicturesForTests() {
  lastFailedAt = 0;
}

async function readSaved() {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(KEY)) || 'null');
    return saved && typeof saved.savedAt === 'number' && saved.channels ? saved : null;
  } catch {
    return null;
  }
}

/** { "<channel ID or @handle>": "<picture>" ('' when YouTube has no such channel) }, or null if Selah could not ask */
async function askServer(keys, now) {
  if (!isCloudReady() || now - lastFailedAt < RETRY_AFTER) return null;
  try {
    const res = await call(`/api/youtube/channels?ids=${encodeURIComponent(keys.join(','))}`, { timeout: 12000 });
    const channels = {};
    keys.forEach((k) => {
      const found = res && res.channels && res.channels[k];
      channels[k] = (found && found.picture) || '';
    });
    return channels;
  } catch {
    lastFailedAt = now;
    return null;
  }
}

/** { "<artist name>": "<picture>" } for the artists that have a picture now; {} when none can be shown */
export async function loadArtistPictures(artists, now = Date.now()) {
  const wanted = (artists || []).filter((a) => a && a.name && a.youtube);
  const keys = [...new Set(wanted.map((a) => a.youtube))];
  if (keys.length === 0) return {};

  let saved = await readSaved();
  const age = saved ? now - saved.savedAt : Infinity;
  const hasAll = saved && keys.every((k) => k in saved.channels);
  if (!saved || age > PICTURES_REFRESH_AGE || !hasAll) {
    const fresh = await askServer(keys, now);
    if (fresh) {
      saved = { savedAt: now, channels: fresh };
      await AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
    } else if (saved && age > PICTURES_MAX_AGE) {
      saved = null; // older than YouTube's 30 days: not shown any more
      await AsyncStorage.removeItem(KEY).catch(() => {});
    }
  }
  if (!saved) return {};

  const pictures = {};
  wanted.forEach((a) => {
    const picture = saved.channels[a.youtube];
    if (picture) pictures[a.name] = picture;
  });
  return pictures;
}
