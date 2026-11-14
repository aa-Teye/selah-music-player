// ═════════════════════════════════════════════════════════════════════════
//  SELAH — CLOUD BACKUP (Premium) & SHARED LYRICS
//  • Backup & restore need a Selah account with Premium. Log in on a new
//    phone and tap Restore: playlists, loved songs, play counts and the
//    lyrics you typed come back.
//  • Your songs are never uploaded: only those lists, with each song's
//    name so it can be found again on another phone.
//  • Lyrics shared by Selah users can be read by everyone; sharing and
//    reporting need a (free) account.
// ═════════════════════════════════════════════════════════════════════════
import AsyncStoragePackage from '@react-native-async-storage/async-storage';
import { call, isCloudReady, getToken, CloudError } from './apiClient';
import { songKey } from './songKey';

export { apiUrl, isCloudReady, setApiUrlForTests, CloudError } from './apiClient';

const AsyncStorage = AsyncStoragePackage?.default || AsyncStoragePackage;
const LAST_BACKUP_KEY = '@selah_last_backup';
const AUTO_KEY = '@selah_auto_backup';
const LYRICS_PREFIX = '@selah_lyrics_';
const NOT_LYRICS = /^@selah_lyrics_(cache|offset)_/;

export async function getBackupStatus() {
  const [last, auto] = await Promise.all([AsyncStorage.getItem(LAST_BACKUP_KEY), AsyncStorage.getItem(AUTO_KEY)]);
  return { lastBackupAt: last || null, auto: auto === 'true' };
}

export async function setAutoBackup(on) {
  await AsyncStorage.setItem(AUTO_KEY, on ? 'true' : 'false');
}

// ── Backup ──────────────────────────────────────────────────────────────────
const cleanArtists = (list) => [
  ...new Set((Array.isArray(list) ? list : []).filter((n) => typeof n === 'string' && n.trim()).map((n) => n.trim()))
];
const YOUTUBE_ID = /^[\w-]{11}$/;

/**
 * Everything worth keeping, with each song's name so it can be found on another phone.
 * artists: the artists you follow. getBack: songs from an earlier restore that are not
 * on this phone yet (they stay in your account until you have them again).
 */
export async function buildBackup({ tracks = [], playlists = [], favorites = [], playCounts = {}, artists = [], getBack = [] }) {
  const byId = new Map(tracks.filter(Boolean).map((t) => [t.id, t]));
  const songs = {};
  const remember = (id) => {
    const t = byId.get(id);
    if (!t || songs[id]) return Boolean(songs[id]);
    // YouTube songs: only the video's ID. YouTube's rules don't let apps keep its titles and
    // pictures for more than 30 days; they are fetched fresh after a restore.
    songs[id] = t.youtubeId ? { y: t.youtubeId } : { t: t.title || '', a: t.artist || '', d: Math.round(t.duration || 0) };
    return true;
  };
  playlists.forEach((pl) => (pl.trackIds || []).forEach(remember));
  favorites.forEach(remember);

  const counts = {};
  Object.keys(playCounts || {}).forEach((id) => {
    if (remember(id)) counts[id] = playCounts[id];
  });

  const lyrics = {};
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(LYRICS_PREFIX) && !NOT_LYRICS.test(k));
    const pairs = keys.length ? await AsyncStorage.multiGet(keys) : [];
    pairs.forEach(([key, value]) => {
      const id = key.slice(LYRICS_PREFIX.length);
      if (value && remember(id)) lyrics[id] = value;
    });
  } catch {}

  const outPlaylists = playlists.map((pl) => ({ id: pl.id, name: pl.name, trackIds: (pl.trackIds || []).filter((id) => songs[id]) }));
  const outFavorites = favorites.filter((id) => songs[id]);

  // Songs still to get back keep their place in your playlists
  (getBack || []).forEach((g) => {
    if (!g || !g.title) return;
    const id = `getback:${g.key || songKey(g.title, g.artist)}`;
    if (songs[id]) return;
    songs[id] = { t: g.title, a: g.artist || '', d: Math.round(g.duration || 0) };
    (g.playlists || []).forEach((plId) => {
      const pl = outPlaylists.find((p) => p.id === plId);
      if (pl && !pl.trackIds.includes(id)) pl.trackIds.push(id);
    });
    if (g.loved && !outFavorites.includes(id)) outFavorites.push(id);
  });

  return {
    version: 1,
    app: 'selah',
    createdAt: new Date().toISOString(),
    songs,
    playlists: outPlaylists,
    favorites: outFavorites,
    playCounts: counts,
    lyrics,
    artists: cleanArtists(artists)
  };
}

