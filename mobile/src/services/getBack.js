// ═════════════════════════════════════════════════════════════════════════
//  SELAH — SONGS TO GET BACK
//  After a restore on a new phone, the songs from your backup that are not
//  on this phone are listed, with the playlists they belong to. Once a song
//  is on the phone (you copied or downloaded it), it goes back into those
//  playlists by itself and leaves the list.
//  An entry: { key, title, artist, duration, playlists: [playlistId], loved }
// ═════════════════════════════════════════════════════════════════════════
import { songKey } from './songKey';

const keyOf = (song) => song.key || songKey(song.title, song.artist);

/** Adds songs to the list without listing a song twice */
export function mergeGetBack(list = [], incoming = []) {
  const byKey = new Map();
  [...list, ...incoming].forEach((song) => {
    if (!song || !song.title) return;
    const key = keyOf(song);
    const old = byKey.get(key);
    byKey.set(
      key,
      old
        ? {
            ...old,
            playlists: [...new Set([...(old.playlists || []), ...(song.playlists || [])])],
            loved: Boolean(old.loved || song.loved)
          }
        : {
            key,
            title: song.title,
            artist: song.artist || '',
            duration: Math.round(song.duration || 0),
            playlists: [...new Set(song.playlists || [])],
            loved: Boolean(song.loved)
          }
    );
  });
  return [...byKey.values()];
}

/** Which songs on the list are on this phone now: { found: [{ song, track }], still: [song] } */
export function findGotBack(list = [], tracks = []) {
  if (!list.length) return { found: [], still: list };
  const byKey = new Map();
  tracks.forEach((t) => {
    if (!t || !t.title) return;
    const key = songKey(t.title, t.artist);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(t);
  });
  const found = [];
  const still = [];
  list.forEach((song) => {
    const options = byKey.get(keyOf(song)) || [];
    const best =
      options.find((t) => !song.duration || !t.duration || Math.abs(t.duration - song.duration) <= 3) || options[0];
    if (best) found.push({ song, track: best });
    else still.push(song);
  });
  return { found, still };
}

/** What to search on YouTube for a song */
export function getBackSearch(song) {
  return `${song.title} ${song.artist || ''}`.replace(/\s+/g, ' ').trim();
}
