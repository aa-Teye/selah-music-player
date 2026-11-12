// ═════════════════════════════════════════════════════════════════════════
//  SELAH — SONG COVERS
//  Saves the cover pictures found inside songs as small image files, so the
//  app can show your real album art (no internet needed).
//  • Songs from the same album share one picture file.
//  • Pictures live in the phone's cache folder: the system may clear them
//    when space is low, and the next scan simply finds them again.
// ═════════════════════════════════════════════════════════════════════════
import { Directory, File, Paths } from 'expo-file-system';
import { imageType, MAX_PICTURE_BYTES } from './tagReader';

const FOLDER = 'selah-covers';
export const COVER_BUDGET_BYTES = 300 * 1024 * 1024; // never use more than ~300 MB for covers

let folder = null;
let usedBytes = null;

function coversFolder() {
  if (!folder) folder = new Directory(Paths.cache, FOLDER);
  if (!folder.exists) {
    // first run, or the system just cleared the cache
    folder.create({ intermediates: true, idempotent: true });
    usedBytes = 0;
  }
  return folder;
}

/** A short name that is the same for identical pictures (so each is saved once). */
export function coverName(data, type) {
  let a = 0x811c9dc5; // FNV-1a
  let b = 5381; // djb2
  const mix = (x) => {
    a = Math.imul(a ^ x, 0x01000193) >>> 0;
    b = (Math.imul(b, 33) + x) >>> 0;
  };
  const n = data.length;
  mix(n & 255);
  mix((n >>> 8) & 255);
  mix((n >>> 16) & 255);
  const edge = Math.min(n, 4096);
  for (let i = 0; i < edge; i++) mix(data[i]);
  for (let i = Math.max(edge, n - 4096); i < n; i++) mix(data[i]);
  for (let i = edge; i < n - 4096; i += 61) mix(data[i]);
  return `${n.toString(36)}-${a.toString(36)}${b.toString(36)}.${type}`;
}

/**
 * Saves a cover picture ({ data, type }) and returns its file name,
 * or null if it isn't a usable picture or there's no room left.
 */
export function saveCover(picture) {
  try {
    if (!picture || !picture.data) return null;
    const { data } = picture;
    const type = imageType(data);
    if (!type || data.length < 64 || data.length > MAX_PICTURE_BYTES) return null;
    const dir = coversFolder();
    const name = coverName(data, type);
    const file = new File(dir, name);
    if (file.exists) return name;
    if (usedBytes === null) usedBytes = Number(dir.size) || 0;
    if (usedBytes + data.length > COVER_BUDGET_BYTES) return null;
    file.create();
    file.writeSync(data);
    usedBytes += data.length;
    return name;
  } catch {
    return null;
  }
}

/** The address to show a saved cover. */
export function coverUri(name) {
  return new File(coversFolder(), name).uri;
}

/** Names of the covers still on the phone (the system may have cleared some). */
export function savedCoverNames() {
  try {
    const dir = coversFolder();
    return new Set(dir.list().map((f) => f.name));
  } catch {
    return new Set();
  }
}

/** For tests: forget what we know about the covers folder. */
export function resetCoverStore() {
  folder = null;
  usedBytes = null;
}

export const CoverStore = { saveCover, coverUri, coverName, savedCoverNames, resetCoverStore };
export default CoverStore;
