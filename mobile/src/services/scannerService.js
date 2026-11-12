// ═════════════════════════════════════════════════════════════════════════
//  SELAH — MUSIC SCANNER
//
//  Android: reads the phone's media index (MediaStore) and lists EVERY audio
//           file Android knows about, in every format and folder (internal
//           storage and SD card), page by page with no limit.
//  iPhone:  Apple does not let any app read the whole phone storage or other
//           apps' music. Expo's media library only reaches the Photos app.
//           So Selah scans its own folder instead:
//           Files app › On My iPhone › Selah  (imported songs are saved there too).
// ═════════════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import { Directory, File, Paths } from 'expo-file-system';
import { Id3Service } from './id3Service';

// Every common audio file type
export const AUDIO_EXTENSIONS = [
  'mp3', 'mp2', 'mpga', 'm4a', 'm4b', 'm4p', 'mp4a', 'aac', 'adts', 'wav', 'wave', 'flac',
  'ogg', 'oga', 'opus', 'wma', 'aif', 'aiff', 'aifc', 'caf', 'alac', 'amr', 'awb', '3ga',
  'mid', 'midi', 'xmf', 'mxmf', 'rtttl', 'imy', 'ota', 'mka', 'weba', 'ac3', 'eac3',
  'ape', 'wv', 'dsf', 'dff', 'spx', 'tta'
];

// Formats the phone's built-in decoders cannot play (we still list them, and explain on tap)
const NOT_PLAYABLE = {
  android: ['wma', 'ape', 'wv', 'dsf', 'dff', 'tta', 'mid', 'midi', 'xmf', 'mxmf', 'rtttl', 'imy', 'ota', 'spx'],
  ios: [
    'wma', 'ape', 'wv', 'dsf', 'dff', 'tta', 'ogg', 'oga', 'opus', 'spx', 'amr', 'awb', '3ga',
    'mka', 'weba', 'mid', 'midi', 'xmf', 'mxmf', 'rtttl', 'imy', 'ota'
  ]
};

// Phone sounds and private recordings are not music, so they are skipped
const EXCLUDED_PATHS = [
  /\/(notifications?|ringtones?|alarms?)\//i,
  /whatsapp voice notes/i,
  /\/(call ?recordings?|callrecord(?:ing)?s?)\//i
];

const PAGE_SIZE = 500;
const MAX_PAGES = 400; // up to 200,000 audio files
export const MUSIC_FOLDER_NAME = 'Selah Music';

const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export function getExtension(nameOrUri = '') {
  const clean = String(nameOrUri).split('?')[0].split('#')[0];
  const match = clean.match(/\.([a-z0-9]{1,5})$/i);
  return match ? match[1].toLowerCase() : '';
}

export function isAudioFileName(name) {
  return AUDIO_EXTENSIONS.includes(getExtension(name));
}

/** Returns the file type (e.g. 'wma') when this phone cannot play it, otherwise null */
export function unsupportedFormat(track) {
  if (!track || track.sourceType === 'youtube' || track.youtubeId || track.asset) return null;
  const ext = getExtension(track.uri || '');
  const list = NOT_PLAYABLE[Platform.OS] || [];
  return list.includes(ext) ? ext : null;
}

const isExcluded = (uri) => {
  const path = safeDecode(String(uri || ''));
  return EXCLUDED_PATHS.some((re) => re.test(path));
};

/** Android: asks for the "Music and audio" permission. iPhone needs no permission for Selah's own folder. */
export async function requestAudioPermissions() {
  if (Platform.OS !== 'android') return true;
  try {
    let perm = null;
    try {
      perm = await MediaLibrary.getPermissionsAsync(false, ['audio']);
    } catch {
      perm = await MediaLibrary.getPermissionsAsync();
    }
    if (perm && (perm.granted || perm.status === 'granted')) return true;
    if (perm && perm.canAskAgain === false) return false;

    try {
      perm = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
    } catch {
      perm = await MediaLibrary.requestPermissionsAsync();
    }
    return Boolean(perm && (perm.granted || perm.status === 'granted'));
  } catch (err) {
    console.log('Audio permission notice:', err);
    return false;
  }
}

// ── Selah's own folder (Documents) ─────────────────────────────────────────

/** Files app › On My iPhone › Selah › Selah Music (on Android: the app's private storage) */
export function getMusicFolder() {
  const dir = new Directory(Paths.document, MUSIC_FOLDER_NAME);
  try {
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  } catch (err) {
    console.log('Music folder notice:', err);
  }
  return dir;
}

function documentRelativePath(uri) {
  const base = String(Paths.document.uri || '').replace(/\/?$/, '/');
  const value = String(uri || '');
  return safeDecode(value.startsWith(base) ? value.slice(base.length) : value);
}

/** Turns a file in Selah's folder into a track. The id stays the same between app updates. */
export function fileToTrack(file, folderName) {
  const meta = Id3Service.parseFilenameMetadata(file.name);
  const now = Date.now();
  return {
    id: `local-doc-${documentRelativePath(file.uri)}`,
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    folder: folderName || MUSIC_FOLDER_NAME,
    duration: 0,
    category: 'local',
    sourceType: 'local',
    uri: file.uri,
    coverUrl: Id3Service.generateCuratedArtwork(meta.title, meta.artist),
    addedAt: now,
    scannedAt: now
  };
}

