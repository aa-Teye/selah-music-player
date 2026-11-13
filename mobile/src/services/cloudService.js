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
/** Everything worth keeping, with each song's name so it can be found on another phone */
export async function buildBackup({ tracks = [], playlists = [], favorites = [], playCounts = {} }) {
  const byId = new Map(tracks.filter(Boolean).map((t) => [t.id, t]));
  const songs = {};
  const remember = (id) => {
    const t = byId.get(id);
    if (!t || songs[id]) return Boolean(songs[id]);
    songs[id] = { t: t.title || '', a: t.artist || '', d: Math.round(t.duration || 0) };
    if (t.youtubeId) songs[id].y = t.youtubeId;
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

  return {
    version: 1,
    app: 'selah',
    createdAt: new Date().toISOString(),
    songs,
    playlists: playlists.map((pl) => ({ id: pl.id, name: pl.name, trackIds: (pl.trackIds || []).filter((id) => songs[id]) })),
    favorites: favorites.filter((id) => songs[id]),
    playCounts: counts,
    lyrics
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
/** Finds each backed-up song on this phone (same id, or same name, artist and length) */
export function matchSongs(backupSongs = {}, tracks = []) {
  const here = new Map(tracks.filter(Boolean).map((t) => [t.id, t]));
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
  const idMap = matchSongs(data.songs, tracks);
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
    found: Object.keys(idMap).length,
    total: Object.keys(data.songs || {}).length
  };
}

// ── Lyrics shared between Selah users ───────────────────────────────────────
export async function findSharedLyrics({ title, artist, duration }) {
  if (!isCloudReady() || !title) return null;
  const params = `title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist || '')}${
    duration > 0 ? `&duration=${Math.round(duration)}` : ''
  }`;
  try {
    const res = await call(`/api/lyrics?${params}`, { timeout: 8000 });
    return res && res.found && res.lyrics ? res.lyrics : null;
  } catch {
    return null; // lyrics from other users are a bonus: never an error
  }
}

export async function shareLyrics({ title, artist, duration, text, synced }) {
  return call('/api/lyrics', { method: 'POST', auth: true, body: { title, artist, duration, text, synced } });
}

export async function reportSharedLyrics(id) {
  return call('/api/lyrics/report', { method: 'POST', auth: true, body: { id } });
}