export async function backupNow(state) {
  const data = await buildBackup(state);
  const result = await call('/api/backup', { method: 'PUT', auth: true, body: { data } });
  await AsyncStorage.setItem(LAST_BACKUP_KEY, result.savedAt || new Date().toISOString());
  return { ...result, playlists: data.playlists.length, songs: Object.keys(data.songs).length };
}

/** Once a day at most, only if you turned automatic backup on (and are logged in with Premium) */
export async function autoBackupIfDue(state) {
  if (!isCloudReady() || !(await getToken())) return false;
  const { lastBackupAt, auto } = await getBackupStatus();
  if (!auto) return false;
  if (lastBackupAt && Date.now() - Date.parse(lastBackupAt) < 24 * 60 * 60 * 1000) return false;
  try {
    await backupNow(state);
    return true;
  } catch {
    return false;
  }
}

export async function deleteBackup() {
  const result = await call('/api/backup', { method: 'DELETE', auth: true });
  await AsyncStorage.removeItem(LAST_BACKUP_KEY);
  return result.deleted;
}

// ── Restore ─────────────────────────────────────────────────────────────────
/** Finds each backed-up song on this phone (same id, same YouTube video, or same name, artist and length) */
export function matchSongs(backupSongs = {}, tracks = []) {
  const here = new Map(tracks.filter(Boolean).map((t) => [t.id, t]));
  const byVideo = new Map(tracks.filter((t) => t && t.youtubeId).map((t) => [t.youtubeId, t]));
  const byName = new Map();
  tracks.forEach((t) => {
    if (!t) return;
    const key = songKey(t.title, t.artist);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(t);
  });
  const idMap = {};
  Object.keys(backupSongs).forEach((oldId) => {
    if (here.has(oldId)) {
      idMap[oldId] = oldId;
      return;
    }
    const s = backupSongs[oldId] || {};
    if (s.y && byVideo.has(s.y)) {
      idMap[oldId] = byVideo.get(s.y).id;
      return;
    }
    if (!s.t) return; // a video ID only: it comes back as a YouTube song
    const options = byName.get(songKey(s.t, s.a)) || [];
    const best = options.find((t) => !s.d || !t.duration || Math.abs(t.duration - s.d) <= 3) || options[0];
    if (best) idMap[oldId] = best.id;
  });
  return idMap;
}

