// ═════════════════════════════════════════════════════════════════════════
//  SELAH — CLOUD (backup & restore, shared lyrics)
//  Talks to Selah's small service on Vercel (folder selah-api/).
//  • No account or e-mail: each phone gets a private backup code
//    (like ABCD-EFGH-JKLM-NPQR-STUV). Type it on a new phone to restore.
//  • Your songs are never uploaded: only playlists, loved songs, play counts
//    and lyrics you typed, with each song's name so it can be found again.
//  • Switched off until the service address is set in app.json
//    (expo.extra.selahApiUrl).
// ═════════════════════════════════════════════════════════════════════════
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import AsyncStoragePackage from '@react-native-async-storage/async-storage';
import { songKey } from './songKey';

const AsyncStorage = AsyncStoragePackage?.default || AsyncStoragePackage;
const CODE_KEY = '@selah_backup_code';
const LAST_BACKUP_KEY = '@selah_last_backup';
const AUTO_KEY = '@selah_auto_backup';
const LYRICS_PREFIX = '@selah_lyrics_';
const NOT_LYRICS = /^@selah_lyrics_(cache|offset)_/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1: easy to read out
export const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){4}$/;

export class CloudError extends Error {
  constructor(kind, message, status) {
    super(message);
    this.kind = kind; // 'not-configured' | 'offline' | 'not-found' | 'bad-code' | 'http'
    this.status = status;
  }
}

// ── Where the service lives ─────────────────────────────────────────────────
let urlForTests = null;
export function setApiUrlForTests(url) {
  urlForTests = url;
}
export function apiUrl() {
  const url = urlForTests ?? Constants.expoConfig?.extra?.selahApiUrl ?? '';
  return String(url || '').trim().replace(/\/+$/, '');
}
export const isCloudReady = () => Boolean(apiUrl());

async function call(path, { method = 'GET', code, body, timeout = 15000 } = {}) {
  const base = apiUrl();
  if (!base) throw new CloudError('not-configured', 'Selah cloud is not set up yet.');
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(code ? { Authorization: `Bearer ${code}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined
    });
  } catch {
    throw new CloudError('offline', 'Could not reach Selah cloud. Check your internet connection and try again.');
  } finally {
    if (timer) clearTimeout(timer);
  }
  let data = {};
  try {
    data = (await res.json()) || {};
  } catch {}
  if (!res.ok) {
    const kind = res.status === 404 ? 'not-found' : res.status === 401 ? 'bad-code' : 'http';
    throw new CloudError(kind, data.error || `Selah cloud answered with an error (${res.status}).`, res.status);
  }
  return data;
}

// ── Backup code ─────────────────────────────────────────────────────────────
export function makeCode(bytes = Crypto.getRandomBytes(20)) {
  let raw = '';
  for (let i = 0; i < 20; i++) raw += ALPHABET[bytes[i] % 32]; // 256 is a multiple of 32: every letter equally likely
  return raw.match(/.{4}/g).join('-');
}

/** Accepts the code however it was typed (spaces, dashes, small letters); null if it can't be right */
export function normalizeCode(input) {
  const raw = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length !== 20) return null;
  const code = raw.match(/.{4}/g).join('-');
  return CODE_PATTERN.test(code) ? code : null;
}

export async function getBackupCode() {
  let code = null;
  try {
    code = normalizeCode(await AsyncStorage.getItem(CODE_KEY));
  } catch {}
  if (!code) {
    code = makeCode();
    await AsyncStorage.setItem(CODE_KEY, code);
  }
  return code;
}

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
  const code = await getBackupCode();
  const data = await buildBackup(state);
  const result = await call('/api/backup', { method: 'PUT', code, body: { data } });
  await AsyncStorage.setItem(LAST_BACKUP_KEY, result.savedAt || new Date().toISOString());
  return { ...result, playlists: data.playlists.length, songs: Object.keys(data.songs).length };
}

/** Once a day at most, only if you turned automatic backup on */
export async function autoBackupIfDue(state) {
  if (!isCloudReady()) return false;
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
  const code = await getBackupCode();
  const result = await call('/api/backup', { method: 'DELETE', code });
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

/** Downloads the backup for a code and fits it to the songs on this phone */
export async function fetchRestore(codeInput, tracks) {
  const code = normalizeCode(codeInput);
  if (!code) throw new CloudError('bad-code', 'That code is not complete. It looks like ABCD-EFGH-JKLM-NPQR-STUV.');
  let answer;
  try {
    answer = await call('/api/backup', { code });
  } catch (err) {
    if (err.kind === 'not-found') throw new CloudError('not-found', 'There is no backup for that code.');
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
    code,
    savedAt: answer.savedAt,
    playlists: (data.playlists || []).map((pl) => ({ ...pl, trackIds: mapIds(pl.trackIds) })),
    favorites: mapIds(data.favorites),
    playCounts: remap(data.playCounts),
    lyrics: remap(data.lyrics),
    found: Object.keys(idMap).length,
    total: Object.keys(data.songs || {}).length
  };
}

/** After restoring, this phone keeps backing up to the same place */
export async function adoptBackupCode(code) {
  const clean = normalizeCode(code);
  if (clean) await AsyncStorage.setItem(CODE_KEY, clean);
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
  const code = await getBackupCode();
  return call('/api/lyrics', { method: 'POST', code, body: { title, artist, duration, text, synced } });
}

export async function reportSharedLyrics(id) {
  const code = await getBackupCode();
  return call('/api/lyrics/report', { method: 'POST', code, body: { id } });
}