function scanAppFolder() {
  const tracks = [];
  const walk = (dir, depth) => {
    if (depth > 8) return;
    let entries = [];
    try {
      entries = dir.list();
    } catch {
      return;
    }
    entries.forEach((entry) => {
      if (entry instanceof Directory) {
        if (!entry.name.startsWith('.')) walk(entry, depth + 1);
      } else if (entry instanceof File && isAudioFileName(entry.name)) {
        tracks.push(fileToTrack(entry, depth === 0 ? MUSIC_FOLDER_NAME : dir.name));
      }
    });
  };
  try {
    walk(Paths.document, 0);
  } catch (err) {
    console.log('App folder scan notice:', err);
  }
  return tracks;
}

// ── Android media index ────────────────────────────────────────────────────

async function scanAndroidMediaStore(onProgress) {
  const tracks = [];
  const seen = new Set();
  const add = (asset) => {
    const uri = asset && asset.uri;
    if (!uri || seen.has(uri) || isExcluded(uri)) return;
    seen.add(uri);
    tracks.push(Id3Service.enrichAsset(asset));
  };

  // Pass 1: everything Android lists as audio (all formats, all folders, SD card included)
  let after;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: PAGE_SIZE,
      after
    });
    const before = tracks.length;
    (res?.assets || []).forEach(add);
    if (onProgress) onProgress(tracks.length, tracks.slice(before));
    if (!res?.hasNextPage || !res.endCursor || res.endCursor === after) break;
    after = res.endCursor;
  }

  // Pass 2: audio files Android did not label as audio (older phones can see these)
  try {
    let afterOther;
    for (let page = 0; page < 40; page++) {
      const res = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.unknown,
        first: PAGE_SIZE,
        after: afterOther
      });
      const before = tracks.length;
      (res?.assets || []).forEach((asset) => {
        if (isAudioFileName(asset.filename || asset.uri)) add(asset);
      });
      if (onProgress && tracks.length > before) onProgress(tracks.length, tracks.slice(before));
      if (!res?.hasNextPage || !res.endCursor || res.endCursor === afterOther) break;
      afterOther = res.endCursor;
    }
  } catch {
    // Newer Android only allows the audio list with audio permission — that's fine.
  }

  return tracks;
}

/**
 * Finds every song Selah can reach.
 * Returns { success, tracks, platformScan, error? }.
 */
export async function scanDeviceAudio({ onProgress } = {}) {
  const fromAppFolder = scanAppFolder();
  if (onProgress && fromAppFolder.length > 0) onProgress(fromAppFolder.length, fromAppFolder);

  if (Platform.OS !== 'android') {
    return { success: true, tracks: fromAppFolder, platformScan: 'app-folder' };
  }

  const allowed = await requestAudioPermissions();
  if (!allowed) {
    return { success: false, tracks: fromAppFolder, platformScan: 'android', error: 'Permission not granted' };
  }

  try {
    const fromPhone = await scanAndroidMediaStore(
      onProgress ? (count, page) => onProgress(fromAppFolder.length + count, page) : undefined
    );
    return { success: true, tracks: [...fromPhone, ...fromAppFolder], platformScan: 'android' };
  } catch (err) {
    console.log('Scan device audio notice:', err);
    return { success: false, tracks: fromAppFolder, platformScan: 'android', error: err?.message || 'Scan failed' };
  }
}

// ── Import from Files ──────────────────────────────────────────────────────

function uniqueDestination(folder, fileName, sourceSize) {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot) : '';
  let candidate = new File(folder, fileName);
  for (let i = 1; i < 500 && candidate.exists; i++) {
    // Same name and same size: it's the same song, reuse it instead of copying again
    if (sourceSize && candidate.size === sourceSize) return { file: candidate, reuse: true };
    candidate = new File(folder, `${base} (${i})${ext}`);
  }
  return { file: candidate, reuse: false };
}

/**
 * Copies picked songs into Selah's own folder so they keep working after the
 * phone clears temporary files. Returns tracks ready for the library.
 */
export async function importPickedFiles(pickedAssets = []) {
  const folder = getMusicFolder();
  const imported = [];
  for (let i = 0; i < pickedAssets.length; i++) {
    const picked = pickedAssets[i];
    const name = picked.name || `Song ${Date.now()}-${i}.mp3`;
    try {
      const source = new File(picked.uri);
      const { file: destination, reuse } = uniqueDestination(folder, name, picked.size || source.size);
      if (!reuse) await source.copy(destination);
      imported.push(fileToTrack(destination, MUSIC_FOLDER_NAME));
    } catch (err) {
      console.log('Import copy notice:', err);
      // Could not copy: keep the picked file as it is
      const meta = Id3Service.parseFilenameMetadata(name);
      imported.push({
        id: `local-${Date.now()}-${i}`,
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        folder: 'Imported Files',
        duration: 0,
        category: 'local',
        sourceType: 'local',
        uri: picked.uri,
        coverUrl: Id3Service.generateCuratedArtwork(meta.title, meta.artist),
        addedAt: Date.now(),
        scannedAt: Date.now()
      });
    }
  }
  return imported;
}

export const ScannerService = {
  requestAudioPermissions,
  scanDeviceAudio,
  importPickedFiles,
  getMusicFolder,
  isAudioFileName,
  unsupportedFormat,
  AUDIO_EXTENSIONS
};

export default ScannerService;