/** Downloads your backup and fits it to the songs on this phone */
export async function fetchRestore(tracks) {
  let answer;
  try {
    answer = await call('/api/backup', { auth: true });
  } catch (err) {
    if (err.kind === 'not-found') throw new CloudError('not-found', 'There is no backup in your account yet.');
    throw err;
  }
  const data = answer.data || {};
  const backupSongs = data.songs || {};
  const idMap = matchSongs(backupSongs, tracks);

  // YouTube songs need no file on the phone: they come straight back
  const youtube = [];
  Object.keys(backupSongs).forEach((oldId) => {
    const s = backupSongs[oldId] || {};
    if (idMap[oldId] || !s.y || !YOUTUBE_ID.test(s.y)) return;
    const id = `yt-${s.y}`;
    if (!youtube.some((t) => t.id === id)) {
      youtube.push({
        id,
        title: s.t || 'YouTube video',
        artist: s.a || 'YouTube',
        album: 'YouTube Watch',
        duration: s.d || 0,
        youtubeId: s.y,
        sourceType: 'youtube',
        coverUrl: `https://img.youtube.com/vi/${s.y}/hqdefault.jpg`
      });
    }
    idMap[oldId] = id;
  });

  // The rest are songs to get back: not on this phone yet
  const missing = Object.keys(backupSongs)
    .filter((oldId) => !idMap[oldId] && backupSongs[oldId] && backupSongs[oldId].t)
    .map((oldId) => {
      const s = backupSongs[oldId];
      return {
        key: songKey(s.t, s.a),
        title: s.t,
        artist: s.a || '',
        duration: s.d || 0,
        playlists: (data.playlists || []).filter((pl) => (pl.trackIds || []).includes(oldId)).map((pl) => pl.id),
        loved: (data.favorites || []).includes(oldId)
      };
    });

  const mapIds = (ids) => [...new Set((ids || []).map((id) => idMap[id]).filter(Boolean))];
  const remap = (obj) => {
    const out = {};
    Object.keys(obj || {}).forEach((id) => {
      if (idMap[id]) out[idMap[id]] = obj[id];
    });
    return out;
  };
  return {
    savedAt: answer.savedAt,
    playlists: (data.playlists || []).map((pl) => ({ ...pl, trackIds: mapIds(pl.trackIds) })),
    favorites: mapIds(data.favorites),
    playCounts: remap(data.playCounts),
    lyrics: remap(data.lyrics),
    artists: cleanArtists(data.artists),
    youtube,
    missing,
    found: Object.keys(idMap).length,
    total: Object.keys(backupSongs).length
  };
}

// ── Lyrics shared between Selah users ───────────────────────────────────────
// Google Play's rules for things users share: accept the rules before sharing, report lyrics
// or the person who shared them, and hide everything from a person.
const SHARING_RULES_KEY = '@selah_sharing_rules';
const HIDDEN_AUTHORS_KEY = '@selah_hidden_authors';
export const SHARING_RULES_VERSION = '2026-11-14'; // the rules in /terms

export async function sharingRulesAccepted() {
  return (await AsyncStorage.getItem(SHARING_RULES_KEY)) === SHARING_RULES_VERSION;
}

export async function acceptSharingRules() {
  await AsyncStorage.setItem(SHARING_RULES_KEY, SHARING_RULES_VERSION);
}

/** The people you hid (anonymous author codes) */
export async function hiddenAuthors() {
  try {
    const list = JSON.parse((await AsyncStorage.getItem(HIDDEN_AUTHORS_KEY)) || '[]');
    return Array.isArray(list) ? list.filter((code) => /^[a-f0-9]{16}$/.test(code)) : [];
  } catch {
    return [];
  }
}

/** Never show lyrics from this person again (works without an account) */
export async function hideAuthor(code) {
  if (!/^[a-f0-9]{16}$/.test(code || '')) return false;
  const list = await hiddenAuthors();
  if (!list.includes(code)) list.push(code);
  await AsyncStorage.setItem(HIDDEN_AUTHORS_KEY, JSON.stringify(list.slice(-100)));
  return true;
}

export async function findSharedLyrics({ title, artist, duration }) {
  if (!isCloudReady() || !title) return null;
  const hide = await hiddenAuthors();
  const params = `title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist || '')}${
    duration > 0 ? `&duration=${Math.round(duration)}` : ''
  }${hide.length ? `&hide=${hide.join(',')}` : ''}`;
  try {
    const res = await call(`/api/lyrics?${params}`, { timeout: 8000 });
    return res && res.found && res.lyrics ? res.lyrics : null;
  } catch {
    return null; // lyrics from other users are a bonus: never an error
  }
}

/** Only after the sharing rules were accepted (sharingRulesAccepted / acceptSharingRules) */
export async function shareLyrics({ title, artist, duration, text, synced }) {
  return call('/api/lyrics', {
    method: 'POST',
    auth: true,
    body: { title, artist, duration, text, synced, agreedToRules: true }
  });
}

/** person: also report the person who shared them */
export async function reportSharedLyrics(id, { person = false } = {}) {
  return call('/api/lyrics/report', { method: 'POST', auth: true, body: person ? { id, person: true } : { id } });
}
